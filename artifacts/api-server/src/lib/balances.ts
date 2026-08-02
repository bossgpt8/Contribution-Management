import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db";
import { eq, asc, gte } from "drizzle-orm";

/**
 * Recalculate running balances for a member starting from the earliest affected date.
 * Call this after any insert, update, or delete on transactions.
 */
export async function recalcBalances(memberId: number, fromDate?: string): Promise<void> {
  // Get the balance before fromDate (if provided) to use as the starting point
  let startingBalance = 0;

  if (fromDate) {
    // Sum all transactions before fromDate
    const before = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.memberId, memberId))
      .orderBy(asc(transactionsTable.date), asc(transactionsTable.id));

    // Calculate balance up to but not including fromDate
    for (const tx of before) {
      if (tx.date < fromDate) {
        startingBalance += parseFloat(tx.credit) - parseFloat(tx.debit);
      }
    }
  }

  // Get all transactions from fromDate onwards (or all if no fromDate)
  const rows = await db
    .select()
    .from(transactionsTable)
    .where(
      fromDate
        ? eq(transactionsTable.memberId, memberId)
        : eq(transactionsTable.memberId, memberId)
    )
    .orderBy(asc(transactionsTable.date), asc(transactionsTable.id));

  let balance = 0;

  if (fromDate) {
    // Recompute everything for simplicity (fewer moving parts)
    for (const tx of rows) {
      balance += parseFloat(tx.credit) - parseFloat(tx.debit);
      await db
        .update(transactionsTable)
        .set({ runningBalance: balance.toFixed(2) })
        .where(eq(transactionsTable.id, tx.id));
    }
  } else {
    for (const tx of rows) {
      balance += parseFloat(tx.credit) - parseFloat(tx.debit);
      await db
        .update(transactionsTable)
        .set({ runningBalance: balance.toFixed(2) })
        .where(eq(transactionsTable.id, tx.id));
    }
  }
}
