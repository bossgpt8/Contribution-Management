import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { Wallet, Shield } from "lucide-react";
import { useAdminLogin, useGetMe } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const login = useAdminLogin();
  
  const { data: session } = useGetMe({ query: { retry: false } });
  
  useEffect(() => {
    if (session?.role === 'admin') setLocation('/admin');
    else if (session?.role === 'member') setLocation('/dashboard');
  }, [session, setLocation]);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    login.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Welcome back, Admin" });
        setLocation("/admin");
      },
      onError: (err: any) => {
        toast({ 
          variant: "destructive", 
          title: "Login failed", 
          description: err.error || "Invalid username or password" 
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 font-bold text-3xl text-primary">
            <Wallet className="w-8 h-8" />
            AjoTrack
          </div>
        </div>
        
        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Portal</CardTitle>
            <CardDescription>
              Sign in to manage the cooperative
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} data-testid="input-username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} data-testid="input-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  size="lg"
                  disabled={login.isPending}
                  data-testid="button-submit"
                >
                  {login.isPending ? "Authenticating..." : "Sign In to Admin"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center border-t py-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Go to Member Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
