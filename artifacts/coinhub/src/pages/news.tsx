import { Layout } from "@/components/layout/Layout";
import { useGetNews, getGetNewsQueryKey } from "@workspace/api-client-react";
import { Newspaper } from "lucide-react";
import { fmtDateShort } from "@/lib/utils";
import { useI18n } from "@/i18n";

export default function News() {
  const { data: news = [], isLoading } = useGetNews({ query: { queryKey: getGetNewsQueryKey() } });
  const { t } = useI18n();

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <header>
          <h1 className="text-2xl font-black italic gold-text-gradient uppercase tracking-tighter">{t("news")}</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{t("news_subtitle")}</p>
        </header>

        {isLoading ? (
          <div className="text-center py-12 text-xs text-muted-foreground">{t("loading")}</div>
        ) : news.length === 0 ? (
          <div className="bg-card/40 border border-dashed border-primary/15 rounded-3xl p-10 flex flex-col items-center gap-3 text-center">
            <Newspaper className="w-10 h-10 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("news_empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((n) => (
              <article key={n.id} className="bg-card border border-primary/15 rounded-2xl p-5 space-y-2 gold-glow">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-black text-white text-base flex-1">{n.title}</h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary shrink-0">{fmtDateShort(n.createdAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{n.body}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
