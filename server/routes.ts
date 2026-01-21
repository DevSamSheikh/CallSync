import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertReportSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // auth.ts already handles session and user finding. 
  // Let's hook into the login logic to update IP.
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json(info);
      
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      if (typeof ip === 'string') {
        await storage.updateUserIp(user.id, ip);
      }
      
      req.logIn(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

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
      // Link report to the logged-in user if they are an agent, or if DEO/Admin enters it?
      // For now, let's link it to the creator.
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

  // === Analytics API ===
  app.get(api.analytics.dashboard.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const stats = await storage.getAnalytics();
    res.json(stats);
  });

  // Seed data on startup
  await seed();

  return httpServer;
}

// Helper to seed admin user and demo data if none exists
export async function seed() {
  const existingUser = await storage.getUserByUsername("admin");
  if (!existingUser) {
    await storage.createUser({
      username: "admin",
      password: "adminpassword", // In production, hash this!
      role: "admin",
      name: "System Administrator"
    });
    console.log("Seeded admin user");

    // Seed Demo Agent
    const demoAgent = await storage.createUser({
      username: "8004",
      password: "password",
      role: "agent",
      name: "Hassam Sheikh"
    });
    console.log("Seeded demo agent Hassam Sheikh");

    // Seed Demo Reports
    const demoReports = [
      {
        timestamp: new Date("1/3/2026 21:18:25"),
        phoneNo: "2054711708",
        accidentYear: "2025",
        state: "AL",
        zipCode: "",
        fronterName: "Hassam Sheikh (8004)",
        closerName: "Zainab",
        remarks: "sounding fishy and hungup when i asked about info",
        agentId: demoAgent.id
      },
      {
        timestamp: new Date("1/3/2026 21:29:53"),
        phoneNo: "2147297217",
        accidentYear: "2025",
        state: "TX",
        zipCode: "",
        fronterName: "Hassam Sheikh (8004)",
        closerName: "Gulfaraz",
        remarks: "Attorney dealing",
        agentId: demoAgent.id
      },
      {
        timestamp: new Date("1/3/2026 22:27:53"),
        phoneNo: "3256273257",
        accidentYear: "2025",
        state: "TX",
        zipCode: "",
        fronterName: "Hassam Sheikh (8004)",
        closerName: "Sami",
        remarks: "Cx said everyone got the ticket",
        agentId: demoAgent.id
      },
      {
        timestamp: new Date("1/3/2026 23:31:35"),
        phoneNo: "2054221673",
        accidentYear: "2024",
        state: "AL",
        zipCode: "",
        fronterName: "Hassam Sheikh (8004)",
        closerName: "Gulfaraz",
        remarks: "acc 2023",
        agentId: demoAgent.id
      },
      {
        timestamp: new Date("1/3/2026 23:46:43"),
        phoneNo: "3095073396",
        accidentYear: "2025",
        state: "NV",
        zipCode: "",
        fronterName: "Hassam Sheikh (8004)",
        closerName: "Gulfaraz",
        remarks: "DNC",
        agentId: demoAgent.id
      },
      {
        timestamp: new Date("1/4/2026 1:19:49"),
        phoneNo: "4692458605",
        accidentYear: "2024",
        state: "TX",
        zipCode: "",
        fronterName: "Hassam Sheikh (8004)",
        closerName: "Zainab",
        remarks: "Already claimed",
        agentId: demoAgent.id
      }
    ];

    await storage.bulkCreateReports(demoReports);
    console.log("Seeded demo reports");
  }
}
