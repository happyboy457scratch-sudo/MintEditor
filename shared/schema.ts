import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
export * from "./models/chat";

// User subscription tiers
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  tier: text("tier").notNull().default("free"), // "free", "premium", "premium_ultimate"
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Track user usage (daily reset)
export const userUsage = pgTable("user_usage", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id"), // For non-authenticated users
  date: timestamp("date").notNull().defaultNow(),
  usageMinutes: integer("usage_minutes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Track AI credits (monthly reset)
export const userCredits = pgTable("user_credits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  creditsUsed: integer("credits_used").notNull().default(0),
  creditsLimit: integer("credits_limit").notNull().default(7),
  monthYear: text("month_year").notNull(), // "2026-02" format
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Code projects
export const codeProjects = pgTable("code_projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id"), // For non-authenticated users
  name: text("name").notNull(),
  language: text("language").notNull().default("javascript"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Code files within projects
export const codeFiles = pgTable("code_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => codeProjects.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Terminal history
export const terminalHistory = pgTable("terminal_history", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => codeProjects.id, { onDelete: "cascade" }),
  command: text("command").notNull(),
  output: text("output"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Import users from auth models
import { users } from "./models/auth";

// Schemas
export const insertSubscriptionSchema = createInsertSchema(userSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUsageSchema = createInsertSchema(userUsage).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreditsSchema = createInsertSchema(userCredits).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectSchema = createInsertSchema(codeProjects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFileSchema = createInsertSchema(codeFiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTerminalHistorySchema = createInsertSchema(terminalHistory).omit({ id: true, createdAt: true });

// Types
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type UserUsage = typeof userUsage.$inferSelect;
export type InsertUsage = z.infer<typeof insertUsageSchema>;

export type UserCredits = typeof userCredits.$inferSelect;
export type InsertCredits = z.infer<typeof insertCreditsSchema>;

export type CodeProject = typeof codeProjects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type CodeFile = typeof codeFiles.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type TerminalHistory = typeof terminalHistory.$inferSelect;
export type InsertTerminalHistory = z.infer<typeof insertTerminalHistorySchema>;
