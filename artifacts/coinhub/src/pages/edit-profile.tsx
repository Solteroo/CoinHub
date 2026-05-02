import { Layout } from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { useGetMe, getGetMeQueryKey, useUpdateMyProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User, Sparkles, Calendar, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { motion } from "framer-motion";

const COLORS = ["#D4AF37", "#E94E77", "#3DA5D9", "#7CB518", "#9B5DE5", "#F77F00", "#06D6A0", "#EF476F"];

const MALE_AVATARS = ["👨", "🧔", "👱", "🧑", "🕵️", "🦸"];
const FEMALE_AVATARS = ["👩", "👩‍💼", "👸", "🧕", "💃", "🦸‍♀️"];

export default function EditProfile() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const update = useUpdateMyProfile();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [color, setColor] = useState("#D4AF37");
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");
  const [birthday, setBirthday] = useState("");

  const isNewUser = user ? /^[a-zA-Z0-9]+_[A-Z0-9]{4,}$/.test(user.username) : false;

  useEffect(() => {
    if (user) {
      setUsername(isNewUser ? "" : user.username);
      setBio(user.bio ?? "");
      setColor(user.avatarColor ?? "#D4AF37");
      setSelectedEmoji((user as any).avatarEmoji ?? "");
      setBirthday((user as any).birthday ?? "");
    }
  }, [user?.id]);

  if (!user) return null;

  const displayUsername = username.trim() || (isNewUser ? "" : user.username);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim().replace(/[^a-zA-Z0-9_]/g, "");
    if (isNewUser && trimmed.length < 3) {
      toast({ title: t("error"), description: t("username_min_3"), variant: "destructive" });
      return;
    }
    const data: Record<string, string> = {
      bio,
      avatarColor: color,
      avatarEmoji: selectedEmoji,
    };
    if (trimmed.length >= 3) data.username = trimmed;
    if (birthday) data.birthday = birthday;

    update.mutate(
      { data: data as any },
      {
        onSuccess: () => {
          toast({ title: t("saved") });
          qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setLocation("/home");
        },
        onError: (err: any) => {
          toast({ title: t("error"), description: err?.message ?? "", variant: "destructive" });
        },
      },
    );
  };

  return (
    <Layout>
      <form onSubmit={handleSave} className="pb-28">
        {/* Hero header */}
        <div className="relative overflow-hidden hero-grid px-4 pt-5 pb-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] pointer-events-none float-orb" />
          <div className="relative z-10">
            {isNewUser && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-2"
              >
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-xs font-black uppercase tracking-widest text-primary">{t("almost_done")}</span>
              </motion.div>
            )}
            <h1 className="text-3xl font-black italic gold-text-gradient uppercase tracking-tighter leading-none">
              {t("edit_profile")}
            </h1>
            {isNewUser && (
              <p className="text-[11px] text-muted-foreground mt-1">{t("set_username_hint")}</p>
            )}
          </div>
        </div>

        <div className="px-4 space-y-5 pt-4">
          {/* Avatar preview */}
          <div className="flex items-center gap-5 py-5 px-5 bg-card border border-primary/15 rounded-3xl">
            <Avatar
              username={displayUsername || user.username}
              color={color}
              emoji={selectedEmoji || null}
              size="lg"
            />
            <div>
              <p className="text-lg font-black text-white">
                {displayUsername || <span className="text-muted-foreground italic">{t("your_name")}</span>}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">#{user.publicId}</p>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {t("username_label")}
              {isNewUser && <span className="text-destructive">*</span>}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm pointer-events-none">@</span>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 24))}
                placeholder={isNewUser ? t("username_ph_required") : t("username_ph")}
                className={cn(
                  "bg-card border-primary/20 h-12 pl-8 font-bold",
                  isNewUser && "border-primary/50 ring-1 ring-primary/20",
                )}
                autoComplete="username"
                autoFocus={isNewUser}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">{t("username_hint")}</p>
          </div>

          {/* Avatar picker — Men */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t("choose_avatar")}</label>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">{t("avatar_men")}</p>
              <div className="grid grid-cols-6 gap-2">
                {MALE_AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(selectedEmoji === emoji ? "" : emoji)}
                    className={cn(
                      "aspect-square rounded-2xl text-2xl flex items-center justify-center transition-all active:scale-90 border-2",
                      selectedEmoji === emoji
                        ? "border-primary bg-primary/15 scale-110 shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                        : "border-white/10 bg-card hover:border-primary/30 hover:bg-primary/5",
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mt-2">{t("avatar_women")}</p>
              <div className="grid grid-cols-6 gap-2">
                {FEMALE_AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(selectedEmoji === emoji ? "" : emoji)}
                    className={cn(
                      "aspect-square rounded-2xl text-2xl flex items-center justify-center transition-all active:scale-90 border-2",
                      selectedEmoji === emoji
                        ? "border-primary bg-primary/15 scale-110 shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                        : "border-white/10 bg-card hover:border-primary/30 hover:bg-primary/5",
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {selectedEmoji && (
                <button
                  type="button"
                  onClick={() => setSelectedEmoji("")}
                  className="text-[10px] text-muted-foreground underline"
                >
                  {t("remove_avatar")}
                </button>
              )}
            </div>
          </div>

          {/* Background color */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t("choose_color")}</label>
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
                  {color === c && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Birthday */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {t("birthday_label")}
            </label>
            <Input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="bg-card border-primary/20 h-12 text-white [color-scheme:dark]"
            />
            <p className="text-[10px] text-muted-foreground">{t("birthday_hint")}</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              placeholder={t("bio_ph")}
              rows={3}
              className="w-full bg-card border border-primary/20 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right">{bio.length}/200</p>
          </div>

          {/* Save */}
          <Button
            type="submit"
            disabled={update.isPending}
            className="w-full h-13 rounded-2xl gold-gradient text-black font-black uppercase tracking-widest text-sm neon-pulse"
          >
            {update.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isNewUser ? t("continue_btn") : t("save")}
          </Button>
        </div>
      </form>
    </Layout>
  );
}
