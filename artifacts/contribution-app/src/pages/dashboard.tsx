import { useState } from "react";
import { useGetMe, useGetMember, useListMemberTransactions } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Search, Printer, Download, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function MemberDashboard() {
  const { data: session } = useGetMe();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const memberId = session?.role === 'member' ? session.id : 0;
  
  const { data: member, isLoading: isLoadingMember } = useGetMember(memberId, {
    query: { enabled: !!memberId }
  });

  const { data: transactions, isLoading: isLoadingTx } = useListMemberTransactions(
    memberId,
    { search: debouncedSearch, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
    { query: { enabled: !!memberId } }
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print(); // Simple approach as requested
  };

  if (!memberId) return null;

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Passbook</h1>
          <p className="text-muted-foreground">Review your contributions and account history.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} data-testid="button-print">
            <Printer className="w-4 h-4 mr-2" /> Print Statement
          </Button>
          <Button onClick={handleDownloadPDF} data-testid="button-download">
            <Download className="w-4 h-4 mr-2" /> Save PDF
          </Button>
        </div>
      </div>

      {isLoadingMember ? (
        <Skeleton className="w-full h-40 rounded-xl" />
      ) : member ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-primary text-primary-foreground border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <WalletIconLarge />
            </div>
            <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-primary-foreground/80 font-medium mb-1">Account Holder</p>
                  <h2 className="text-2xl font-bold">{member.fullName}</h2>
                </div>
                <Badge variant="outline" className={`bg-background/20 border-none text-white ${member.status === 'active' ? '' : 'opacity-70'}`}>
                  {member.status.toUpperCase()}
                </Badge>
              </div>
              <div className="mt-8">
                <p className="text-primary-foreground/80 font-medium mb-1">Contribution Number</p>
                <p className="text-xl font-mono tracking-widest">{member.contributionNumber}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-center border-t-4 border-t-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {formatCurrency(member.currentBalance)}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card id="printable-area" className="border-t-4 border-t-secondary print:border-none print:shadow-none">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 print:hidden">
          <CardTitle>Transaction History</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search description..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[140px]"
                  data-testid="input-date-from"
                />
              </div>
              <span className="self-center text-muted-foreground">to</span>
              <div className="relative">
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[140px]"
                  data-testid="input-date-to"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 print:p-0">
          
          <div className="hidden print:block mb-6">
            <div className="text-center pb-4 border-b">
              <h2 className="text-2xl font-bold">AjoTrack Statement</h2>
              <p>{member?.fullName} ({member?.contributionNumber})</p>
              <p>Statement generated on {formatDate(new Date().toISOString())}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border print:border-none">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit (DR)</TableHead>
                  <TableHead className="text-right">Credit (CR)</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTx ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="w-20 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-40 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-20 h-4 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="w-20 h-4 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="w-24 h-4 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : transactions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No transactions found for this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions?.map((tx) => (
                    <TableRow key={tx.id} data-testid={`row-tx-${tx.id}`}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className="font-medium">{tx.description}</TableCell>
                      <TableCell className="text-right">
                        {tx.debit > 0 ? (
                          <span className="text-destructive flex items-center justify-end gap-1">
                            <ArrowDownRight className="w-3 h-3" /> {formatCurrency(tx.debit)}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.credit > 0 ? (
                          <span className="text-primary flex items-center justify-end gap-1">
                            <ArrowUpRight className="w-3 h-3" /> {formatCurrency(tx.credit)}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono">
                        {formatCurrency(tx.runningBalance)}
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

function WalletIconLarge() {
  return (
    <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}
