import { useState } from "react";
import { useLocation } from "wouter";
import { useLoginUser, useRegisterUser, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, LogIn, UserPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type Mode = "choose" | "login" | "register";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function Splash() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<Mode>("choose");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useI18n();

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
      toast({ title: t("error"), description: t("fill_all"), variant: "destructive" });
      return;
    }
    if (mode === "login") {
      loginUser.mutate({ data: { username, password } }, {
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
      registerUser.mutate({ data: { username, password, email: email || undefined } as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: t("welcome"), description: t("account_created") });
          setLocation("/home");
        },
        onError: (err: any) => {
          toast({ title: t("reg_error"), description: err?.message ?? "", variant: "destructive" });
        },
      });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
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
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[50%] -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      {/* Language switcher — top fixed */}
      <div className="w-full max-w-md flex justify-end px-5 pt-4 z-20">
        <LanguageSwitcher />
      </div>

      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col items-center mt-6 mb-8 z-10"
      >
        <Logo className="w-24 h-24 mb-5" />
        <h1 className="text-4xl font-black tracking-tighter gold-text-gradient mb-2">CoinHub</h1>
        <p className="text-muted-foreground text-center text-xs max-w-[280px] font-bold uppercase tracking-[0.25em]">
          {t("tagline")}
        </p>
      </motion.div>

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
              {/* Google login — primary CTA */}
              <button
                onClick={handleGoogleLogin}
                className="w-full h-14 rounded-2xl bg-white text-gray-800 font-black text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all border border-gray-200"
              >
                <GoogleIcon className="w-5 h-5" />
                {t("login_with_google")}
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-primary/10" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">или</span>
                <div className="flex-1 h-px bg-primary/10" />
              </div>

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
                onClick={() => setMode("choose")}
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t("back")}
              </button>

              <h2 className="text-xl font-black gold-text-gradient uppercase tracking-tight">
                {mode === "login" ? t("sign_in_title") : t("register_title")}
              </h2>

              {/* Google button inside form too */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full h-11 rounded-xl bg-white text-gray-800 font-bold text-sm flex items-center justify-center gap-2.5 border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                <GoogleIcon className="w-4 h-4" />
                {t("login_with_google")}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-primary/10" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">или</span>
                <div className="flex-1 h-px bg-primary/10" />
              </div>

              <Input
                placeholder={t("username_ph")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12"
                autoComplete="username"
              />
              <Input
                type="password"
                placeholder={t("password_ph")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              {mode === "register" && (
                <Input
                  type="email"
                  placeholder={t("email_ph")}
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
                ) : mode === "login" ? t("submit_login") : t("submit_register")}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
