import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n";
import { AnimatePresence } from "framer-motion";
import { AppSplash } from "@/components/AppSplash";
import NotFound from "@/pages/not-found";

import Splash from "@/pages/splash";
import Home from "@/pages/home";
import GamesHub from "@/pages/games/index";
import SpinGame from "@/pages/games/spin";
import LuckyBoxGame from "@/pages/games/luckybox";
import SlotGame from "@/pages/games/slot";
import CrashGame from "@/pages/games/crash";
import DiceGame from "@/pages/games/dice";
import MinesGame from "@/pages/games/mines";
import RouletteGame from "@/pages/games/roulette";
import PlinkoGame from "@/pages/games/plinko";
import HiLoGame from "@/pages/games/hilo";
import Chat from "@/pages/chat";
import Wallet from "@/pages/wallet";
import Profile from "@/pages/profile";
import Leaderboard from "@/pages/leaderboard";

import Settings from "@/pages/settings";
import EditProfile from "@/pages/edit-profile";
import FAQ from "@/pages/faq";
import About from "@/pages/about";
import News from "@/pages/news";
import Notifications from "@/pages/notifications";
import Friends from "@/pages/friends";
import DmList from "@/pages/dm";
import DmThread from "@/pages/dm-thread";
import PublicProfile from "@/pages/public-profile";
import Transfer from "@/pages/transfer";

import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUserDetail from "@/pages/admin/user-detail";
import AdminTransactions from "@/pages/admin/transactions";
import ResetPassword from "@/pages/reset-password";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Splash} />
      <Route path="/home" component={Home} />
      <Route path="/games" component={GamesHub} />
      <Route path="/games/spin" component={SpinGame} />
      <Route path="/games/luckybox" component={LuckyBoxGame} />
      <Route path="/games/slot" component={SlotGame} />
      <Route path="/games/crash" component={CrashGame} />
      <Route path="/games/dice" component={DiceGame} />
      <Route path="/games/mines" component={MinesGame} />
      <Route path="/games/roulette" component={RouletteGame} />
      <Route path="/games/plinko" component={PlinkoGame} />
      <Route path="/games/hilo" component={HiLoGame} />
      <Route path="/chat" component={Chat} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/profile" component={Profile} />
      <Route path="/leaderboard" component={Leaderboard} />

      <Route path="/settings" component={Settings} />
      <Route path="/edit-profile" component={EditProfile} />
      <Route path="/faq" component={FAQ} />
      <Route path="/about" component={About} />
      <Route path="/news" component={News} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/friends" component={Friends} />
      <Route path="/dm" component={DmList} />
      <Route path="/dm/:userId" component={DmThread} />
      <Route path="/u/:publicId" component={PublicProfile} />
      <Route path="/transfer" component={Transfer} />

      <Route path="/reset-password" component={ResetPassword} />

      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/users/:userId" component={AdminUserDetail} />
      <Route path="/admin/transactions" component={AdminTransactions} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem("coinhub_splash_done");
    } catch {
      return true;
    }
  });

  const handleSplashDone = () => {
    try { sessionStorage.setItem("coinhub_splash_done", "1"); } catch { /* ignore */ }
    setShowSplash(false);
  };

  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AnimatePresence>
            {showSplash && <AppSplash key="app-splash" onDone={handleSplashDone} />}
          </AnimatePresence>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster theme="dark" richColors />
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
