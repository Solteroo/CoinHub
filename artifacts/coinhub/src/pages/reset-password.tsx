import { useState } from "react";
import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, Lock, Mail, Hash } from "lucide-react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const { toast } = useToast();

  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { ok?: boolean; emailConfigured?: boolean };
      if (res.ok) {
        if (data.emailConfigured) {
          toast({ title: t("reset_code_sent"), description: t("reset_check_email") });
        } else {
          toast({ title: t("reset_code_sent_admin") });
        }
        setStep("confirm");
      } else {
        toast({ title: t("error"), variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !password) return;
    if (password !== confirm) {
      toast({ title: t("error"), description: t("reset_passwords_mismatch"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code, password }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        toast({ title: t("reset_success") });
        setLocation("/");
      } else {
        toast({ title: t("error"), description: data.error ?? t("reset_code_invalid"), variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[50%] -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center mt-14 mb-8 z-10"
      >
        <Logo className="w-20 h-20 mb-4" />
        <h1 className="text-3xl font-black tracking-tighter gold-text-gradient mb-1">CoinHub</h1>
      </motion.div>

      <div className="w-full max-w-sm z-10 px-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card/60 backdrop-blur-sm border border-primary/20 p-6 rounded-3xl shadow-xl gold-glow"
        >
          <h2 className="text-xl font-black gold-text-gradient uppercase tracking-tight mb-1">
            {t("forgot_password_title")}
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            {step === "request" ? t("forgot_password_hint") : t("reset_enter_code_hint")}
          </p>

          {step === "request" ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="email"
                  placeholder={t("email_ph")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12 pl-10"
                  autoComplete="email"
                  required
                />
              </div>
              <Button
                type="submit"
                className={cn("w-full h-12 rounded-xl font-black text-base uppercase tracking-widest gold-gradient text-black")}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("reset_send_code")}
              </Button>
              <button
                type="button"
                onClick={() => setLocation("/")}
                className="w-full text-center text-xs text-muted-foreground hover:text-primary pt-1"
              >
                {t("back")}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder={t("reset_code_ph")}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12 pl-10 text-center tracking-[0.5em] font-black text-xl"
                  maxLength={6}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="password"
                  placeholder={t("reset_new_password_ph")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12 pl-10"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="password"
                  placeholder={t("reset_confirm_password_ph")}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12 pl-10"
                  autoComplete="new-password"
                  required
                />
              </div>
              <Button
                type="submit"
                className={cn("w-full h-12 rounded-xl font-black text-base uppercase tracking-widest gold-gradient text-black")}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("reset_save_password")}
              </Button>
              <button
                type="button"
                onClick={() => setStep("request")}
                className="w-full text-center text-xs text-muted-foreground hover:text-primary pt-1"
              >
                {t("back")}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
