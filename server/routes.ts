import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertReportSchema, attendance } from "@shared/schema";
import passport from "passport";

import type { User as DbUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends DbUser {}
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Set up authentication (passport)
  setupAuth(app);

  // === Users API ===
  app.get(api.users.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role === 'agent') return res.sendStatus(403); // Only Admin/DEO
    
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post(api.users.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role === 'agent') return res.sendStatus(403);
    
    try {
      const input = api.users.create.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser(input);
      res.status(201).json(user);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json(e.errors);
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'admin') return res.sendStatus(403);
    
    await storage.deleteUser(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // === Reports API ===
  app.get(api.reports.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const filters: any = {};
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
    
    // Agents can only see their own reports (if filtered by agentId, or enforced here)
    // Actually, "Agent is the user. He can't track his progress... by putting their id". 
    // Wait, the prompt says: "AGENTS/USERS CAN SEE THERE PROGRESS REPORT by putting there ids"
    // AND "AGENT IS THE USER. HE CANT TRACK HIS PROGRESS AND PROFARMANCE MY PUTING THERE ID AND PASSWORD." 
    // This is contradictory? "CAN SEE" vs "HE CANT TRACK". 
    // Reading carefully: "AGENTS/USERS CAN SEE THERE PROGRESS REPORT... AND PROFARMANCE MY PUTING THERE ID AND PASSWORD."
    // I assume it means they CAN track it by logging in.
    
    // If logged in as agent, force filter by their ID (if we link User.id to Report.agentId)
    // In schema, I added agentId to reports. 
    if (req.user!.role === 'agent') {
      filters.agentId = req.user!.id;
    } else if (req.query.agentId) {
       // Admin/DEO filtering by specific agent
       filters.agentId = parseInt(req.query.agentId as string);
    }

    const reports = await storage.getReports(filters);
    res.json(reports);
  });

  app.post(api.reports.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const input = api.reports.create.input.parse(req.body);
      const reportData = { ...input, agentId: req.user!.id };
      const report = await storage.createReport(reportData);
      res.status(201).json(report);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json(e.errors);
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  app.post(api.reports.bulkCreate.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const input = api.reports.bulkCreate.input.parse(req.body);
      const reportsData = input.map(r => ({ ...r, agentId: req.user!.id }));
      const reports = await storage.bulkCreateReports(reportsData);
      res.status(201).json({ count: reports.length, message: "Successfully imported records" });
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json(e.errors);
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/reports/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role === 'agent') return res.sendStatus(403);
    
    await storage.deleteReport(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // === Analytics API ===
  app.get(api.analytics.dashboard.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const filters: any = {};
    if (req.query.location) filters.location = req.query.location as string;
    if (req.query.days) filters.days = parseInt(req.query.days as string);

    const stats = await storage.getAnalytics(filters);
    res.json(stats);
  });

  // === Attendance API ===
  app.get("/api/attendance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const history = await storage.getAttendance(req.user!.id);
    res.json(history);
  });

  app.get("/api/admin/attendance", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role === 'agent') return res.sendStatus(403);
    const users = await storage.getAllUsers();
    const allHistory = [];
    for (const user of users) {
      if (user.role === 'agent') {
        const history = await storage.getAttendance(user.id);
        allHistory.push(...history);
      }
    }
    res.json(allHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  });

  app.patch("/api/attendance/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'admin') return res.sendStatus(403);
    
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const updated = await storage.updateAttendance(id, updateData);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/attendance/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'admin') return res.sendStatus(403);
    
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAttendance(id);
      res.sendStatus(200);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/attendance/mark", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { type } = req.body;
      const attendance = await storage.markAttendance(req.user!.id, type);
      res.json(attendance);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Seed data on startup
  await seed();

  return httpServer;
}

// Helper to seed users and demo data if none exists
export async function seed() {
  const existingAdmin = await storage.getUserByUsername("admin");
  if (!existingAdmin) {
    // Create Admin
    await storage.createUser({
      username: "admin",
      password: "8004",
      role: "admin",
      name: "System Administrator"
    });
    console.log("Seeded admin user");

    // Create DEO
    await storage.createUser({
      username: "DEO",
      password: "8004",
      role: "deo",
      name: "Data Entry Operator"
    });
    console.log("Seeded DEO user");

    // Create Agent (Hassam Sheikh)
    const demoAgent = await storage.createUser({
      username: "agent",
      password: "8004",
      role: "agent",
      name: "Hassam Sheikh"
    });
    console.log("Seeded demo agent Hassam Sheikh");

    // Seed Demo Reports
    const demoReports = [
      {
        timestamp: new Date("2026-01-03 21:18:25"),
        phoneNo: "2054711708",
        accidentYear: "2025",
        state: "AL",
        zipCode: "",
        fronterName: "Hassam Sheikh (8004)",
        closerName: "Zainab",
        remarks: "sounding fishy and hungup when i asked about info",
        agentId: demoAgent.id,
        location: "onsite" as const,
        isSale: false
      },
      {
        timestamp: new Date("2026-01-03 21:29:53"),
        phoneNo: "2147297217",
        accidentYear: "2025",
        state: "TX",
        zipCode: "",
        fronterName: "Hassam Sheikh (8004)",
        closerName: "Gulfaraz",
        remarks: "Attorney dealing",
        agentId: demoAgent.id,
        location: "onsite" as const,
        isSale: false
      },
      {
        timestamp: new Date("2026-01-03 22:27:53"),
        phoneNo: "3256273257",
        accidentYear: "2025",
        state: "TX",
        zipCode: "",
        fronterName: "Hassam Sheikh (8004)",
        closerName: "Sami",
        remarks: "Cx said everyone got the ticket",
        agentId: demoAgent.id,
        location: "wfh" as const,
        isSale: false
      },
      {
        timestamp: new Date("2026-01-03 23:31:35"),
        phoneNo: "2054221673",
        accidentYear: "2024",
        state: "AL",
        zipCode: "",
        fronterName: "Hassam Sheikh (8004)",
        closerName: "Gulfaraz",
        remarks: "acc 2023",
        agentId: demoAgent.id,
        location: "onsite" as const,
        isSale: false
      },
      {
        timestamp: new Date("2026-01-03 23:46:43"),
        phoneNo: "3095073396",
        accidentYear: "2025",
        state: "NV",
        zipCode: "",
        fronterName: "Hassam Sheikh (8004)",
        closerName: "Gulfaraz",
        remarks: "DNC",
        agentId: demoAgent.id,
        location: "wfh" as const,
        isSale: false
      },
      {
        timestamp: new Date("2026-01-04 01:19:49"),
        phoneNo: "4692458605",
        accidentYear: "2024",
        state: "TX",
        zipCode: "",
        fronterName: "Hassam Sheikh (8004)",
        closerName: "Zainab",
        remarks: "Already claimed",
        agentId: demoAgent.id,
        location: "onsite" as const,
        isSale: false
      },
      {
        timestamp: new Date("2026-01-05 10:15:00"),
        phoneNo: "5125550199",
        accidentYear: "2025",
        state: "CA",
        zipCode: "",
        fronterName: "Hassam Sheikh (8004)",
        closerName: "Sami",
        remarks: "Interested in sale",
        agentId: demoAgent.id,
        location: "wfh" as const,
        isSale: false
      },
      {
        timestamp: new Date("2026-01-06 14:30:00"),
        phoneNo: "6175550288",
        accidentYear: "2024",
        state: "MA",
        zipCode: "",
        fronterName: "Agent Smith",
        closerName: "Gulfaraz",
        remarks: "Successful Transfer",
        agentId: demoAgent.id,
        location: "onsite" as const,
        isSale: false
      }
    ];

    await storage.bulkCreateReports(demoReports);
    console.log("Seeded demo reports");

    // Seed Attendance
    const demoAttendance = [
      {
        userId: demoAgent.id,
        date: new Date("2026-01-01"),
        isSalaryDay: true,
        salaryAmount: 30000,
        punctualityBonus: 5000,
        bonusAmount: 33000,
        dockAmount: 3000,
        remark: "December Salary Payout",
        salesCount: 0,
        workedHours: 0
      },
      {
        userId: demoAgent.id,
        date: new Date("2026-01-20"),
        signInTime: new Date("2026-01-20 09:00:00"),
        signOutTime: new Date("2026-01-20 18:00:00"),
        salesCount: 2,
        bonusAmount: 1000,
        dockAmount: 0,
        remark: "Full day",
        isSalaryDay: false,
        workedHours: 9
      },
      {
        userId: demoAgent.id,
        date: new Date("2026-01-21"),
        signInTime: new Date("2026-01-21 10:30:00"),
        signOutTime: new Date("2026-01-21 18:00:00"),
        salesCount: 1,
        bonusAmount: 500,
        dockAmount: 500,
        remark: "500 - Late Sign In",
        isSalaryDay: false,
        workedHours: 7.5
      },
      {
        userId: demoAgent.id,
        date: new Date("2026-01-22"),
        signInTime: new Date("2026-01-22 09:00:00"),
        signOutTime: new Date("2026-01-22 16:00:00"),
        salesCount: 3,
        bonusAmount: 1500,
        dockAmount: 500,
        remark: "500 - Early Sign Out",
        isSalaryDay: false,
        workedHours: 7
      },
      {
        userId: demoAgent.id,
        date: new Date("2026-01-23"),
        signInTime: new Date("2026-01-23 09:15:00"),
        signOutTime: new Date("2026-01-23 18:15:00"),
        salesCount: 4,
        bonusAmount: 2000,
        dockAmount: 0,
        remark: "Perfect Shift",
        isSalaryDay: false,
        workedHours: 9
      },
      {
        userId: demoAgent.id,
        date: new Date("2026-01-24"),
        signInTime: new Date("2026-01-24 08:55:00"),
        signOutTime: new Date("2026-01-24 17:55:00"),
        salesCount: 2,
        bonusAmount: 1000,
        dockAmount: 0,
        remark: "On time",
        isSalaryDay: false,
        workedHours: 9
      },
      {
        userId: demoAgent.id,
        date: new Date("2026-01-25"),
        signInTime: new Date("2026-01-25 09:00:00"),
        signOutTime: new Date("2026-01-25 15:30:00"),
        salesCount: 1,
        bonusAmount: 500,
        dockAmount: 500,
        remark: "500 - Early Sign Out",
        isSalaryDay: false,
        workedHours: 6.5
      }
    ];

    for (const a of demoAttendance) {
      await db.insert(attendance).values(a);
    }
    console.log("Seeded demo attendance");
  }
}
