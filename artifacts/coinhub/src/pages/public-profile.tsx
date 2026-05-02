import { Layout } from "@/components/layout/Layout";
import { COIN } from "@/lib/coin";
import { useRoute, Link, useLocation } from "wouter";
import {
  useGetPublicProfile,
  getGetPublicProfileQueryKey,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRemoveFriend,
  getGetFriendsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "@/components/Avatar";
import { OwnerBadge } from "@/components/OwnerBadge";
import { Copy, MessageCircle, UserPlus, Check, X, ArrowRightLeft, Trophy, Gamepad2, Calendar } from "lucide-react";
import { fmtCoins, fmtDateShort } from "@/lib/utils";
import { useI18n } from "@/i18n";

export default function PublicProfile() {
  const [, params] = useRoute("/u/:publicId");
  const publicId = params?.publicId ?? "";
  const { data: profile, isLoading } = useGetPublicProfile(publicId, {
    query: { queryKey: getGetPublicProfileQueryKey(publicId), enabled: !!publicId },
  });
  const send = useSendFriendRequest();
  const accept = useAcceptFriendRequest();
  const remove = useRemoveFriend();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  if (isLoading || !profile) {
    return (
      <Layout>
        <div className="p-8 text-center text-xs text-muted-foreground">{t("loading")}</div>
      </Layout>
    );
  }

  const refresh = () => {
    qc.invalidateQueries({ queryKey: getGetPublicProfileQueryKey(publicId) });
    qc.invalidateQueries({ queryKey: getGetFriendsQueryKey() });
  };

  const handleAdd = () => {
    send.mutate(
      { data: { publicId: profile.publicId } },
      { onSuccess: () => { toast({ title: t("request_sent") }); refresh(); } },
    );
  };
  const handleAccept = () => {
    accept.mutate({ userId: profile.id }, { onSuccess: () => { toast({ title: t("friend_added") }); refresh(); } });
  };
  const handleRemove = () => {
    remove.mutate({ userId: profile.id }, { onSuccess: refresh });
  };
  const copyId = () => {
    navigator.clipboard.writeText(profile.publicId);
    toast({ title: t("id_copied") });
  };

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <div className="bg-card border border-primary/20 rounded-3xl p-6 flex flex-col items-center text-center gold-glow">
          <Avatar username={profile.username} color={profile.avatarColor} size="xl" />
          <div className="flex items-center gap-2 mt-4">
            <h1 className="text-2xl font-black text-white">{profile.username}</h1>
            {profile.isAdmin && <OwnerBadge size="md" />}
          </div>
          <button onClick={copyId} className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-primary">
            <span className="font-mono tracking-wider">#{profile.publicId}</span>
            <Copy className="w-3 h-3" />
          </button>
          {profile.bio && (
            <p className="text-sm text-muted-foreground mt-4 max-w-xs leading-relaxed">{profile.bio}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat icon={Trophy} label={t("rank_label")} value={profile.rank ? `#${profile.rank}` : "—"} />
          <Stat icon={ArrowRightLeft} label={t("balance_label")} value={fmtCoins(profile.coins)} suffix={COIN} />
          <Stat icon={Gamepad2} label={t("games_played")} value={String(profile.gamesPlayed)} />
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground justify-center">
          <Calendar className="w-3 h-3" />
          {t("joined_label")}: {fmtDateShort(profile.createdAt)}
        </div>

        {profile.friendStatus !== "self" && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/dm/${profile.id}`}>
                <button className="w-full h-12 rounded-xl bg-primary/10 border border-primary/30 text-primary font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-[0.98]">
                  <MessageCircle className="w-4 h-4" /> {t("write_message")}
                </button>
              </Link>
              <button
                onClick={() => setLocation(`/transfer?to=${profile.publicId}`)}
                className="w-full h-12 rounded-xl gold-gradient text-black font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <ArrowRightLeft className="w-4 h-4" /> {t("transfer")}
              </button>
            </div>

            {profile.friendStatus === "none" && (
              <button onClick={handleAdd} className="w-full h-12 rounded-xl bg-card border border-primary/20 text-white font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-[0.98]">
                <UserPlus className="w-4 h-4" /> {t("add_friend")}
              </button>
            )}
            {profile.friendStatus === "pending_outgoing" && (
              <button onClick={handleRemove} className="w-full h-12 rounded-xl bg-card border border-muted text-muted-foreground font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> {t("friend_request_pending")}
              </button>
            )}
            {profile.friendStatus === "pending_incoming" && (
              <button onClick={handleAccept} className="w-full h-12 rounded-xl gold-gradient text-black font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-[0.98]">
                <Check className="w-4 h-4" /> {t("accept_request")}
              </button>
            )}
            {profile.friendStatus === "friends" && (
              <button onClick={handleRemove} className="w-full h-12 rounded-xl bg-card border border-destructive/20 text-destructive font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-[0.98]">
                <X className="w-4 h-4" /> {t("remove_friend")}
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function Stat({ icon: Icon, label, value, suffix }: { icon: any; label: string; value: string; suffix?: string }) {
  return (
    <div className="bg-card border border-primary/10 rounded-2xl p-3 flex flex-col items-center gap-1 text-center">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm font-black text-white tabular-nums">{value}{suffix && <span className="text-[10px] text-muted-foreground ml-1">{suffix}</span>}</span>
    </div>
  );
}
