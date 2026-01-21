import { db } from "./db";
import { users, reports, type User, type InsertUser, type Report, type InsertReport } from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Reports
  createReport(report: InsertReport): Promise<Report>;
  bulkCreateReports(reportsData: InsertReport[]): Promise<Report[]>;
  getReports(filters?: { startDate?: Date; endDate?: Date; agentId?: number }): Promise<Report[]>;
  
  // Analytics
  getAnalytics(): Promise<{
    dailyStats: { date: string; transfers: number; sales: number }[];
    agentPerformance: { agentName: string; transfers: number; sales: number }[];
    kpis: { totalCalls: number; totalTransfers: number; totalSales: number; conversionRate: string };
  }>;
}

export class DatabaseStorage implements IStorage {
  constructor() {}

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.name);
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async bulkCreateReports(reportsData: InsertReport[]): Promise<Report[]> {
    return await db.insert(reports).values(reportsData).returning();
  }

  async getReports(filters?: { startDate?: Date; endDate?: Date; agentId?: number }): Promise<Report[]> {
    let conditions = [];
    
    if (filters?.startDate) {
      conditions.push(gte(reports.timestamp, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(reports.timestamp, filters.endDate));
    }
    if (filters?.agentId) {
      conditions.push(eq(reports.agentId, filters.agentId));
    }

    return await db.select()
      .from(reports)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reports.timestamp));
  }

  async getAnalytics() {
    // This is a simplified analytics implementation. 
    // In a real production app with massive data, you'd want optimized SQL queries or materialized views.
    
    const allReports = await db.select().from(reports);

    // KPI Calc
    const totalCalls = allReports.length;
    // Assuming "Closer Name" presence implies a transfer or sale activity. 
    // Let's refine based on remarks or status if available, but for now we use Closer Name as proxy for 'Transfer' 
    // and maybe we need a 'status' field. 
    // Based on user demo data: "Closer Name" is populated. "Remarks" has text.
    // The prompt says "Daily Report of Transfers and Sales". 
    // I'll assume for now that *every* report with a Closer Name is a Transfer. 
    // And I'll assume there is a specific keyword in remarks for Sale? Or maybe I should have added a 'status' field.
    // Given the constraints, I'll count all records as Transfers for now (since they have a Closer).
    // And for 'Sales', I'll look for 'Sale' in remarks (heuristic).
    
    const totalTransfers = allReports.filter(r => r.closerName).length;
    const totalSales = allReports.filter(r => r.remarks?.toLowerCase().includes('sale')).length; // Rough heuristic

    // Daily Stats
    const dailyMap = new Map<string, { transfers: number; sales: number }>();
    allReports.forEach(r => {
      if (!r.timestamp) return;
      const date = r.timestamp.toISOString().split('T')[0];
      const stats = dailyMap.get(date) || { transfers: 0, sales: 0 };
      if (r.closerName) stats.transfers++;
      if (r.remarks?.toLowerCase().includes('sale')) stats.sales++;
      dailyMap.set(date, stats);
    });
    const dailyStats = Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      ...stats
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Agent Performance
    const agentMap = new Map<string, { transfers: number; sales: number }>();
    allReports.forEach(r => {
      const name = r.fronterName || 'Unknown';
      const stats = agentMap.get(name) || { transfers: 0, sales: 0 };
      if (r.closerName) stats.transfers++;
      if (r.remarks?.toLowerCase().includes('sale')) stats.sales++;
      agentMap.set(name, stats);
    });
    const agentPerformance = Array.from(agentMap.entries()).map(([agentName, stats]) => ({
      agentName,
      ...stats
    }));

    return {
      dailyStats,
      agentPerformance,
      kpis: {
        totalCalls,
        totalTransfers,
        totalSales,
        conversionRate: totalTransfers > 0 ? ((totalSales / totalTransfers) * 100).toFixed(1) + '%' : '0%',
      }
    };
  }
}

export const storage = new DatabaseStorage();
