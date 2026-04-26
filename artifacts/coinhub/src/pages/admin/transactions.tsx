import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminListTransactions, getAdminListTransactionsQueryKey } from "@workspace/api-client-react";
import { fmtCoins, fmtDate, cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

export default function AdminTransactions() {
  const { data: transactions = [] } = useAdminListTransactions({}, { query: { queryKey: getAdminListTransactionsQueryKey() } });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white mb-4">Ähli Amallar</h1>
        
        <div className="bg-[#0a0a0f] border border-destructive/20 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-destructive/5 border-b border-destructive/10">
                <tr>
                  <th className="px-6 py-4 font-medium">Sene</th>
                  <th className="px-6 py-4 font-medium">Ulanyjy</th>
                  <th className="px-6 py-4 font-medium">Görnüş</th>
                  <th className="px-6 py-4 font-medium">Sebäp</th>
                  <th className="px-6 py-4 font-medium text-right">Möçberi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-destructive/10">
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-destructive/5 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{fmtDate(tx.createdAt)}</td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/users/${tx.userId}`} className="font-mono text-xs text-destructive hover:underline">
                        {tx.userId.substring(0, 8)}...
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                        tx.amount > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                      )}>
                        {tx.amount > 0 ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {tx.amount > 0 ? "Giren" : "Çykan"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white capitalize">{tx.reason}</td>
                    <td className={cn(
                      "px-6 py-4 text-right font-bold tabular-nums whitespace-nowrap",
                      tx.amount > 0 ? "text-emerald-500" : "text-white"
                    )}>
                      {tx.amount > 0 ? "+" : ""}{fmtCoins(tx.amount)}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      Hiç hili amal ýok
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
