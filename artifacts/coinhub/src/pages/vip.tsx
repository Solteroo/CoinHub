import { Layout } from "@/components/layout/Layout";
import { useGetAdminOwner, getGetAdminOwnerQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Crown, Check, MessageCircle } from "lucide-react";

const BENEFITS = [
  "Goşmaça günlük TMT bonus",
  "Ýörite VIP belgi we reňk",
  "Owner bilen göni habarlaşmak",
  "Şahsy ýardam (1-e-1)",
  "Çatda ileri tutmak",
  "Çäklendirilmedik geçirimler",
];

export default function VIP() {
  const { data: owner } = useGetAdminOwner({ query: { queryKey: getGetAdminOwnerQueryKey() } });

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-card to-card border border-primary/40 rounded-3xl p-8 text-center gold-glow">
          <div className="absolute -top-12 -right-12 opacity-10">
            <Crown className="w-48 h-48 text-primary" />
          </div>
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(212,175,55,0.5)]">
              <Crown className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl font-black italic gold-text-gradient uppercase tracking-tighter">VIP Sargyt</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Premium ulanyjylar üçin</p>
          </div>
        </div>

        <div className="bg-card border border-primary/15 rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-3">VIP-de näme bar?</h2>
          {BENEFITS.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
              </div>
              <p className="text-sm text-white">{b}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sargyt etmek üçin</p>
          {owner ? (
            <Link href={`/dm/${owner.id}`}>
              <button className="w-full h-14 rounded-xl gold-gradient text-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 active:scale-[0.98]">
                <MessageCircle className="w-5 h-5" /> Owner bilen habarlaş
              </button>
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Häzir owner bellenilmedi</p>
          )}
          <p className="text-[10px] text-muted-foreground text-center">Admin bilen göni habar arkaly gepleşiň</p>
        </div>
      </div>
    </Layout>
  );
}
