import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { spawn } from "child_process";
import OpenAI from "openai";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { randomUUID } from "crypto";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";

// Helper to get user ID or session ID
function getUserOrSession(req: any): { userId?: string; sessionId?: string } {
  const userId = req.user?.claims?.sub;
  let sessionId = req.headers["x-session-id"] as string;
  
  if (!userId && !sessionId) {
    sessionId = randomUUID();
  }
  
  return { userId, sessionId: userId ? undefined : sessionId };
}

// Helper to check usage limits
async function checkUsageLimits(userId?: string, sessionId?: string): Promise<{
  canUseEditor: boolean;
  canUseAI: boolean;
  remainingMinutes?: number;
  remainingCredits?: number;
  subscriptionTier: string;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  // Non-authenticated users
  if (!userId) {
    const usage = sessionId ? await storage.getUserUsageBySession(sessionId, today) : undefined;
    const usedMinutes = usage?.usageMinutes || 0;
    const remainingMinutes = Math.max(0, 10 - usedMinutes);
    
    return {
      canUseEditor: remainingMinutes > 0,
      canUseAI: false,
      remainingMinutes,
      subscriptionTier: "trial",
    };
  }

  // Authenticated users
  const subscription = await storage.getUserSubscription(userId);
  const tier = subscription?.tier || "free";
  const usage = await storage.getUserUsage(userId, today);
  const credits = await storage.getUserCredits(userId, monthYear);

  let canUseEditor = true;
  let remainingMinutes: number | undefined;
  let creditsLimit = 7;

  // Check subscription-based limits
  if (tier === "premium") {
    creditsLimit = 40;
    const usedMinutes = usage?.usageMinutes || 0;
    const dailyLimit = 5 * 60; // 5 hours
    remainingMinutes = Math.max(0, dailyLimit - usedMinutes);
    canUseEditor = remainingMinutes > 0;
  } else if (tier === "premium_ultimate") {
    creditsLimit = 999999; // Effectively unlimited
    canUseEditor = true;
  }

  const creditsUsed = credits?.creditsUsed || 0;
  const remainingCredits = Math.max(0, creditsLimit - creditsUsed);
  const canUseAI = remainingCredits > 0;

  return {
    canUseEditor,
    canUseAI,
    remainingMinutes,
    remainingCredits,
    subscriptionTier: tier,
  };
}

// Execute terminal command in sandbox
async function executeCommand(command: string, language: string): Promise<{ output: string; error?: string }> {
  return new Promise((resolve) => {
    // Map language to executable
    const executors: Record<string, string[]> = {
      javascript: ["node", "-e"],
      typescript: ["tsx", "-e"],
      python: ["python3", "-c"],
      java: ["java", "--source", "17"],
      cpp: ["g++", "-x", "c++", "-", "-o", "/tmp/a.out", "&&", "/tmp/a.out"],
      rust: ["rustc", "-", "-o", "/tmp/a.out", "&&", "/tmp/a.out"],
      go: ["go", "run", "-"],
    };

    const executor = executors[language] || ["sh", "-c"];
    const isShell = executor[0] === "sh";

    const proc = spawn(executor[0], isShell ? [executor[1], command] : [...executor.slice(1), command], {
      timeout: 10000, // 10 second timeout
      shell: false,
    });

    let output = "";
    let error = "";

    proc.stdout?.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr?.on("data", (data) => {
      error += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0 && error) {
        resolve({ output, error });
      } else {
        resolve({ output: output || error });
      }
    });

    proc.on("error", (err) => {
      resolve({ output: "", error: err.message });
    });
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // Projects
  app.get(api.projects.list.path, async (req: any, res) => {
    try {
      const { userId, sessionId } = getUserOrSession(req);
      const projects = await storage.getProjects(userId, sessionId);
      res.json(projects);
    } catch (error) {
      console.error("Error listing projects:", error);
      res.status(500).json({ message: "Failed to list projects" });
    }
  });

  app.get(api.projects.get.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      const files = await storage.getFilesByProject(id);
      res.json({ project, files });
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post(api.projects.create.path, async (req: any, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const { userId, sessionId } = getUserOrSession(req);
      
      const project = await storage.createProject({
        ...input,
        userId,
        sessionId,
      });

      // Create a default file
      const extensionByLanguage: Record<string, string> = {
        javascript: "js",
        typescript: "ts",
        python: "py",
        html: "html",
        css: "css",
        rust: "rs",
        go: "go",
        java: "java",
        cpp: "cpp",
      };
      const extension = extensionByLanguage[input.language || ""] || "txt";
      await storage.createFile({
        projectId: project.id,
        filename: `main.${extension}`,
        content: `// Welcome to your ${input.language} project!\n\n`,
      });

      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put(api.projects.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.projects.update.input.parse(req.body);
      
      const project = await storage.updateProject(id, input);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete(api.projects.delete.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Files
  app.post(api.files.create.path, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const input = api.files.create.input.parse(req.body);
      
      const file = await storage.createFile({
        ...input,
        projectId,
      });

      res.status(201).json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error creating file:", error);
      res.status(500).json({ message: "Failed to create file" });
    }
  });

  app.put(api.files.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.files.update.input.parse(req.body);
      
      const file = await storage.updateFile(id, input);
      res.json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error updating file:", error);
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  app.delete(api.files.delete.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFile(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  app.get(api.files.download.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getFile(id);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      res.json({
        filename: file.filename,
        content: file.content,
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Terminal
  app.post(api.terminal.execute.path, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const input = api.terminal.execute.input.parse(req.body);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const result = await executeCommand(input.command, project.language);

      // Save to history
      await storage.addTerminalHistory({
        projectId,
        command: input.command,
        output: result.output || result.error,
      });

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error executing command:", error);
      res.status(500).json({ message: "Failed to execute command" });
    }
  });

  app.get(api.terminal.history.path, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const history = await storage.getTerminalHistory(projectId, 50);
      res.json(history);
    } catch (error) {
      console.error("Error fetching terminal history:", error);
      res.status(500).json({ message: "Failed to fetch terminal history" });
    }
  });

  // AI Assistant (requires authentication and credits)
  app.post(api.ai.fixCode.path, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(403).json({ message: "Sign in to use AI features" });
      }

      const { canUseAI } = await checkUsageLimits(userId);
      if (!canUseAI) {
        return res.status(403).json({ message: "Out of AI credits. Upgrade to continue." });
      }

      const input = api.ai.fixCode.input.parse(req.body);

      const prompt = input.error
        ? `Fix this ${input.language} code that produces the error: "${input.error}"\n\nCode:\n${input.code}\n\nProvide the fixed code and a brief explanation.`
        : `Review and fix any bugs in this ${input.language} code:\n\n${input.code}\n\nProvide the fixed code and a brief explanation.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || "";
      const lines = content.split("\n");
      const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
      const fixedCode = codeBlocks[0]?.replace(/```[\w]*\n?/g, "").trim() || input.code;
      const explanation = lines.filter((line) => !line.startsWith("```")).join("\n").trim();

      // Deduct 1 credit
      const monthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
      await storage.incrementCreditsUsed(userId, monthYear, 1);

      res.json({ fixedCode, explanation });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error fixing code:", error);
      res.status(500).json({ message: "Failed to fix code" });
    }
  });

  app.post(api.ai.explainError.path, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(403).json({ message: "Sign in to use AI features" });
      }

      const { canUseAI } = await checkUsageLimits(userId);
      if (!canUseAI) {
        return res.status(403).json({ message: "Out of AI credits. Upgrade to continue." });
      }

      const input = api.ai.explainError.input.parse(req.body);

      const prompt = `Explain this ${input.language} error in simple terms:\n\nError: ${input.error}\n\nCode:\n${input.code}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      });

      const explanation = response.choices[0]?.message?.content || "Unable to explain error.";

      // Deduct 1 credit
      const monthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
      await storage.incrementCreditsUsed(userId, monthYear, 1);

      res.json({ explanation });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error explaining error:", error);
      res.status(500).json({ message: "Failed to explain error" });
    }
  });

  app.post(api.ai.improveCode.path, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(403).json({ message: "Sign in to use AI features" });
      }

      const { canUseAI } = await checkUsageLimits(userId);
      if (!canUseAI) {
        return res.status(403).json({ message: "Out of AI credits. Upgrade to continue." });
      }

      const input = api.ai.improveCode.input.parse(req.body);

      const prompt = `Improve this ${input.language} code for better performance, readability, and best practices:\n\n${input.code}\n\nProvide the improved code and list the improvements made.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || "";
      const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
      const improvedCode = codeBlocks[0]?.replace(/```[\w]*\n?/g, "").trim() || input.code;
      
      const suggestions = content
        .split("\n")
        .filter((line) => line.match(/^[-•*]\s+/))
        .map((line) => line.replace(/^[-•*]\s+/, "").trim());

      // Deduct 1 credit
      const monthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
      await storage.incrementCreditsUsed(userId, monthYear, 1);

      res.json({ improvedCode, suggestions });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error improving code:", error);
      res.status(500).json({ message: "Failed to improve code" });
    }
  });

  // Usage tracking
  app.get(api.usage.check.path, async (req: any, res) => {
    try {
      const { userId, sessionId } = getUserOrSession(req);
      const limits = await checkUsageLimits(userId, sessionId);
      
      res.json({
        isAuthenticated: !!userId,
        ...limits,
      });
    } catch (error) {
      console.error("Error checking usage:", error);
      res.status(500).json({ message: "Failed to check usage" });
    }
  });

  app.post(api.usage.track.path, async (req: any, res) => {
    try {
      const { userId, sessionId } = getUserOrSession(req);
      const input = api.usage.track.input.parse(req.body);
      
      await storage.incrementUsage(userId || null, sessionId || null, input.minutes);
      
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error tracking usage:", error);
      res.status(500).json({ message: "Failed to track usage" });
    }
  });

  // Credits
  app.get(api.credits.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const monthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
      
      let credits = await storage.getUserCredits(userId, monthYear);
      if (!credits) {
        credits = await storage.createOrUpdateCredits({
          userId,
          monthYear,
          creditsUsed: 0,
          creditsLimit: 7,
        });
      }
      
      res.json(credits);
    } catch (error) {
      console.error("Error fetching credits:", error);
      res.status(500).json({ message: "Failed to fetch credits" });
    }
  });

  // Subscription
  app.get("/api/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      let subscription = await storage.getUserSubscription(userId);
      if (!subscription) {
        subscription = await storage.createOrUpdateSubscription({
          userId,
          tier: "free",
        });
      }
      
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // PayPal Routes
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  app.post("/api/subscription/confirm-paypal", isAuthenticated, async (req: any, res) => {
    try {
      const { tier } = req.body;
      const userId = req.user.claims.sub;
      
      const subscription = await storage.createOrUpdateSubscription({
        userId,
        tier: tier as any,
        updatedAt: new Date(),
      });
      
      res.json(subscription);
    } catch (error) {
      console.error("Error confirming paypal subscription:", error);
      res.status(500).json({ message: "Failed to confirm subscription" });
    }
  });

  app.post(api.subscription.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.subscription.create.input.parse(req.body);
      
      // For now, return a placeholder - Stripe integration was replaced by PayPal
      res.json({
        checkoutUrl: `/subscription/upgrade?tier=${input.tier}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error creating checkout:", error);
      res.status(500).json({ message: "Failed to create checkout" });
    }
  });

  // Seed database with example data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    // Check if any projects exist
    const existingProjects = await storage.getProjects();
    if (existingProjects.length === 0) {
      console.log("Seeding database with example projects...");
      
      // Create example project
      const project = await storage.createProject({
        sessionId: "seed-session",
        name: "Welcome Project",
        language: "javascript",
      });

      await storage.createFile({
        projectId: project.id,
        filename: "index.js",
        content: `// Welcome to CodeEditor!\n// Start coding in any language\n\nconsole.log("Hello, World!");`,
      });

      console.log("Database seeded successfully!");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
