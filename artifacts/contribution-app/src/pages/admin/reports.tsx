import { useGetReportSummary, useListMembers } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { downloadCSV } from "@/lib/export";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download, Printer, TrendingUp, Users, PiggyBank, ArrowDownToLine, ArrowUpToLine } from "lucide-react";

export default function AdminReports() {
  const { data: summary, isLoading: isLoadingSummary } = useGetReportSummary();
  // Fetch members to export
  const { data: members, isLoading: isLoadingMembers } = useListMembers();

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!members) return;
    const exportData = members.map(m => ({
      'ID': m.id,
      'Contribution No': m.contributionNumber,
      'Name': m.fullName,
      'Phone': m.phone || '',
      'Status': m.status,
      'Joined Date': m.dateJoined,
      'Balance (NGN)': m.currentBalance || 0
    }));
    downloadCSV(exportData, `AjoTrack_Members_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Financial summaries and data export.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} data-testid="button-print-report">
            <Printer className="w-4 h-4 mr-2" /> Print Summary
          </Button>
          <Button onClick={handleExportCSV} disabled={isLoadingMembers || !members?.length} data-testid="button-export-csv">
            <Download className="w-4 h-4 mr-2" /> Export Members CSV
          </Button>
        </div>
      </div>

      <div id="printable-area" className="space-y-8">
        <div className="hidden print:block text-center mb-8 border-b pb-4">
          <h2 className="text-2xl font-bold">AjoTrack Financial Summary</h2>
          <p>Generated on {new Date().toLocaleDateString()}</p>
        </div>

        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Cooperative Financial Standing
            </CardTitle>
            <CardDescription>Overall metrics across all active and inactive passbooks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            
            <div className="flex flex-col p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <ArrowDownToLine className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium">Total Contributions</span>
              </div>
              {isLoadingSummary ? <Skeleton className="h-8 w-32" /> : (
                <div className="text-3xl font-bold font-mono tracking-tight text-foreground">
                  {summary ? formatCurrency(summary.totalContributions) : '-'}
                </div>
              )}
            </div>

            <div className="flex flex-col p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <ArrowUpToLine className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium">Total Withdrawals</span>
              </div>
              {isLoadingSummary ? <Skeleton className="h-8 w-32" /> : (
                <div className="text-3xl font-bold font-mono tracking-tight text-foreground">
                  {summary ? formatCurrency(summary.totalWithdrawals) : '-'}
                </div>
              )}
            </div>

            <div className="flex flex-col p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 text-primary mb-2">
                <PiggyBank className="w-4 h-4" />
                <span className="text-sm font-medium">Net Pool Balance</span>
              </div>
              {isLoadingSummary ? <Skeleton className="h-8 w-32" /> : (
                <div className="text-3xl font-bold font-mono tracking-tight text-primary">
                  {summary ? formatCurrency(summary.netBalance) : '-'}
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Membership Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="flex justify-between items-center p-4 border-b">
              <span className="text-muted-foreground font-medium">Total Registered Members</span>
              {isLoadingSummary ? <Skeleton className="h-6 w-16" /> : (
                <span className="text-xl font-bold">{summary?.totalMembers}</span>
              )}
            </div>

            <div className="flex justify-between items-center p-4 border-b">
              <span className="text-muted-foreground font-medium">Active Members</span>
              {isLoadingSummary ? <Skeleton className="h-6 w-16" /> : (
                <span className="text-xl font-bold text-primary">{summary?.activeMembers}</span>
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
