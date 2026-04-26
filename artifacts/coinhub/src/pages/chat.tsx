import { Layout } from "@/components/layout/Layout";
import { useState, useEffect, useRef } from "react";
import { 
  useGetChatMessages, 
  usePostChatMessage, 
  getGetChatMessagesQueryKey, 
  useGetMe, 
  getGetMeQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Users, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function relativeTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Häzir";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minut öň`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} sagat öň`;
  
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  
  return `${dd}.${mm} ${hh}:${min}`;
}

export default function Chat() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: messages = [] } = useGetChatMessages(
    { limit: 50 },
    { 
      query: { 
        refetchInterval: 2500, 
        queryKey: getGetChatMessagesQueryKey({ limit: 50 }) 
      } 
    }
  );
  const postChat = usePostChatMessage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const message = text.trim();
    if (!message || postChat.isPending) return;

    postChat.mutate(
      { data: { message } },
      {
        onSuccess: () => {
          setText("");
          queryClient.invalidateQueries({ queryKey: getGetChatMessagesQueryKey({ limit: 50 }) });
        },
        onError: (err: any) => {
          if (err.status === 429) {
            toast({ title: "Çalt ýazýarsyňyz", variant: "destructive" });
          } else {
            toast({ title: "Ýalňyşlyk", description: err.message, variant: "destructive" });
          }
        }
      }
    );
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100dvh-64px-128px)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10 bg-card/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black italic gold-text-gradient uppercase tracking-tight">GLOBAL ÇAT</h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase">Online</span>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.userId === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                >
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2 relative",
                    isMe 
                      ? "bg-primary/20 border border-primary/20 text-white rounded-tr-none" 
                      : "bg-card border border-primary/5 text-white/90 rounded-tl-none"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-[10px] font-bold", isMe ? "text-primary" : "text-primary/70")}>
                        {msg.username}
                      </span>
                      <span className="text-[8px] opacity-40 font-mono">#{msg.publicId}</span>
                    </div>
                    <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                    <span className="text-[8px] opacity-40 block mt-1 text-right italic">
                      {relativeTime(msg.createdAt)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>

        {/* Sticky Bottom Input */}
        <form 
          onSubmit={handleSend}
          className="p-4 bg-background border-t border-primary/10 flex gap-2 items-center"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Habar ýazyň..."
            maxLength={200}
            className="flex-1 bg-card border border-primary/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <button
            type="submit"
            disabled={!text.trim() || postChat.isPending}
            className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </Layout>
  );
}
