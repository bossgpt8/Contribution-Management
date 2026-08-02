import { Router, type IRouter } from "express";
import { db, membersTable, transactionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

// GET /reports/summary - admin only
router.get("/reports/summary", requireAdmin, async (req, res): Promise<void> => {
  const members = await db.select().from(membersTable);
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "active").length;

  const transactions = await db.select().from(transactionsTable);
  let totalContributions = 0;
  let totalWithdrawals = 0;

  for (const tx of transactions) {
    totalContributions += parseFloat(tx.credit);
    totalWithdrawals += parseFloat(tx.debit);
  }

  const netBalance = totalContributions - totalWithdrawals;

  res.json({
    totalMembers,
    activeMembers,
    totalContributions,
    totalWithdrawals,
    netBalance,
  });
});

// GET /reports/recent-transactions - admin only
router.get("/reports/recent-transactions", requireAdmin, async (req, res): Promise<void> => {
  const limitRaw = req.query.limit;
  const limit = limitRaw ? parseInt(String(limitRaw), 10) : 20;

  const rows = await db
    .select({
      id: transactionsTable.id,
      memberId: transactionsTable.memberId,
      memberName: membersTable.fullName,
      contributionNumber: membersTable.contributionNumber,
      date: transactionsTable.date,
      description: transactionsTable.description,
      debit: transactionsTable.debit,
      credit: transactionsTable.credit,
      runningBalance: transactionsTable.runningBalance,
      createdAt: transactionsTable.createdAt,
    })
    .from(transactionsTable)
    .innerJoin(membersTable, eq(transactionsTable.memberId, membersTable.id))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit);

  res.json(
    rows.map((r) => ({
      ...r,
      debit: parseFloat(r.debit),
      credit: parseFloat(r.credit),
      runningBalance: parseFloat(r.runningBalance),
    }))
  );
});

export default router;
