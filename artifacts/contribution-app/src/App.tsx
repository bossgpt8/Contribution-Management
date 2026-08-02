import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { useGetMe } from '@workspace/api-client-react';

// Pages
import NotFound from '@/pages/not-found';
import Login from '@/pages/login';
import AdminLogin from '@/pages/admin-login';
import MemberDashboard from '@/pages/dashboard';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminMembers from '@/pages/admin/members';
import AdminMemberDetail from '@/pages/admin/member-detail';
import AdminReports from '@/pages/admin/reports';

// Layouts
import { AdminLayout } from '@/components/layouts/admin-layout';
import { MemberLayout } from '@/components/layouts/member-layout';

const queryClient = new QueryClient();

function RootRedirect() {
  const [, setLocation] = useLocation();
  const { data: session, isLoading } = useGetMe({ query: { retry: false } });
  useEffect(() => {
    if (isLoading) return;
    if (session?.role === 'admin') setLocation('/admin');
    else if (session?.role === 'member') setLocation('/dashboard');
    else setLocation('/login');
  }, [session, isLoading, setLocation]);
  return <div className="min-h-screen flex items-center justify-center bg-background" />;
}

// Auth Guard Wrapper
function AuthGuard({ children, requireRole }: { children: React.ReactNode, requireRole?: "member" | "admin" }) {
  const [location, setLocation] = useLocation();
  const { data: session, isLoading, error } = useGetMe({ query: { retry: false } });

  useEffect(() => {
    if (isLoading) return;
    if (error || !session) {
      if (location.startsWith('/admin')) setLocation('/admin/login');
      else setLocation('/login');
      return;
    }
    if (requireRole && session.role !== requireRole) {
      setLocation(session.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [session, isLoading, error, location, requireRole, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse font-bold text-xl text-primary">Loading...</div></div>;
  }

  if (!session || (requireRole && session.role !== requireRole)) return null;

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      
      <Route path="/login" component={Login} />
      <Route path="/admin/login" component={AdminLogin} />

      {/* Member Routes */}
      <Route path="/dashboard">
        <AuthGuard requireRole="member">
          <MemberLayout>
            <MemberDashboard />
          </MemberLayout>
        </AuthGuard>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <AuthGuard requireRole="admin">
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </AuthGuard>
      </Route>
      
      <Route path="/admin/members">
        <AuthGuard requireRole="admin">
          <AdminLayout>
            <AdminMembers />
          </AdminLayout>
        </AuthGuard>
      </Route>
      
      <Route path="/admin/members/:id">
        <AuthGuard requireRole="admin">
          <AdminLayout>
            <AdminMemberDetail />
          </AdminLayout>
        </AuthGuard>
      </Route>

      <Route path="/admin/reports">
        <AuthGuard requireRole="admin">
          <AdminLayout>
            <AdminReports />
          </AdminLayout>
        </AuthGuard>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
