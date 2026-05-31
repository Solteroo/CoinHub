import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLoginUser, useRegisterUser, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, LogIn, UserPlus, Mail, Lock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "wouter";

type Mode = "choose" | "login" | "register";

export default function Splash() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<Mode>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const { data: user, isLoading: isCheckingAuth } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false },
  });

  const loginUser = useLoginUser();
  const registerUser = useRegisterUser();

  useEffect(() => {
    if (user) setLocation("/home");
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: t("error"), description: t("fill_all"), variant: "destructive" });
      return;
    }
    if (mode === "login") {
      loginUser.mutate({ data: { email, password } as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: t("welcome") });
          setLocation("/home");
        },
        onError: (err: any) => {
          toast({ title: t("login_error"), description: err?.message ?? t("wrong_creds"), variant: "destructive" });
        },
      });
    } else {
      registerUser.mutate({ data: { email, password } as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: t("account_created"), description: t("set_username_hint") });
          setLocation("/edit-profile");
        },
        onError: (err: any) => {
          toast({ title: t("reg_error"), description: err?.message ?? "", variant: "destructive" });
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
    <div className="min-h-[100dvh] w-full flex flex-col items-center bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[50%] -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] left-[20%] w-[200px] h-[200px] bg-purple-500/5 rounded-full blur-[80px]" />
      </div>

      {/* ── Sticky top bar with language switcher ── */}
      <div className="w-full sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-primary/10">
        <div className="max-w-md mx-auto h-10 px-4 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 select-none">
            CoinHub
          </span>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Logo & tagline */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col items-center mt-10 mb-8 z-10"
      >
        <Logo className="w-24 h-24 mb-5" />
        <h1 className="text-4xl font-black tracking-tighter gold-text-gradient mb-2">CoinHub</h1>
        <p className="text-muted-foreground text-center text-xs max-w-[280px] font-bold uppercase tracking-[0.25em]">
          {t("tagline")}
        </p>
      </motion.div>

      {/* Forms */}
      <div className="w-full max-w-sm z-10 flex-1 flex flex-col px-6">
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
                className="w-full h-14 rounded-2xl gold-gradient text-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.4)]"
              >
                <LogIn className="w-5 h-5" />
                {t("has_account")}
              </Button>
              <Button
                onClick={() => setMode("register")}
                className="w-full h-14 rounded-2xl bg-card border-2 border-primary/40 text-primary font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-primary/10"
              >
                <UserPlus className="w-5 h-5" />
                {t("create_account")}
              </Button>

              <div className="pt-6 mt-2 border-t border-primary/10 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t("platform_desc")}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{t("bonus_100")}</p>
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
                onClick={() => { setMode("choose"); setEmail(""); setPassword(""); }}
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t("back")}
              </button>

              <div>
                <h2 className="text-xl font-black gold-text-gradient uppercase tracking-tight">
                  {mode === "login" ? t("sign_in_title") : t("register_title")}
                </h2>
                {mode === "register" && (
                  <p className="text-[11px] text-muted-foreground mt-1">{t("register_hint")}</p>
                )}
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="email"
                  placeholder={t("email_ph")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12 pl-10"
                  autoComplete="email"
                  inputMode="email"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="password"
                  placeholder={t("password_ph")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12 pl-10"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>

              {mode === "register" && (
                <p className="text-[10px] text-muted-foreground/70 bg-primary/5 border border-primary/10 rounded-xl p-3 leading-relaxed">
                  💡 {t("set_username_hint")}
                </p>
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
                ) : mode === "login" ? t("submit_login") : t("submit_register")}
              </Button>

              {mode === "login" && (
                <div className="text-center pt-1">
                  <Link
                    href="/reset-password"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t("forgot_password")}
                  </Link>
                </div>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
