import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  LogOut,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: session, isLoading } = useGetMe();
  const logout = useLogout();
  const { toast } = useToast();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Logged out successfully" });
        window.location.href = "/admin/login";
      }
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <Skeleton className="w-12 h-12 rounded-full mb-4" />
      <Skeleton className="w-48 h-4" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-sidebar border-r border-sidebar-border shrink-0 flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 font-bold text-xl text-sidebar-foreground">
            <Wallet className="w-6 h-6 text-primary" />
            AjoTrack
          </div>
          <div className="text-xs text-muted-foreground mt-1">Admin Portal</div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin" className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${location === '/admin' ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link href="/admin/members" className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${location.startsWith('/admin/members') ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}>
            <Users className="w-4 h-4" /> Members
          </Link>
          <Link href="/admin/reports" className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${location.startsWith('/admin/reports') ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}>
            <FileText className="w-4 h-4" /> Reports
          </Link>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium truncate">
              {session?.username || session?.name || 'Administrator'}
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col">
        {children}
      </main>
    </div>
  );
}
