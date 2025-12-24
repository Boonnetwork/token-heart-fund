import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { ContractProvider } from "@/contexts/ContractContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkWarning } from "@/components/NetworkWarning";
import Index from "./pages/Index";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import CreateCampaign from "./pages/CreateCampaign";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ContractProvider>
      </WalletProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
