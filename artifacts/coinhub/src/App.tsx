import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Splash from "@/pages/splash";
import Home from "@/pages/home";
import GamesHub from "@/pages/games/index";
import SpinGame from "@/pages/games/spin";
import LuckyBoxGame from "@/pages/games/luckybox";
import TapGame from "@/pages/games/tap";
import Wallet from "@/pages/wallet";
import Profile from "@/pages/profile";
import Leaderboard from "@/pages/leaderboard";

import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUserDetail from "@/pages/admin/user-detail";
import AdminTransactions from "@/pages/admin/transactions";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
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
      <Route path="/games/tap" component={TapGame} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/profile" component={Profile} />
      <Route path="/leaderboard" component={Leaderboard} />
      
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/users/:userId" component={AdminUserDetail} />
      <Route path="/admin/transactions" component={AdminTransactions} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster theme="dark" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
