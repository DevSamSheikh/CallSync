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
  isSale: boolean("is_sale").notNull().default(false),
  amount: integer("amount"),
  bonusAmount: integer("bonus_amount"),
  // Metadata
  agentId: integer("agent_id").references(() => users.id), // The user who entered/owns this record
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull().defaultNow(),
  signInTime: timestamp("sign_in_time"),
  signOutTime: timestamp("sign_out_time"),
  salesCount: integer("sales_count").notNull().default(0),
  bonusAmount: integer("bonus_amount").notNull().default(0),
  dockAmount: integer("dock_amount").notNull().default(0),
  remark: text("remark"),
  isSalaryDay: boolean("is_salary_day").notNull().default(false),
  salaryAmount: integer("salary_amount"),
  punctualityBonus: integer("punctuality_bonus"),
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
  isSale: z.boolean().default(false),
  amount: z.coerce.number().optional(),
  bonusAmount: z.coerce.number().optional(),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
});

// === TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

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
