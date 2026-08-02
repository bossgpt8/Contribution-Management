import { useState } from "react";
import { useParams, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetMember, 
  useListMemberTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  getGetMemberQueryKey,
  getListMemberTransactionsQueryKey
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Search, PlusCircle, MinusCircle, MoreHorizontal, Pencil, Trash2, Calendar, Phone, MapPin, Printer } from "lucide-react";

export default function AdminMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const memberId = parseInt(id || "0", 10);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  
  const [txModalState, setTxModalState] = useState<{ isOpen: boolean, type: "credit"|"debit"|"edit", tx?: any }>({ isOpen: false, type: "credit" });

  const { data: member, isLoading: isLoadingMember } = useGetMember(memberId, {
    query: { enabled: !!memberId }
  });

  const { data: transactions, isLoading: isLoadingTx } = useListMemberTransactions(
    memberId,
    { search: debouncedSearch },
    { query: { enabled: !!memberId } }
  );

  const deleteTx = useDeleteTransaction();

  const handleDeleteTx = (txId: number) => {
    deleteTx.mutate({ id: txId }, {
      onSuccess: () => {
        toast({ title: "Transaction deleted" });
        queryClient.invalidateQueries({ queryKey: getListMemberTransactionsQueryKey(memberId) });
        queryClient.invalidateQueries({ queryKey: getGetMemberQueryKey(memberId) }); // Refresh balance
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.error })
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoadingMember) {
    return <div className="p-10"><Skeleton className="h-40 w-full" /></div>;
  }

  if (!member) {
    return <div className="p-10 text-center">Member not found</div>;
  }

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-2 print:hidden">
        <Link href="/admin/members">
          <Button variant="ghost" size="icon" className="text-muted-foreground"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Passbook Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-l-4 border-l-primary relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{member.fullName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded text-sm">
                    {member.contributionNumber}
                  </span>
                  <Badge variant="outline" className={member.status === 'active' ? "bg-primary/10 text-primary border-primary/20" : "bg-muted"}>
                    {member.status}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" onClick={handlePrint} className="print:hidden" data-testid="button-print">
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 mt-0.5 text-primary" />
                <span>{member.phone || 'No phone'}</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 mt-0.5 text-primary" />
                <span>Joined {formatDate(member.dateJoined)}</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                <span>{member.address || 'No address'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80 uppercase tracking-wider">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {formatCurrency(member.currentBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card id="printable-area" className="print:shadow-none print:border-none">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 print:hidden">
          <CardTitle>Transactions</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search descriptions..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={() => setTxModalState({ isOpen: true, type: "credit" })}
                data-testid="button-add-credit"
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Add Credit
              </Button>
              <Button 
                variant="outline"
                className="text-destructive border-red-200 hover:bg-red-50"
                onClick={() => setTxModalState({ isOpen: true, type: "debit" })}
                data-testid="button-add-debit"
              >
                <MinusCircle className="w-4 h-4 mr-2" /> Add Debit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 print:p-0">
          
          <div className="hidden print:block mb-6">
            <div className="text-center pb-4 border-b">
              <h2 className="text-2xl font-bold">Passbook Ledger</h2>
              <p>{member.fullName} ({member.contributionNumber})</p>
              <p>Printed on {formatDate(new Date().toISOString())}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border print:border-none">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right font-bold">Balance</TableHead>
                  <TableHead className="w-[80px] print:hidden"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTx ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="w-20 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-40 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-20 h-4 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="w-20 h-4 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="w-24 h-4 ml-auto" /></TableCell>
                      <TableCell className="print:hidden"></TableCell>
                    </TableRow>
                  ))
                ) : transactions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions?.map((tx) => (
                    <TableRow key={tx.id} data-testid={`row-tx-${tx.id}`}>
                      <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{tx.description}</TableCell>
                      <TableCell className="text-right text-sm">
                        {tx.debit > 0 ? (
                          <span className="text-destructive">{formatCurrency(tx.debit)}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {tx.credit > 0 ? (
                          <span className="text-primary">{formatCurrency(tx.credit)}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono">
                        {formatCurrency(tx.runningBalance)}
                      </TableCell>
                      <TableCell className="print:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setTxModalState({ isOpen: true, type: "edit", tx })}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10">
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will recalculate the running balance. Cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteTx(tx.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={txModalState.isOpen} onOpenChange={(open) => !open && setTxModalState({ ...txModalState, isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {txModalState.type === 'credit' ? 'Add Credit (Deposit)' : 
               txModalState.type === 'debit' ? 'Add Debit (Withdrawal)' : 
               'Edit Transaction'}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm 
            memberId={memberId} 
            type={txModalState.type} 
            tx={txModalState.tx} 
            onSuccess={() => setTxModalState({ ...txModalState, isOpen: false })} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const txSchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
});

function TransactionForm({ memberId, type, tx, onSuccess }: { memberId: number, type: "credit"|"debit"|"edit", tx?: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();

  // If editing, determine if it was a credit or debit originally
  const isCredit = type === 'edit' ? tx.credit > 0 : type === 'credit';
  const amount = type === 'edit' ? (tx.credit > 0 ? tx.credit : tx.debit) : "";

  const form = useForm<z.infer<typeof txSchema>>({
    resolver: zodResolver(txSchema),
    defaultValues: {
      date: tx ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0],
      description: tx ? tx.description : (type === 'credit' ? 'Weekly Contribution' : 'Withdrawal'),
      amount: amount as any,
    },
  });

  const onSubmit = (data: z.infer<typeof txSchema>) => {
    const payload = {
      date: data.date,
      description: data.description,
      credit: isCredit ? data.amount : 0,
      debit: !isCredit ? data.amount : 0,
    };

    if (type === 'edit' && tx) {
      updateTx.mutate({ id: tx.id, data: payload }, {
        onSuccess: () => {
          toast({ title: "Transaction updated" });
          queryClient.invalidateQueries({ queryKey: getListMemberTransactionsQueryKey(memberId) });
          queryClient.invalidateQueries({ queryKey: getGetMemberQueryKey(memberId) });
          onSuccess();
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.error })
      });
    } else {
      createTx.mutate({ id: memberId, data: payload }, {
        onSuccess: () => {
          toast({ title: "Transaction recorded" });
          queryClient.invalidateQueries({ queryKey: getListMemberTransactionsQueryKey(memberId) });
          queryClient.invalidateQueries({ queryKey: getGetMemberQueryKey(memberId) });
          onSuccess();
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.error })
      });
    }
  };

  const isPending = createTx.isPending || updateTx.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="date" render={({ field }) => (
          <FormItem>
            <FormLabel>Date</FormLabel>
            <FormControl><Input type="date" {...field} data-testid="input-tx-date" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl><Input {...field} data-testid="input-tx-desc" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem>
            <FormLabel>Amount (₦)</FormLabel>
            <FormControl><Input type="number" step="0.01" {...field} data-testid="input-tx-amount" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <DialogFooter className="pt-4">
          <Button type="submit" disabled={isPending} data-testid="button-submit-tx">
            {isPending ? "Saving..." : "Save Transaction"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
