import { Layout } from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useGetMe,
  getGetMeQueryKey,
  useTransferCoins,
  getGetMyTransactionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { fmtCoins } from "@/lib/utils";
import { COIN } from "@/lib/coin";
import { useI18n } from "@/i18n";

export default function Transfer() {
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [pid, setPid] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const transfer = useTransferCoins();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const to = sp.get("to");
    if (to) setPid(to.replace(/\D/g, "").slice(0, 8));
  }, []);

  const numAmount = Number(amount);
  const valid = /^\d{8}$/.test(pid) && Number.isFinite(numAmount) && numAmount > 0 && numAmount <= (me?.coins ?? 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !me) return;
    transfer.mutate(
      { data: { recipientPublicId: pid, amount: numAmount, note: note.trim() || undefined } },
      {
        onSuccess: (data) => {
          toast({ title: t("transfer_success"), description: `${data.amount} © → ${data.recipient.username}` });
          qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
          qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
          setLocation("/wallet");
        },
        onError: (err: any) => toast({ title: t("error"), description: err?.message ?? "", variant: "destructive" }),
      },
    );
  };

  return (
    <Layout>
      <form onSubmit={submit} className="p-4 space-y-6 pb-24">
        <h1 className="text-2xl font-black italic gold-text-gradient uppercase tracking-tighter">{t("transfer_title")}</h1>

        <div className="bg-card border border-primary/20 rounded-3xl p-6 text-center gold-glow">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("balance_label")}</p>
          <p className="text-3xl font-black gold-text-gradient mt-2 tabular-nums">{fmtCoins(me?.coins ?? 0)} <span className="text-sm">{COIN}</span></p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("recipient_id")}</label>
          <Input
            value={pid}
            onChange={(e) => setPid(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="12345678"
            inputMode="numeric"
            className="bg-card border-primary/20 h-14 text-lg font-mono tracking-wider"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("amount")} (©)</label>
          <Input
            type="number"
            min={1}
            max={me?.coins ?? 0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="bg-card border-primary/20 h-14 text-lg font-bold tabular-nums"
          />
          <div className="flex gap-2">
            {[10, 50, 100, 500].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(String(Math.min(v, me?.coins ?? 0)))}
                className="flex-1 py-2 rounded-lg bg-card border border-primary/15 text-xs font-bold text-white hover:bg-primary/10 active:scale-95"
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("note_ph")}</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 100))}
            placeholder={t("note_ph")}
            className="bg-card border-primary/20 h-12"
          />
        </div>

        <Button
          type="submit"
          disabled={!valid || transfer.isPending}
          className="w-full h-14 rounded-2xl gold-gradient text-black font-black uppercase tracking-widest text-sm flex items-center gap-2"
        >
          {transfer.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRightLeft className="w-5 h-5" />}
          {t("transfer_confirm")}
        </Button>
      </form>
    </Layout>
  );
}
