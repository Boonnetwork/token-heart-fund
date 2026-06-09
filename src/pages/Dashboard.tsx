import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@/contexts/WalletContext';
import { useContracts } from '@/contexts/ContractContext';
import { useCrowdfunding, CampaignData } from '@/hooks/useCrowdfunding';
import { CampaignCard, Campaign } from '@/components/CampaignCard';
import { ReferralPanel } from '@/components/ReferralPanel';
import { Wallet, Coins, Rocket, TrendingUp, Plus, Loader2, Heart, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const { isConnected, address } = useWallet();
  const { tokenBalance, tokenSymbol, crowdfundingContract } = useContracts();
  const { campaigns, getMyCampaigns, getMyDonations, cancelCampaign, getDonorContribution, isLoading, fetchCampaigns } = useCrowdfunding();
  
  const [myCampaignIds, setMyCampaignIds] = useState<number[]>([]);
  const [myDonationIds, setMyDonationIds] = useState<number[]>([]);
  const [totalDonated, setTotalDonated] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!crowdfundingContract || !address) return;
      
      setLoadingStats(true);
      const [campaignIds, donationIds] = await Promise.all([
        getMyCampaigns(),
        getMyDonations(),
      ]);
      
      setMyCampaignIds(campaignIds);
      setMyDonationIds(donationIds);

      let total = 0;
      for (const id of donationIds) {
        const contribution = await getDonorContribution(id, address);
        total += parseFloat(contribution);
      }
      setTotalDonated(total);
      
      setLoadingStats(false);
    };

    fetchUserData();
  }, [crowdfundingContract, address, getMyCampaigns, getMyDonations, getDonorContribution]);

  const myCampaigns = campaigns.filter(c => myCampaignIds.includes(c.id));
  const myDonatedCampaigns = campaigns.filter(c => myDonationIds.includes(c.id));
  const totalRaised = myCampaigns.reduce((sum, c) => sum + parseFloat(c.raisedAmount), 0);

  const handleCancelCampaign = async (campaignId: number) => {
    setCancellingId(campaignId);
    await cancelCampaign(campaignId);
    setCancellingId(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCampaigns();
    setIsRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const mapToCampaignCard = (c: CampaignData): Campaign => ({
    id: c.id.toString(),
    title: c.title,
    shortDescription: c.description.slice(0, 150) + (c.description.length > 150 ? '...' : ''),
    imageUrl: c.imageUrl,
    goalAmount: parseFloat(c.goalAmount),
    raisedAmount: parseFloat(c.raisedAmount),
    deadline: c.deadline,
    creatorAddress: c.creator,
    donorsCount: c.donorCount,
    status: c.status,
    tokenSymbol: tokenSymbol,
    category: c.category,
  });

  // Redirect to home if wallet not connected
  if (!isConnected) {
    return <Navigate to="/" replace />;
  }

  if (!crowdfundingContract) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Contracts Not Configured</h1>
          <p className="text-muted-foreground mb-6">Please configure the smart contract addresses in the settings page.</p>
          <Button variant="gradient" asChild>
            <Link to="/settings">Go to Settings</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Dashboard</h1>
            <p className="text-muted-foreground font-mono text-xs sm:text-sm truncate">{address}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("w-4 h-4 sm:mr-1", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="gradient" size="sm" asChild className="sm:h-10">
              <Link to="/create"><Plus className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">New Campaign</span><span className="sm:hidden ml-1">New</span></Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-10">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Token Balance</CardTitle>
              <Coins className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {parseFloat(tokenBalance).toLocaleString()} {tokenSymbol}
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Campaigns</CardTitle>
              <Rocket className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : myCampaigns.length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Raised</CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : `${totalRaised.toLocaleString()} ${tokenSymbol}`}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Donated</CardTitle>
              <Heart className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : `${totalDonated.toLocaleString()} ${tokenSymbol}`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Panel (staking only) */}
        <div className="mb-8 sm:mb-10">
          <ReferralPanel />
        </div>



        {/* Tabs */}
        <Tabs defaultValue="my-campaigns" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="my-campaigns">My Campaigns</TabsTrigger>
            <TabsTrigger value="my-donations">My Donations</TabsTrigger>
          </TabsList>

          <TabsContent value="my-campaigns">
            {isLoading || loadingStats ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : myCampaigns.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">You haven't created any campaigns yet.</p>
                  <Button variant="gradient" asChild>
                    <Link to="/create">Create Your First Campaign</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCampaigns.map(campaign => (
                  <div key={campaign.id} className="relative">
                    <CampaignCard campaign={mapToCampaignCard(campaign)} />
                    {campaign.status === 'active' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="absolute top-2 left-2 z-10"
                            disabled={cancellingId === campaign.id}
                          >
                            {cancellingId === campaign.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <><XCircle className="w-4 h-4 mr-1" />Cancel</>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Campaign?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. All donors will be able to claim refunds.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Campaign</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleCancelCampaign(campaign.id)}>
                              Yes, Cancel Campaign
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-donations">
            {isLoading || loadingStats ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : myDonatedCampaigns.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">You haven't backed any campaigns yet.</p>
                  <Button variant="gradient" asChild>
                    <Link to="/campaigns">Explore Campaigns</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myDonatedCampaigns.map(campaign => (
                  <CampaignCard key={campaign.id} campaign={mapToCampaignCard(campaign)} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;
