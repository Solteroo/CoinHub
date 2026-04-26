import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Coins } from "lucide-react";
import { Logo } from "@/components/Logo";
import { CoinCounter } from "@/components/ui/coin-counter";
import { Link } from "wouter";

export function TopHeader() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/10">
      <div className="max-w-md mx-auto flex items-center justify-between h-14 px-4">
        <Link href="/home" className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="font-bold text-lg tracking-tight gold-text-gradient">CoinHub</span>
        </Link>
        
        {user && (
          <Link href="/wallet">
            <div className="flex items-center gap-2 bg-card border border-primary/20 px-3 py-1.5 rounded-full gold-glow transition-transform active:scale-95">
              <Coins className="w-4 h-4 text-primary" />
              <CoinCounter value={user.coins} className="font-bold text-primary tabular-nums" />
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
