import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { Wallet, UserSquare2 } from "lucide-react";
import { useMemberLogin, useGetMe } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";

const schema = z.object({
  contributionNumber: z.string().min(1, "Contribution Number is required"),
  pin: z.string().optional(),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const login = useMemberLogin();
  
  const { data: session } = useGetMe({ query: { retry: false } });
  
  useEffect(() => {
    if (session?.role === 'member') setLocation('/dashboard');
    else if (session?.role === 'admin') setLocation('/admin');
  }, [session, setLocation]);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      contributionNumber: "",
      pin: "",
    },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    login.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Login successful" });
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({ 
          variant: "destructive", 
          title: "Login failed", 
          description: err.error || "Invalid credentials" 
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
              <UserSquare2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Member Login</CardTitle>
            <CardDescription>
              Access your digital passbook
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="contributionNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contribution Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. JMX001" {...field} data-testid="input-contribution-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>PIN (Optional)</FormLabel>
                        <span className="text-xs text-muted-foreground">If set by admin</span>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••" maxLength={4} {...field} data-testid="input-pin" />
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
                  {login.isPending ? "Accessing..." : "View Passbook"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center border-t py-4">
            <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Admin Portal
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
