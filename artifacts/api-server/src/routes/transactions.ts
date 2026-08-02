import { Router, type IRouter } from "express";
import { db, membersTable, transactionsTable } from "@workspace/db";
import { eq, and, gte, lte, ilike, or, asc, desc } from "drizzle-orm";
import { requireAdmin, requireMemberOrAdmin } from "../middlewares/auth";
import { recalcBalances } from "../lib/balances";

const router: IRouter = Router();

// GET /members/:id/transactions
router.get("/members/:id/transactions", requireMemberOrAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const memberId = parseInt(raw, 10);
  if (isNaN(memberId)) {
    res.status(400).json({ error: "Invalid member ID" });
    return;
  }

  // Members can only view their own transactions
  if (req.session.role === "member" && req.session.userId !== memberId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { search, dateFrom, dateTo } = req.query as {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  };

  // Check member exists
  const [member] = await db
    .select({ id: membersTable.id })
    .from(membersTable)
    .where(eq(membersTable.id, memberId));

  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  let rows = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.memberId, memberId))
    .orderBy(asc(transactionsTable.date), asc(transactionsTable.id));

  // Filter in memory for simplicity
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter((tx) => tx.description.toLowerCase().includes(s));
  }
  if (dateFrom) {
    rows = rows.filter((tx) => tx.date >= dateFrom);
  }
  if (dateTo) {
    rows = rows.filter((tx) => tx.date <= dateTo);
  }

  res.json(
    rows.map((tx) => ({
      ...tx,
      debit: parseFloat(tx.debit),
      credit: parseFloat(tx.credit),
      runningBalance: parseFloat(tx.runningBalance),
    }))
  );
});

// POST /members/:id/transactions - admin only
router.post("/members/:id/transactions", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const memberId = parseInt(raw, 10);
  if (isNaN(memberId)) {
    res.status(400).json({ error: "Invalid member ID" });
    return;
  }

  const { date, description, debit = 0, credit = 0 } = req.body as {
    date?: string;
    description?: string;
    debit?: number;
    credit?: number;
  };

  if (!date || !description) {
    res.status(400).json({ error: "date and description are required" });
    return;
  }

  // Check member exists
  const [member] = await db
    .select({ id: membersTable.id })
    .from(membersTable)
    .where(eq(membersTable.id, memberId));

  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  // Insert with placeholder balance (will be recalculated)
  const [tx] = await db
    .insert(transactionsTable)
    .values({
      memberId,
      date,
      description: description.trim(),
      debit: debit.toString(),
      credit: credit.toString(),
      runningBalance: "0",
    })
    .returning();

  // Recalculate all balances for this member
  await recalcBalances(memberId);

  // Return updated transaction
  const [updated] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, tx.id));

  res.status(201).json({
    ...updated,
    debit: parseFloat(updated!.debit),
    credit: parseFloat(updated!.credit),
    runningBalance: parseFloat(updated!.runningBalance),
  });
});

// PATCH /transactions/:id - admin only
router.patch("/transactions/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid transaction ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  const { date, description, debit, credit } = req.body as {
    date?: string;
    description?: string;
    debit?: number;
    credit?: number;
  };

  const updates: Record<string, unknown> = {};
  if (date != null) updates.date = date;
  if (description != null) updates.description = description.trim();
  if (debit != null) updates.debit = debit.toString();
  if (credit != null) updates.credit = credit.toString();

  await db
    .update(transactionsTable)
    .set(updates)
    .where(eq(transactionsTable.id, id));

  // Recalculate all balances
  await recalcBalances(existing.memberId);

  const [updated] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, id));

  res.json({
    ...updated,
    debit: parseFloat(updated!.debit),
    credit: parseFloat(updated!.credit),
    runningBalance: parseFloat(updated!.runningBalance),
  });
});

// DELETE /transactions/:id - admin only
router.delete("/transactions/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid transaction ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  await db.delete(transactionsTable).where(eq(transactionsTable.id, id));

  // Recalculate all balances
  await recalcBalances(existing.memberId);

  res.sendStatus(204);
});

export default router;
