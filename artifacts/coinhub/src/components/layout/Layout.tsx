import { BottomNav } from "./BottomNav";
import { TopHeader } from "./TopHeader";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
  hideHeader?: boolean;
}

export function Layout({ children, hideNav = false, hideHeader = false }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] w-full bg-background flex justify-center text-foreground font-sans">
      <div className="w-full max-w-md relative min-h-screen bg-background shadow-2xl flex flex-col border-x border-primary/5">
        {!hideHeader && <TopHeader />}

        <main className="flex-1 overflow-y-auto pb-24 relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center opacity-30">
            <div className="w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
          </div>

          <div className="relative z-10 h-full">
            {children}
          </div>
        </main>

        {!hideNav && <BottomNav />}
        <PWAInstallPrompt />
      </div>
    </div>
  );
}
