import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { ContractProvider } from "@/contexts/ContractContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkWarning } from "@/components/NetworkWarning";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import CreateCampaign from "./pages/CreateCampaign";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Staking from "./pages/Staking";
import Governance from "./pages/Governance";
import ProposalDetail from "./pages/ProposalDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <ContractProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <NetworkWarning />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/campaigns" element={<Campaigns />} />
                  <Route path="/campaign/:id" element={<CampaignDetail />} />
                  <Route path="/create" element={<CreateCampaign />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogPost />} />
                  <Route path="/staking" element={<Staking />} />
                  <Route path="/governance" element={<Governance />} />
                  <Route path="/governance/:id" element={<ProposalDetail />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ContractProvider>
        </WalletProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
