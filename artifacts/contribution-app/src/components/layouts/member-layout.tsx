import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Wallet, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function MemberLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading } = useGetMe();
  const logout = useLogout();
  const { toast } = useToast();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Logged out successfully" });
        window.location.href = "/login";
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border h-16 shrink-0 sticky top-0 z-10 print:hidden">
        <div className="container max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Wallet className="w-6 h-6" />
            AjoTrack
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full">
              <User className="w-4 h-4" />
              {session?.name || 'Member'}
              <span className="text-muted-foreground ml-1">({session?.contributionNumber})</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 sm:mr-2" /> 
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-muted/30">
        {children}
      </main>
    </div>
  );
}
