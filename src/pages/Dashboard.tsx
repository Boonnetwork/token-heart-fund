import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@/contexts/WalletContext';
import { useContracts } from '@/contexts/ContractContext';
import { useCrowdfunding, CampaignData } from '@/hooks/useCrowdfunding';
import { CampaignCard, Campaign } from '@/components/CampaignCard';
import { Wallet, Coins, Rocket, TrendingUp, Plus, Loader2, Heart, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { isConnected, address } = useWallet();
  const { tokenBalance, tokenSymbol, crowdfundingContract } = useContracts();
  const { campaigns, getMyCampaigns, getMyDonations, isLoading } = useCrowdfunding();
  
  const [myCampaignIds, setMyCampaignIds] = useState<number[]>([]);
  const [myDonationIds, setMyDonationIds] = useState<number[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

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
      setLoadingStats(false);
    };

    fetchUserData();
  }, [crowdfundingContract, address, getMyCampaigns, getMyDonations]);

  const myCampaigns = campaigns.filter(c => myCampaignIds.includes(c.id));
  const myDonatedCampaigns = campaigns.filter(c => myDonationIds.includes(c.id));

  const totalRaised = myCampaigns.reduce((sum, c) => sum + parseFloat(c.raisedAmount), 0);
  const totalDonated = myDonatedCampaigns.length; // Simplified - would need to track actual amounts

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
    status: c.status === 'cancelled' ? 'failed' : c.status,
    tokenSymbol: tokenSymbol,
  });

  if (!isConnected) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-8">Please connect your wallet to view your dashboard</p>
        </div>
      </Layout>
    );
  }

  if (!crowdfundingContract) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Contracts Not Configured</h1>
          <p className="text-muted-foreground mb-6">
            Please configure the smart contract addresses in the settings page.
          </p>
          <Button variant="gradient" asChild>
            <Link to="/settings">Go to Settings</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground font-mono text-sm">{address}</p>
          </div>
          <Button variant="gradient" asChild>
            <Link to="/create"><Plus className="w-4 h-4 mr-2" />New Campaign</Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Campaigns Backed</CardTitle>
              <Heart className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : myDonatedCampaigns.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for My Campaigns & Donations */}
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
                  <CampaignCard key={campaign.id} campaign={mapToCampaignCard(campaign)} />
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
