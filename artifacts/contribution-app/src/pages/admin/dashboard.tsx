import { Link } from "wouter";
import { useGetReportSummary, useGetRecentTransactions } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Users, UserCheck, ArrowUpRight, ArrowDownRight, Wallet, ArrowRight, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetReportSummary();
  const { data: recentTransactions, isLoading: isLoadingRecent } = useGetRecentTransactions({ limit: 10 });

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">
            System summary and recent activities across all members.
          </p>
        </div>
        <Link href="/admin/members">
          <Button>
            Manage Members <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Net Balance" 
          value={summary ? formatCurrency(summary.netBalance) : undefined} 
          icon={<Wallet className="w-4 h-4 text-primary" />} 
          loading={isLoadingSummary}
          className="lg:col-span-2 bg-primary/5 border-primary/20"
          valueClassName="text-3xl text-primary"
        />
        <StatCard 
          title="Total Contributions" 
          value={summary ? formatCurrency(summary.totalContributions) : undefined} 
          icon={<ArrowUpRight className="w-4 h-4 text-emerald-500" />} 
          loading={isLoadingSummary}
        />
        <StatCard 
          title="Total Withdrawals" 
          value={summary ? formatCurrency(summary.totalWithdrawals) : undefined} 
          icon={<ArrowDownRight className="w-4 h-4 text-destructive" />} 
          loading={isLoadingSummary}
        />
        <div className="flex flex-col gap-4">
          <StatCard 
            title="Total Members" 
            value={summary?.totalMembers} 
            icon={<Users className="w-4 h-4 text-muted-foreground" />} 
            loading={isLoadingSummary}
            className="flex-1"
          />
          <StatCard 
            title="Active Members" 
            value={summary?.activeMembers} 
            icon={<UserCheck className="w-4 h-4 text-primary" />} 
            loading={isLoadingSummary}
            className="flex-1"
          />
        </div>
      </div>

      <Card className="border-t-4 border-t-primary">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Latest 10 activities across all passbooks</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRecent ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="w-20 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-32 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-40 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-20 h-4 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="w-20 h-4 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : recentTransactions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No transactions recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTransactions?.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{tx.memberName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{tx.contributionNumber}</div>
                      </TableCell>
                      <TableCell className="text-sm">{tx.description}</TableCell>
                      <TableCell className="text-right">
                        {tx.debit > 0 ? (
                          <span className="text-destructive text-sm font-medium">
                            {formatCurrency(tx.debit)}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.credit > 0 ? (
                          <span className="text-primary text-sm font-medium">
                            {formatCurrency(tx.credit)}
                          </span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, loading, className = "", valueClassName = "text-2xl" }: any) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className={`font-bold font-mono tracking-tight ${valueClassName}`}>
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
