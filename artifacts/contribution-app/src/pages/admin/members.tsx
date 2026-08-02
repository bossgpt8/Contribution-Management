import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListMembers, 
  useCreateMember, 
  useUpdateMember,
  useDeleteMember,
  getListMembersQueryKey,
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";

export default function AdminMembers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  const { data: members, isLoading } = useListMembers(
    { 
      search: debouncedSearch, 
      status: statusFilter === "all" ? undefined : (statusFilter as any) 
    }
  );

  const deleteMember = useDeleteMember();

  const handleDelete = (id: number) => {
    deleteMember.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Member deleted" });
        queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.error || "Failed to delete" });
      }
    });
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage cooperative members and their passbooks.
          </p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-member">
              <Plus className="w-4 h-4 mr-2" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
            </DialogHeader>
            <MemberForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or ID..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-members"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="w-40 h-10" /></TableCell>
                      <TableCell><Skeleton className="w-32 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-24 h-4" /></TableCell>
                      <TableCell><Skeleton className="w-16 h-6 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="w-24 h-4 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="w-8 h-8 rounded-md ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : members?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No members found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  members?.map((member) => (
                    <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                      <TableCell>
                        <div className="font-medium">{member.fullName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{member.contributionNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{member.phone || '-'}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(member.dateJoined)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          member.status === 'active' ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"
                        }>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(member.currentBalance)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/members/${member.id}`} className="cursor-pointer w-full flex items-center">
                                <Eye className="w-4 h-4 mr-2" /> View Passbook
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingMember(member)}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit Member
                            </DropdownMenuItem>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10">
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the member <strong>{member.fullName}</strong> and all their transaction history. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(member.id)}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                  >
                                    Delete Member
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

      {/* Edit Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <MemberForm 
              defaultValues={editingMember} 
              memberId={editingMember.id} 
              onSuccess={() => setEditingMember(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const memberSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  contributionNumber: z.string().min(2, "ID is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateJoined: z.string().min(1, "Date is required"),
  status: z.enum(["active", "inactive"]),
  pin: z.string().max(4).optional(),
});

function MemberForm({ defaultValues, memberId, onSuccess }: { defaultValues?: any, memberId?: number, onSuccess: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();

  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: defaultValues ? {
      fullName: defaultValues.fullName,
      contributionNumber: defaultValues.contributionNumber,
      phone: defaultValues.phone || "",
      address: defaultValues.address || "",
      dateJoined: defaultValues.dateJoined.split('T')[0], // format to YYYY-MM-DD
      status: defaultValues.status as "active"|"inactive",
      pin: "", // Don't show existing pin
    } : {
      fullName: "",
      contributionNumber: "",
      phone: "",
      address: "",
      dateJoined: new Date().toISOString().split('T')[0],
      status: "active",
      pin: "",
    },
  });

  const onSubmit = (data: z.infer<typeof memberSchema>) => {
    // only send pin if provided
    const payload = { ...data };
    if (!payload.pin) delete payload.pin;

    if (memberId) {
      // Update
      const updateData = { ...payload };
      // Can't update contributionNumber usually, but schema allows it. Assuming API accepts it.
      updateMember.mutate({ id: memberId, data: updateData as any }, {
        onSuccess: () => {
          toast({ title: "Member updated" });
          queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
          onSuccess();
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.error })
      });
    } else {
      // Create
      createMember.mutate({ data: payload as any }, {
        onSuccess: () => {
          toast({ title: "Member created" });
          queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
          onSuccess();
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.error })
      });
    }
  };

  const isPending = createMember.isPending || updateMember.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="fullName" render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormControl><Input {...field} data-testid="input-fullname" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="contributionNumber" render={({ field }) => (
            <FormItem>
              <FormLabel>Contribution No.</FormLabel>
              <FormControl><Input {...field} disabled={!!memberId} data-testid="input-contribution-no" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (Optional)</FormLabel>
              <FormControl><Input {...field} data-testid="input-phone" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem>
            <FormLabel>Address (Optional)</FormLabel>
            <FormControl><Input {...field} data-testid="input-address" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="dateJoined" render={({ field }) => (
            <FormItem>
              <FormLabel>Date Joined</FormLabel>
              <FormControl><Input type="date" {...field} data-testid="input-date-joined" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="pin" render={({ field }) => (
          <FormItem>
            <FormLabel>{memberId ? "New PIN (Leave blank to keep current)" : "PIN (Optional)"}</FormLabel>
            <FormControl><Input type="password" maxLength={4} placeholder="••••" {...field} data-testid="input-pin" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <DialogFooter className="pt-4">
          <Button type="submit" disabled={isPending} data-testid="button-submit-member">
            {isPending ? "Saving..." : memberId ? "Save Changes" : "Create Member"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
