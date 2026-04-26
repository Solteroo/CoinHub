import { useState } from "react";
import { useLocation } from "wouter";
import { useLoginUser, useRegisterUser, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Splash() {
  const [location, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isCheckingAuth } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  const loginUser = useLoginUser();
  const registerUser = useRegisterUser();

  if (user) {
    setLocation("/home");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Ýalňyşlyk", description: "Ähli meýdanlary dolduryň", variant: "destructive" });
      return;
    }

    const action = isLogin ? loginUser : registerUser;
    
    action.mutate({ data: { username, password } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Üstünlikli", description: isLogin ? "Ulgama girildi" : "Hasaba alyndy" });
        setLocation("/home");
      },
      onError: (err: any) => {
        toast({ 
          title: "Ýalňyşlyk", 
          description: err?.message || "Nädogry maglumatlar", 
          variant: "destructive" 
        });
      }
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center mb-12 z-10"
      >
        <Logo className="w-24 h-24 mb-6" />
        <h1 className="text-4xl font-bold tracking-tighter gold-text-gradient mb-2">CoinHub</h1>
        <p className="text-muted-foreground text-center text-sm max-w-[250px] font-medium uppercase tracking-widest">
          Premium kazino oýunlary
        </p>
      </motion.div>

      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="w-full max-w-sm z-10"
      >
        <div className="bg-card/50 backdrop-blur-sm border border-primary/20 p-6 rounded-3xl shadow-xl gold-glow relative overflow-hidden">
          <div className="flex gap-4 mb-6 relative z-10">
            <button 
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${isLogin ? "text-primary border-b-2 border-primary" : "text-muted-foreground border-b-2 border-transparent"}`}
              onClick={() => setIsLogin(true)}
              type="button"
            >
              Giriş
            </button>
            <button 
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${!isLogin ? "text-primary border-b-2 border-primary" : "text-muted-foreground border-b-2 border-transparent"}`}
              onClick={() => setIsLogin(false)}
              type="button"
            >
              Hasaba al
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div className="space-y-2">
              <Input 
                placeholder="Ulanyjy ady" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12"
              />
            </div>
            <div className="space-y-2">
              <Input 
                type="password" 
                placeholder="Açar söz" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl gold-gradient text-black font-bold text-base hover:opacity-90 transition-opacity active:scale-[0.98]"
              disabled={loginUser.isPending || registerUser.isPending}
            >
              {(loginUser.isPending || registerUser.isPending) ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? "Giriş" : "Hasaba al"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
