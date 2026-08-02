import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, membersTable, adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// POST /auth/member/login
router.post("/auth/member/login", async (req, res): Promise<void> => {
  const { contributionNumber, pin } = req.body as {
    contributionNumber?: string;
    pin?: string;
  };

  if (!contributionNumber) {
    res.status(400).json({ error: "Contribution number is required" });
    return;
  }

  const [member] = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.contributionNumber, contributionNumber.trim().toUpperCase()));

  if (!member) {
    res.status(401).json({ error: "Invalid contribution number" });
    return;
  }

  if (member.status === "inactive") {
    res.status(401).json({ error: "Account is inactive. Please contact the administrator." });
    return;
  }

  // If member has a PIN set, require it
  if (member.pin) {
    if (!pin) {
      res.status(401).json({ error: "PIN is required for this account" });
      return;
    }
    const pinMatch = await bcrypt.compare(pin, member.pin);
    if (!pinMatch) {
      res.status(401).json({ error: "Invalid PIN" });
      return;
    }
  }

  req.session.userId = member.id;
  req.session.role = "member";
  req.session.contributionNumber = member.contributionNumber;
  req.session.name = member.fullName;

  res.json({
    role: "member",
    id: member.id,
    name: member.fullName,
    contributionNumber: member.contributionNumber,
    username: null,
  });
});

// POST /auth/admin/login
router.post("/auth/admin/login", async (req, res): Promise<void> => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const [admin] = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.username, username.trim()));

  if (!admin) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, admin.password);
  if (!passwordMatch) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.userId = admin.id;
  req.session.role = "admin";
  req.session.username = admin.username;
  req.session.name = admin.username;

  res.json({
    role: "admin",
    id: admin.id,
    name: admin.username,
    contributionNumber: null,
    username: admin.username,
  });
});

// POST /auth/logout
router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const { userId, role } = req.session;

  if (role === "member") {
    const [member] = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.id, userId!));

    if (!member) {
      res.status(401).json({ error: "Session invalid" });
      return;
    }

    res.json({
      role: "member",
      id: member.id,
      name: member.fullName,
      contributionNumber: member.contributionNumber,
      username: null,
    });
    return;
  }

  if (role === "admin") {
    const [admin] = await db
      .select()
      .from(adminsTable)
      .where(eq(adminsTable.id, userId!));

    if (!admin) {
      res.status(401).json({ error: "Session invalid" });
      return;
    }

    res.json({
      role: "admin",
      id: admin.id,
      name: admin.username,
      contributionNumber: null,
      username: admin.username,
    });
    return;
  }

  res.status(401).json({ error: "Not authenticated" });
});

export default router;
