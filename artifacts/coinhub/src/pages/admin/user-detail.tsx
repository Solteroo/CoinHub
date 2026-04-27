import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useAdminGetUser,
  getAdminGetUserQueryKey,
  useAdminAdjustCoins,
  getAdminListUsersQueryKey,
  getAdminListTransactionsQueryKey,
  getAdminStatsQueryKey,
  useAdminSetAdmin,
  getGetAdminOwnerQueryKey,
} from "@workspace/api-client-react";
import { fmtCoins, fmtDate, cn } from "@/lib/utils";
import { ArrowLeft, Plus, Minus, ArrowDownLeft, ArrowUpRight, Crown, ShieldOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AdminUserDetail() {
  const [, params] = useRoute("/admin/users/:userId");
  const userId = params?.userId as string;

  const { data, isLoading } = useAdminGetUser(userId, {
    query: { queryKey: getAdminGetUserQueryKey(userId), enabled: !!userId },
  });

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isAdding, setIsAdding] = useState(true);

  const adjustCoins = useAdminAdjustCoins();
  const setAdmin = useAdminSetAdmin();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Möçberi dogry giriziň", variant: "destructive" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: "Sebäbini giriziň", variant: "destructive" });
      return;
    }

    const finalAmount = isAdding ? numAmount : -numAmount;
    adjustCoins.mutate({ userId, data: { amount: finalAmount, reason } }, {
      onSuccess: () => {
        toast({ title: "TMT üýtgedildi" });
        setAmount("");
        setReason("");
        queryClient.invalidateQueries({ queryKey: getAdminGetUserQueryKey(userId) });
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminStatsQueryKey() });
      },
      onError: (err: any) => toast({ title: "Ýalňyşlyk", description: err?.message ?? "", variant: "destructive" }),
    });
  };

  const handleToggleAdmin = () => {
    if (!data) return;
    const newVal = !data.user.isAdmin;
    setAdmin.mutate({ userId, data: { isAdmin: newVal } }, {
      onSuccess: () => {
        toast({ title: newVal ? "Owner edildi" : "Owner aýryldy" });
        queryClient.invalidateQueries({ queryKey: getAdminGetUserQueryKey(userId) });
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminOwnerQueryKey() });
      },
      onError: (err: any) => toast({ title: "Ýalňyşlyk", description: err?.message ?? "", variant: "destructive" }),
    });
  };

  if (isLoading || !data) return null;
  const { user, transactions } = data;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="p-2 rounded-lg bg-[#0a0a0f] border border-destructive/20 text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Ulanyjy maglumaty</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#0a0a0f] border border-destructive/20 rounded-2xl p-6 text-center">
              <div
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-black text-white"
                style={{ backgroundColor: user.avatarColor || "#D4AF37" }}
              >
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">{user.username}</h2>
                {user.isAdmin && (
                  <span className="text-[10px] font-black bg-primary text-black px-1.5 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" />
                    OWNER
                  </span>
                )}
              </div>
              <p className="text-sm font-mono text-muted-foreground mb-4">#{user.publicId}</p>

              <div className="bg-destructive/5 rounded-xl p-4 border border-destructive/10">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Balans</p>
                <p className="text-3xl font-bold text-primary tabular-nums">{fmtCoins(user.coins)}</p>
                <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mt-1">TMT</p>
              </div>
            </div>

            <div className="bg-[#0a0a0f] border border-destructive/20 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">Owner roly</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Owner profile ulanyjylar "Admin bilen habarlaş" basanda awtomatiki ýönelýär.
              </p>
              <Button
                type="button"
                onClick={handleToggleAdmin}
                disabled={setAdmin.isPending}
                className={cn("w-full h-11 font-bold flex items-center gap-2", user.isAdmin ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90 text-black")}
              >
                {user.isAdmin ? (
                  <>
                    <ShieldOff className="w-4 h-4" />
                    Owner aýyr
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    Owner et
                  </>
                )}
              </Button>
            </div>

            <div className="bg-[#0a0a0f] border border-destructive/20 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">TMT goş/aýyr</h3>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2", isAdding ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/50" : "bg-destructive/5 text-muted-foreground border border-transparent hover:text-white")}
                >
                  <Plus className="w-4 h-4" /> Goş
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2", !isAdding ? "bg-destructive/20 text-destructive border border-destructive/50" : "bg-destructive/5 text-muted-foreground border border-transparent hover:text-white")}
                >
                  <Minus className="w-4 h-4" /> Aýyr
                </button>
              </div>

              <form onSubmit={handleAdjust} className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Möçberi (TMT)</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Möçber"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-background border-destructive/20 focus-visible:ring-destructive"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Sebäp</label>
                  <Input
                    placeholder="Amal sebäbi"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="bg-background border-destructive/20 focus-visible:ring-destructive"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={adjustCoins.isPending}
                  className={cn("w-full h-11 font-bold", isAdding ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-destructive hover:bg-destructive/90 text-white")}
                >
                  Tassykla
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#0a0a0f] border border-destructive/20 rounded-2xl overflow-hidden flex flex-col h-full max-h-[800px]">
              <div className="p-6 border-b border-destructive/10">
                <h3 className="font-bold text-white">Amal taryhy</h3>
              </div>
              <div className="overflow-y-auto p-0">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-destructive/5 border-b border-destructive/10 sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-3 font-medium">Sene</th>
                      <th className="px-6 py-3 font-medium">Görnüş</th>
                      <th className="px-6 py-3 font-medium">Sebäp</th>
                      <th className="px-6 py-3 font-medium text-right">Möçberi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-destructive/10">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-destructive/5 transition-colors">
                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{fmtDate(tx.createdAt)}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                            tx.amount > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive",
                          )}>
                            {tx.amount > 0 ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {tx.amount > 0 ? "Giren" : "Çykan"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white capitalize">{tx.reason}</td>
                        <td className={cn(
                          "px-6 py-4 text-right font-bold tabular-nums whitespace-nowrap",
                          tx.amount > 0 ? "text-emerald-500" : "text-white",
                        )}>
                          {tx.amount > 0 ? "+" : ""}{fmtCoins(tx.amount)}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                          Hiç hili amal ýok
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
