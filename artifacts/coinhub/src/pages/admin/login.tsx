import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin, useAdminMe, getAdminMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: admin } = useAdminMe({
    query: {
      queryKey: getAdminMeQueryKey(),
      retry: false
    }
  });

  const loginAdmin = useAdminLogin();

  if (admin?.isAdmin) {
    setLocation("/admin/dashboard");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    loginAdmin.mutate({ data: { password } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminMeQueryKey() });
        setLocation("/admin/dashboard");
        toast({ title: "Üstünlikli", description: "Admin paneline girildi" });
      },
      onError: (err: any) => {
        toast({ title: "Ýalňyşlyk", description: err.message || "Nädogry açar söz", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#050508] p-6">
      <div className="w-full max-w-sm bg-[#0a0a0f] border border-destructive/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Admin Paneli</h1>
          <p className="text-sm text-muted-foreground">Diňe ygtyýarly şahslar üçin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            type="password" 
            placeholder="Açar söz" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-background/50 border-destructive/20 focus-visible:ring-destructive h-12 text-center"
          />

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold"
            disabled={loginAdmin.isPending}
          >
            {loginAdmin.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tassykla"}
          </Button>
        </form>
      </div>
    </div>
  );
}
