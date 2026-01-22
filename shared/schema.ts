import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // This will be the Agent ID
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "deo", "agent"] }).notNull().default("agent"),
  name: text("name").notNull(),
  lastIp: text("last_ip"), // IP address tracking
  location: text("location", { enum: ["onsite", "wfh"] }).notNull().default("onsite"),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  phoneNo: text("phone_no").notNull(),
  accidentYear: text("accident_year"),
  state: text("state"),
  zipCode: text("zip_code"), // Kept in schema but will hide from frontend table
  fronterName: text("fronter_name").notNull(),
  closerName: text("closer_name").notNull(), // Made NOT NULL as requested
  remarks: text("remarks"),
  location: text("location", { enum: ["onsite", "wfh"] }).notNull().default("onsite"),
  // Metadata
  agentId: integer("agent_id").references(() => users.id), // The user who entered/owns this record
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
  location: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  agentId: true,
}).extend({
  location: z.enum(["onsite", "wfh"]).default("onsite"),
});

// === TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

// Analytics Types
export type PerformanceStats = {
  totalCalls: number;
  totalAgents: number;
  transfers: number;
  sales: number;
  transferToSaleRatio: number;
};

export type DailyStat = {
  date: string;
  transfers: number;
  sales: number;
};

export type AgentPerformance = {
  agentName: string;
  transfers: number;
  sales: number;
};

export type PerformerComparison = {
  name: string;
  transfers: number;
  sales: number;
};
