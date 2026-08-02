import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, membersTable, transactionsTable } from "@workspace/db";
import { eq, ilike, or, desc, sql } from "drizzle-orm";
import { requireAdmin, requireMemberOrAdmin } from "../middlewares/auth";

const router: IRouter = Router();

// GET /members - admin only
router.get("/members", requireAdmin, async (req, res): Promise<void> => {
  const { search, status } = req.query as {
    search?: string;
    status?: string;
  };

  let query = db.select().from(membersTable).$dynamic();

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(membersTable.fullName, `%${search}%`),
        ilike(membersTable.contributionNumber, `%${search}%`)
      )
    );
  }
  if (status === "active" || status === "inactive") {
    conditions.push(eq(membersTable.status, status));
  }

  if (conditions.length > 0) {
    query = query.where(sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`);
  }

  const members = await query.orderBy(membersTable.fullName);

  // Attach current balance for each member
  const result = await Promise.all(
    members.map(async (m) => {
      const [lastTx] = await db
        .select({ runningBalance: transactionsTable.runningBalance })
        .from(transactionsTable)
        .where(eq(transactionsTable.memberId, m.id))
        .orderBy(desc(transactionsTable.date), desc(transactionsTable.id))
        .limit(1);

      return {
        ...m,
        currentBalance: lastTx ? parseFloat(lastTx.runningBalance) : 0,
        hasPin: !!m.pin,
        pin: undefined,
      };
    })
  );

  res.json(result);
});

// POST /members - admin only
router.post("/members", requireAdmin, async (req, res): Promise<void> => {
  const {
    contributionNumber,
    fullName,
    phone,
    address,
    dateJoined,
    status = "active",
    pin,
  } = req.body as {
    contributionNumber?: string;
    fullName?: string;
    phone?: string;
    address?: string;
    dateJoined?: string;
    status?: string;
    pin?: string;
  };

  if (!contributionNumber || !fullName || !dateJoined) {
    res.status(400).json({ error: "contributionNumber, fullName, and dateJoined are required" });
    return;
  }

  const hashedPin = pin ? await bcrypt.hash(pin, 12) : null;

  const [member] = await db
    .insert(membersTable)
    .values({
      contributionNumber: contributionNumber.trim().toUpperCase(),
      fullName: fullName.trim(),
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      dateJoined,
      status: (status === "active" || status === "inactive") ? status : "active",
      pin: hashedPin,
    })
    .returning();

  res.status(201).json({
    ...member,
    currentBalance: 0,
    hasPin: !!member.pin,
    pin: undefined,
  });
});

// GET /members/:id
router.get("/members/:id", requireMemberOrAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid member ID" });
    return;
  }

  // Members can only view their own profile
  if (req.session.role === "member" && req.session.userId !== id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [member] = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.id, id));

  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  const [lastTx] = await db
    .select({ runningBalance: transactionsTable.runningBalance })
    .from(transactionsTable)
    .where(eq(transactionsTable.memberId, id))
    .orderBy(desc(transactionsTable.date), desc(transactionsTable.id))
    .limit(1);

  res.json({
    ...member,
    currentBalance: lastTx ? parseFloat(lastTx.runningBalance) : 0,
    hasPin: !!member.pin,
    pin: undefined,
  });
});

// PATCH /members/:id - admin only
router.patch("/members/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid member ID" });
    return;
  }

  const { fullName, phone, address, dateJoined, status, pin } = req.body as {
    fullName?: string;
    phone?: string;
    address?: string;
    dateJoined?: string;
    status?: string;
    pin?: string;
  };

  const updates: Record<string, unknown> = {};
  if (fullName != null) updates.fullName = fullName.trim();
  if (phone != null) updates.phone = phone.trim() || null;
  if (address != null) updates.address = address.trim() || null;
  if (dateJoined != null) updates.dateJoined = dateJoined;
  if (status === "active" || status === "inactive") updates.status = status;
  if (pin != null) updates.pin = pin ? await bcrypt.hash(pin, 12) : null;

  const [updated] = await db
    .update(membersTable)
    .set(updates)
    .where(eq(membersTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  const [lastTx] = await db
    .select({ runningBalance: transactionsTable.runningBalance })
    .from(transactionsTable)
    .where(eq(transactionsTable.memberId, id))
    .orderBy(desc(transactionsTable.date), desc(transactionsTable.id))
    .limit(1);

  res.json({
    ...updated,
    currentBalance: lastTx ? parseFloat(lastTx.runningBalance) : 0,
    hasPin: !!updated.pin,
    pin: undefined,
  });
});

// DELETE /members/:id - admin only
router.delete("/members/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid member ID" });
    return;
  }

  const [deleted] = await db
    .delete(membersTable)
    .where(eq(membersTable.id, id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
