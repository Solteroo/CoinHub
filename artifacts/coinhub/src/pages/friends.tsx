import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import {
  useGetFriends,
  getGetFriendsQueryKey,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRemoveFriend,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserChip } from "@/components/UserChip";
import { Link } from "wouter";
import { UserPlus, Check, X, MessageCircle, Loader2 } from "lucide-react";

export default function Friends() {
  const { data } = useGetFriends({ query: { queryKey: getGetFriendsQueryKey() } });
  const send = useSendFriendRequest();
  const accept = useAcceptFriendRequest();
  const remove = useRemoveFriend();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [pid, setPid] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: getGetFriendsQueryKey() });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const id = pid.trim();
    if (!/^\d{8}$/.test(id)) {
      toast({ title: "Ýalňyşlyk", description: "8 belgili ID giriziň", variant: "destructive" });
      return;
    }
    send.mutate(
      { data: { publicId: id } },
      {
        onSuccess: () => {
          toast({ title: "Sorag iberildi" });
          setPid("");
          refresh();
        },
        onError: (err: any) => toast({ title: "Ýalňyşlyk", description: err?.message ?? "", variant: "destructive" }),
      },
    );
  };

  const handleAccept = (userId: string) => {
    accept.mutate(
      { userId },
      {
        onSuccess: () => {
          toast({ title: "Dost edinildi" });
          refresh();
        },
      },
    );
  };

  const handleRemove = (userId: string) => {
    remove.mutate({ userId }, { onSuccess: refresh });
  };

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <header>
          <h1 className="text-2xl font-black italic gold-text-gradient uppercase tracking-tighter">Dostlar</h1>
        </header>

        <form onSubmit={handleSend} className="bg-card border border-primary/20 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-white">Dost goş</p>
          <div className="flex gap-2">
            <Input
              placeholder="8 belgili ID"
              value={pid}
              onChange={(e) => setPid(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="flex-1 bg-background border-primary/20 h-12"
              inputMode="numeric"
            />
            <Button type="submit" disabled={send.isPending} className="h-12 px-5 gold-gradient text-black font-black">
              {send.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            </Button>
          </div>
        </form>

        <Section title="Sorag gelen" count={data?.incoming.length ?? 0}>
          {data?.incoming.map((f) => (
            <div key={f.user.id} className="bg-card border border-primary/15 rounded-2xl p-3 flex items-center gap-3">
              <UserChip {...f.user} />
              <div className="flex-1" />
              <button
                onClick={() => handleAccept(f.user.id)}
                className="w-9 h-9 rounded-lg bg-primary text-black flex items-center justify-center active:scale-95"
                aria-label="Kabul et"
              >
                <Check className="w-4 h-4" strokeWidth={3} />
              </button>
              <button
                onClick={() => handleRemove(f.user.id)}
                className="w-9 h-9 rounded-lg bg-destructive/20 text-destructive flex items-center justify-center active:scale-95"
                aria-label="Ret et"
              >
                <X className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>
          ))}
        </Section>

        <Section title="Dostlar" count={data?.friends.length ?? 0}>
          {data?.friends.map((f) => (
            <div key={f.user.id} className="bg-card border border-primary/15 rounded-2xl p-3 flex items-center gap-3">
              <UserChip {...f.user} />
              <div className="flex-1" />
              <Link href={`/dm/${f.user.id}`} className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center active:scale-95">
                <MessageCircle className="w-4 h-4" />
              </Link>
              <button
                onClick={() => handleRemove(f.user.id)}
                className="w-9 h-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center active:scale-95"
                aria-label="Aýyr"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </Section>

        <Section title="Iberlen sorag" count={data?.outgoing.length ?? 0}>
          {data?.outgoing.map((f) => (
            <div key={f.user.id} className="bg-card border border-primary/10 rounded-2xl p-3 flex items-center gap-3">
              <UserChip {...f.user} />
              <div className="flex-1" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Garaşýar</span>
              <button
                onClick={() => handleRemove(f.user.id)}
                className="w-9 h-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center active:scale-95"
                aria-label="Yatyr"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </Section>
      </div>
    </Layout>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
