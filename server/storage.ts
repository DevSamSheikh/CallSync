import { db } from "./db";
import { users, reports, attendance, type User, type InsertUser, type Report, type InsertReport, type Attendance, type InsertAttendance } from "@shared/schema";
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
  deleteReport(id: number): Promise<void>;
  deleteUser(id: number): Promise<void>;
  
  // Attendance
  getAttendance(userId: number): Promise<Attendance[]>;
  markAttendance(userId: number, type: 'in' | 'out'): Promise<Attendance>;
  getLatestAttendance(userId: number): Promise<Attendance | undefined>;

  // Analytics
  getAnalytics(filters?: { location?: string; days?: number }): Promise<{
    dailyStats: { date: string; transfers: number; sales: number }[];
    agentPerformance: { agentName: string; transfers: number; sales: number }[];
    performerComparison: { name: string; transfers: number; sales: number }[];
    kpis: { totalCalls: number; totalAgents: number; totalTransfers: number; totalSales: number; conversionRate: string };
  }>;
}

export class DatabaseStorage implements IStorage {
  constructor() {}

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUserIp(id: number, ip: string): Promise<void> {
    await db.update(users).set({ lastIp: ip }).where(eq(users.id, id));
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

  async getReports(filters?: { startDate?: Date; endDate?: Date; agentId?: number; location?: string }): Promise<Report[]> {
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
    if (filters?.location && filters.location !== 'all') {
      conditions.push(eq(reports.location, filters.location as any));
    }

    return await db.select()
      .from(reports)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reports.timestamp));
  }

  async deleteReport(id: number): Promise<void> {
    await db.delete(reports).where(eq(reports.id, id));
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAttendance(userId: number): Promise<Attendance[]> {
    return await db.select().from(attendance)
      .where(eq(attendance.userId, userId))
      .orderBy(desc(attendance.date));
  }

  async getLatestAttendance(userId: number): Promise<Attendance | undefined> {
    const [latest] = await db.select().from(attendance)
      .where(eq(attendance.userId, userId))
      .orderBy(desc(attendance.date))
      .limit(1);
    return latest;
  }

  async markAttendance(userId: number, type: 'in' | 'out'): Promise<Attendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [existing] = await db.select().from(attendance)
      .where(and(eq(attendance.userId, userId), gte(attendance.date, today)))
      .limit(1);

    if (type === 'in') {
      if (existing) return existing;
      const [newAttendance] = await db.insert(attendance).values({
        userId,
        signInTime: new Date(),
        date: new Date(),
      }).returning();
      return newAttendance;
    } else {
      if (!existing) {
        const [newAttendance] = await db.insert(attendance).values({
          userId,
          signOutTime: new Date(),
          date: new Date(),
        }).returning();
        return newAttendance;
      }
      const [updated] = await db.update(attendance)
        .set({ signOutTime: new Date() })
        .where(eq(attendance.id, existing.id))
        .returning();
      return updated;
    }
  }

  async getAnalytics(filters?: { location?: string; days?: number }) {
    let reportConditions = [];
    if (filters?.location && filters.location !== 'all') {
      reportConditions.push(eq(reports.location, filters.location as any));
    }
    
    const cutoffDate = new Date();
    if (filters?.days && filters.days > 0) {
      cutoffDate.setDate(cutoffDate.getDate() - filters.days);
      reportConditions.push(gte(reports.timestamp, cutoffDate));
    } else if (filters?.days === 0) {
      // Today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      reportConditions.push(gte(reports.timestamp, todayStart));
    }

    const allReports = await db.select().from(reports)
      .where(reportConditions.length > 0 ? and(...reportConditions) : undefined);
    
    const allUsers = await db.select().from(users);

    // KPI Calc
    const totalCalls = allReports.length;
    const totalAgents = allUsers.filter(u => u.role === 'agent').length;
    const totalTransfers = allReports.filter(r => r.closerName && !r.isSale).length;
    const totalSales = allReports.filter(r => r.isSale).length;

    // Daily Stats
    const dailyMap = new Map<string, { transfers: number; sales: number }>();
    allReports.forEach(r => {
      if (!r.timestamp) return;
      const date = r.timestamp.toISOString().split('T')[0];
      const stats = dailyMap.get(date) || { transfers: 0, sales: 0 };
      if (r.closerName && !r.isSale) stats.transfers++;
      if (r.isSale) stats.sales++;
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
      if (r.closerName && !r.isSale) stats.transfers++;
      if (r.isSale) stats.sales++;
      agentMap.set(name, stats);
    });
    const agentPerformance = Array.from(agentMap.entries()).map(([agentName, stats]) => ({
      agentName,
      ...stats
    })).sort((a, b) => b.transfers - a.transfers);

    // Performer Comparison (Onsite vs WFH)
    const onsiteStats = { name: 'Onsite', transfers: 0, sales: 0 };
    const wfhStats = { name: 'WFH', transfers: 0, sales: 0 };
    
    allReports.forEach(r => {
      if (r.location === 'onsite') {
        if (r.closerName && !r.isSale) onsiteStats.transfers++;
        if (r.isSale) onsiteStats.sales++;
      } else {
        if (r.closerName && !r.isSale) wfhStats.transfers++;
        if (r.isSale) wfhStats.sales++;
      }
    });

    return {
      dailyStats,
      agentPerformance,
      performerComparison: [onsiteStats, wfhStats],
      kpis: {
        totalCalls,
        totalAgents,
        totalTransfers,
        totalSales,
        conversionRate: totalTransfers > 0 ? ((totalSales / totalTransfers) * 100).toFixed(1) + '%' : '0%',
      }
    };
  }
}

export const storage = new DatabaseStorage();
