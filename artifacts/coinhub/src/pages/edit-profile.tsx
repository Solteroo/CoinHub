import { Layout } from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { useGetMe, getGetMeQueryKey, useUpdateMyProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ["#D4AF37", "#E94E77", "#3DA5D9", "#7CB518", "#9B5DE5", "#F77F00", "#06D6A0", "#EF476F"];

export default function EditProfile() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const update = useUpdateMyProfile();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [bio, setBio] = useState("");
  const [color, setColor] = useState("#D4AF37");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user) {
      setBio(user.bio ?? "");
      setColor(user.avatarColor ?? "#D4AF37");
      setEmail(user.email ?? "");
    }
  }, [user]);

  if (!user) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      { data: { bio, avatarColor: color, email } },
      {
        onSuccess: () => {
          toast({ title: "Saklandy" });
          qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setLocation("/profile");
        },
        onError: (err: any) => {
          toast({ title: "Ýalňyşlyk", description: err?.message ?? "Saklanmady", variant: "destructive" });
        },
      },
    );
  };

  return (
    <Layout>
      <form onSubmit={handleSave} className="p-4 space-y-6 pb-24">
        <h1 className="text-2xl font-black italic gold-text-gradient uppercase tracking-tighter">Profili üýtget</h1>

        <div className="flex flex-col items-center gap-4 py-6 bg-card border border-primary/20 rounded-3xl">
          <Avatar username={user.username} color={color} size="xl" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">@{user.username}</p>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reňk saýlaň</label>
          <div className="grid grid-cols-8 gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "aspect-square rounded-xl flex items-center justify-center transition-all active:scale-90",
                  color === c ? "ring-2 ring-white scale-110" : "ring-1 ring-white/10",
                )}
                style={{ backgroundColor: c }}
                aria-label={c}
              >
                {color === c && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bio (200 belgi)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 200))}
            placeholder="Özüňiz hakda gysga..."
            rows={3}
            className="w-full bg-card border border-primary/20 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
          />
          <p className="text-[10px] text-muted-foreground text-right">{bio.length}/200</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email (parol dikeltmek üçin)</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="bg-card border-primary/20 h-12"
          />
        </div>

        <Button
          type="submit"
          disabled={update.isPending}
          className="w-full h-12 rounded-xl gold-gradient text-black font-black uppercase tracking-widest"
        >
          {update.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Saklamak"}
        </Button>
      </form>
    </Layout>
  );
}
