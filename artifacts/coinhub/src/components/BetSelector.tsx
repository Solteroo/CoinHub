import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BetSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
}

const QUICK_BETS = [10, 50, 100, 500, 1000];

export function BetSelector({ value, onChange, min, max, disabled }: BetSelectorProps) {
  const handleQuickBet = (amount: number) => {
    if (disabled) return;
    onChange(Math.min(max, amount));
  };

  const handleMax = () => {
    if (disabled) return;
    onChange(max);
  };

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            min={min}
            max={max}
            disabled={disabled}
            className="bg-background/50 border-primary/20 h-12 text-lg font-bold tabular-nums focus-visible:ring-primary pr-16"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary/50 uppercase">
            Bet
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleMax}
          disabled={disabled || max < min}
          className="h-12 px-4 border-primary/20 hover:border-primary/50 text-primary font-bold"
        >
          MAX
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_BETS.map((amount) => (
          <button
            key={amount}
            onClick={() => handleQuickBet(amount)}
            disabled={disabled || amount > max}
            className={cn(
              "flex-1 min-w-[60px] py-2 rounded-lg text-xs font-bold border transition-all",
              value === amount
                ? "bg-primary text-black border-primary"
                : "bg-card border-primary/10 text-muted-foreground hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed"
            )}
          >
            {amount}
          </button>
        ))}
      </div>
    </div>
  );
}
