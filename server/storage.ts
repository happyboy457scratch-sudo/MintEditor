import { db } from "./db";
import {
  codeProjects,
  codeFiles,
  terminalHistory,
  userCredits,
  userUsage,
  userSubscriptions,
  type CodeProject,
  type CodeFile,
  type TerminalHistory,
  type UserCredits,
  type UserUsage,
  type UserSubscription,
  type InsertProject,
  type InsertFile,
  type InsertTerminalHistory,
  type InsertCredits,
  type InsertUsage,
  type InsertSubscription,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Projects
  getProjects(userId?: string, sessionId?: string): Promise<CodeProject[]>;
  getProject(id: number): Promise<CodeProject | undefined>;
  createProject(project: InsertProject): Promise<CodeProject>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<CodeProject>;
  deleteProject(id: number): Promise<void>;

  // Files
  getFilesByProject(projectId: number): Promise<CodeFile[]>;
  getFile(id: number): Promise<CodeFile | undefined>;
  createFile(file: InsertFile): Promise<CodeFile>;
  updateFile(id: number, updates: Partial<InsertFile>): Promise<CodeFile>;
  deleteFile(id: number): Promise<void>;

  // Terminal
  getTerminalHistory(projectId: number, limit?: number): Promise<TerminalHistory[]>;
  addTerminalHistory(history: InsertTerminalHistory): Promise<TerminalHistory>;

  // Credits
  getUserCredits(userId: string, monthYear: string): Promise<UserCredits | undefined>;
  createOrUpdateCredits(credits: InsertCredits): Promise<UserCredits>;
  incrementCreditsUsed(userId: string, monthYear: string, amount: number): Promise<UserCredits>;

  // Usage
  getUserUsage(userId: string, date: Date): Promise<UserUsage | undefined>;
  getUserUsageBySession(sessionId: string, date: Date): Promise<UserUsage | undefined>;
  createOrUpdateUsage(usage: InsertUsage): Promise<UserUsage>;
  incrementUsage(userId: string | null, sessionId: string | null, minutes: number): Promise<UserUsage>;

  // Subscriptions
  getUserSubscription(userId: string): Promise<UserSubscription | undefined>;
  createOrUpdateSubscription(subscription: InsertSubscription): Promise<UserSubscription>;
}

class DatabaseStorage implements IStorage {
  // Projects
  async getProjects(userId?: string, sessionId?: string): Promise<CodeProject[]> {
    if (userId) {
      return db.select().from(codeProjects).where(eq(codeProjects.userId, userId)).orderBy(desc(codeProjects.updatedAt));
    } else if (sessionId) {
      return db.select().from(codeProjects).where(eq(codeProjects.sessionId, sessionId)).orderBy(desc(codeProjects.updatedAt));
    }
    return [];
  }

  async getProject(id: number): Promise<CodeProject | undefined> {
    const [project] = await db.select().from(codeProjects).where(eq(codeProjects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<CodeProject> {
    const [newProject] = await db.insert(codeProjects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<CodeProject> {
    const [updated] = await db
      .update(codeProjects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(codeProjects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(codeProjects).where(eq(codeProjects.id, id));
  }

  // Files
  async getFilesByProject(projectId: number): Promise<CodeFile[]> {
    return db.select().from(codeFiles).where(eq(codeFiles.projectId, projectId)).orderBy(codeFiles.filename);
  }

  async getFile(id: number): Promise<CodeFile | undefined> {
    const [file] = await db.select().from(codeFiles).where(eq(codeFiles.id, id));
    return file;
  }

  async createFile(file: InsertFile): Promise<CodeFile> {
    const [newFile] = await db.insert(codeFiles).values(file).returning();
    return newFile;
  }

  async updateFile(id: number, updates: Partial<InsertFile>): Promise<CodeFile> {
    const [updated] = await db
      .update(codeFiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(codeFiles.id, id))
      .returning();
    return updated;
  }

  async deleteFile(id: number): Promise<void> {
    await db.delete(codeFiles).where(eq(codeFiles.id, id));
  }

  // Terminal
  async getTerminalHistory(projectId: number, limit: number = 50): Promise<TerminalHistory[]> {
    return db
      .select()
      .from(terminalHistory)
      .where(eq(terminalHistory.projectId, projectId))
      .orderBy(desc(terminalHistory.createdAt))
      .limit(limit);
  }

  async addTerminalHistory(history: InsertTerminalHistory): Promise<TerminalHistory> {
    const [newHistory] = await db.insert(terminalHistory).values(history).returning();
    return newHistory;
  }

  // Credits
  async getUserCredits(userId: string, monthYear: string): Promise<UserCredits | undefined> {
    const [credits] = await db
      .select()
      .from(userCredits)
      .where(and(eq(userCredits.userId, userId), eq(userCredits.monthYear, monthYear)));
    return credits;
  }

  async createOrUpdateCredits(credits: InsertCredits): Promise<UserCredits> {
    const [result] = await db
      .insert(userCredits)
      .values(credits)
      .onConflictDoUpdate({
        target: [userCredits.userId, userCredits.monthYear],
        set: {
          creditsUsed: credits.creditsUsed,
          creditsLimit: credits.creditsLimit,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async incrementCreditsUsed(userId: string, monthYear: string, amount: number): Promise<UserCredits> {
    const existing = await this.getUserCredits(userId, monthYear);
    const newUsed = (existing?.creditsUsed || 0) + amount;
    const limit = existing?.creditsLimit || 7;

    return this.createOrUpdateCredits({
      userId,
      monthYear,
      creditsUsed: newUsed,
      creditsLimit: limit,
    });
  }

  // Usage
  async getUserUsage(userId: string, date: Date): Promise<UserUsage | undefined> {
    const dateStr = date.toISOString().split("T")[0];
    const [usage] = await db
      .select()
      .from(userUsage)
      .where(and(eq(userUsage.userId, userId), eq(userUsage.date, date)));
    return usage;
  }

  async getUserUsageBySession(sessionId: string, date: Date): Promise<UserUsage | undefined> {
    const [usage] = await db
      .select()
      .from(userUsage)
      .where(and(eq(userUsage.sessionId, sessionId), eq(userUsage.date, date)));
    return usage;
  }

  async createOrUpdateUsage(usage: InsertUsage): Promise<UserUsage> {
    const [result] = await db
      .insert(userUsage)
      .values(usage)
      .onConflictDoUpdate({
        target: usage.userId ? [userUsage.userId] : [userUsage.sessionId!],
        set: {
          usageMinutes: usage.usageMinutes,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async incrementUsage(userId: string | null, sessionId: string | null, minutes: number): Promise<UserUsage> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let existing: UserUsage | undefined;
    if (userId) {
      existing = await this.getUserUsage(userId, today);
    } else if (sessionId) {
      existing = await this.getUserUsageBySession(sessionId, today);
    }

    const newMinutes = (existing?.usageMinutes || 0) + minutes;

    return this.createOrUpdateUsage({
      userId: userId || undefined,
      sessionId: sessionId || undefined,
      date: today,
      usageMinutes: newMinutes,
    });
  }

  // Subscriptions
  async getUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId));
    return subscription;
  }

  async createOrUpdateSubscription(subscription: InsertSubscription): Promise<UserSubscription> {
    const [result] = await db
      .insert(userSubscriptions)
      .values(subscription)
      .onConflictDoUpdate({
        target: userSubscriptions.userId,
        set: {
          tier: subscription.tier,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          currentPeriodEnd: subscription.currentPeriodEnd,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
