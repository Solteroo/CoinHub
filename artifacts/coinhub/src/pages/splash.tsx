import { useState } from "react";
import { useLocation } from "wouter";
import { useLoginUser, useRegisterUser, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, LogIn, UserPlus, Phone, MessageCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type Mode = "choose" | "login" | "register";

export default function Splash() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<Mode>("choose");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isCheckingAuth } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false },
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
    if (mode === "login") {
      loginUser.mutate({ data: { username, password } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: "Hoş geldiňiz" });
          setLocation("/home");
        },
        onError: (err: any) => {
          toast({ title: "Giriş başartmady", description: err?.message ?? "Nädogry maglumatlar", variant: "destructive" });
        },
      });
    } else {
      registerUser.mutate({ data: { username, password, email: email || undefined } as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: "Hoş geldiňiz", description: "Hasap döredildi" });
          setLocation("/home");
        },
        onError: (err: any) => {
          toast({ title: "Hasap döredilmedi", description: err?.message ?? "", variant: "destructive" });
        },
      });
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center bg-background p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[50%] -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col items-center mt-12 mb-10 z-10"
      >
        <Logo className="w-24 h-24 mb-5" />
        <h1 className="text-4xl font-black tracking-tighter gold-text-gradient mb-2">CoinHub</h1>
        <p className="text-muted-foreground text-center text-xs max-w-[280px] font-bold uppercase tracking-[0.25em]">
          Premium TMT oýunlary
        </p>
      </motion.div>

      <div className="w-full max-w-sm z-10 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {mode === "choose" ? (
            <motion.div
              key="choose"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="space-y-3"
            >
              <Button
                onClick={() => setMode("login")}
                className="w-full h-16 rounded-2xl gold-gradient text-black font-black uppercase tracking-widest text-base flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.4)]"
              >
                <LogIn className="w-5 h-5" />
                Hasabym bar
              </Button>
              <Button
                onClick={() => setMode("register")}
                className="w-full h-16 rounded-2xl bg-card border-2 border-primary/40 text-primary font-black uppercase tracking-widest text-base flex items-center justify-center gap-2 hover:bg-primary/10"
              >
                <UserPlus className="w-5 h-5" />
                Hasap döretmek
              </Button>

              <div className="pt-6 mt-4 border-t border-primary/10 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Habarlaşmak</p>
                <div className="flex gap-2">
                  <a href="tel:+99361403543" className="flex-1 h-12 rounded-xl bg-card border border-primary/15 flex items-center justify-center gap-2 text-xs font-bold text-white hover:bg-primary/10 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    Telefon
                  </a>
                  <a href="tel:+918826816138" className="flex-1 h-12 rounded-xl bg-card border border-primary/15 flex items-center justify-center gap-2 text-xs font-bold text-white hover:bg-primary/10 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5 text-primary" />
                    IMO
                  </a>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key={mode}
              onSubmit={handleSubmit}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-card/60 backdrop-blur-sm border border-primary/20 p-6 rounded-3xl shadow-xl gold-glow space-y-4"
            >
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Yzyna
              </button>

              <h2 className="text-xl font-black gold-text-gradient uppercase tracking-tight">
                {mode === "login" ? "Hasabyňyza giriň" : "Täze hasap"}
              </h2>

              <Input
                placeholder="Ulanyjy ady"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12"
                autoComplete="username"
              />
              <Input
                type="password"
                placeholder="Açar söz"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              {mode === "register" && (
                <Input
                  type="email"
                  placeholder="Email (parol dikeltmek üçin, islege görä)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12"
                  autoComplete="email"
                />
              )}

              <Button
                type="submit"
                className={cn(
                  "w-full h-12 rounded-xl font-black text-base uppercase tracking-widest",
                  "gold-gradient text-black",
                )}
                disabled={loginUser.isPending || registerUser.isPending}
              >
                {loginUser.isPending || registerUser.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : mode === "login" ? "Giriň" : "Hasap döret"}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
