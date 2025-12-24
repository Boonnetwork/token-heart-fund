import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/contexts/WalletContext';
import { useContracts } from '@/contexts/ContractContext';
import { useCrowdfunding, CampaignData, DonationData } from '@/hooks/useCrowdfunding';
import { ShareButtons } from '@/components/ShareButtons';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Target, 
  Wallet, 
  Heart,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  ImageOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Dynamic quick-select amounts based on goal
const getQuickSelectAmounts = (goalAmount: number): number[] => {
  if (goalAmount >= 100000) return [1000, 5000, 10000];
  if (goalAmount >= 10000) return [100, 500, 1000];
  if (goalAmount >= 1000) return [50, 100, 500];
  if (goalAmount >= 100) return [10, 25, 50];
  return [1, 5, 10];
};

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, address } = useWallet();
  const { tokenBalance, tokenSymbol, crowdfundingContract, refreshTokenBalance } = useContracts();
  const { getCampaign, getCampaignDonations, getDonorContribution, donate, claimFunds, claimRefund } = useCrowdfunding();
  
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [donations, setDonations] = useState<DonationData[]>([]);
  const [myContribution, setMyContribution] = useState('0');
  const [donateAmount, setDonateAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setNotFound(false);
      const campaignId = parseInt(id);
      
      // Validate campaign ID is a valid number
      if (isNaN(campaignId) || campaignId < 1) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      
      const [campaignData, donationsData] = await Promise.all([
        getCampaign(campaignId),
        getCampaignDonations(campaignId),
      ]);
      
      if (!campaignData) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      
      setCampaign(campaignData);
      setDonations(donationsData);
      setImageError(false);
      
      if (address && campaignData) {
        const contribution = await getDonorContribution(campaignId, address);
        setMyContribution(contribution);
      }
      
      setIsLoading(false);
    };

    if (crowdfundingContract) {
      fetchData();
    } else if (id) {
      // Contract not configured but we have an ID
      setIsLoading(false);
    }
  }, [id, address, crowdfundingContract, getCampaign, getCampaignDonations, getDonorContribution]);

  const handleDonate = async () => {
    if (!campaign || !donateAmount || parseFloat(donateAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(donateAmount) > parseFloat(tokenBalance)) {
      toast.error('Insufficient token balance');
      return;
    }

    setIsProcessing(true);
    const success = await donate(campaign.id, donateAmount);
    if (success) {
      setDonateAmount('');
      // Refresh data
      const [updatedCampaign, updatedDonations] = await Promise.all([
        getCampaign(campaign.id),
        getCampaignDonations(campaign.id),
      ]);
      setCampaign(updatedCampaign);
      setDonations(updatedDonations);
      if (address) {
        const contribution = await getDonorContribution(campaign.id, address);
        setMyContribution(contribution);
      }
      // Token balance is now refreshed in the donate function
    }
    setIsProcessing(false);
  };

  const handleClaimFunds = async () => {
    if (!campaign) return;
    setIsProcessing(true);
    await claimFunds(campaign.id);
    const updatedCampaign = await getCampaign(campaign.id);
    setCampaign(updatedCampaign);
    setIsProcessing(false);
  };

  const handleClaimRefund = async () => {
    if (!campaign) return;
    setIsProcessing(true);
    await claimRefund(campaign.id);
    const [updatedCampaign, contribution] = await Promise.all([
      getCampaign(campaign.id),
      getDonorContribution(campaign.id, address!),
    ]);
    setCampaign(updatedCampaign);
    setMyContribution(contribution);
    setIsProcessing(false);
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success('Address copied!');
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Loading skeleton
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-40 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video w-full rounded-2xl" />
              <div>
                <Skeleton className="h-10 w-3/4 mb-3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
              <Card className="glass-card">
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="glass-card">
                <CardContent className="pt-6 space-y-4">
                  <Skeleton className="h-10 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Not found state (404)
  if (notFound || !campaign) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Campaign Not Found</h1>
          <p className="text-muted-foreground mb-6">
            Campaign #{id} doesn't exist or has been removed.
          </p>
          <Button variant="outline" asChild>
            <Link to="/campaigns"><ArrowLeft className="w-4 h-4 mr-2" />Browse Campaigns</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const progress = (parseFloat(campaign.raisedAmount) / parseFloat(campaign.goalAmount)) * 100;
  const daysLeft = Math.max(0, Math.ceil((campaign.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isEnded = campaign.deadline.getTime() < Date.now();
  const isCreator = address?.toLowerCase() === campaign.creator.toLowerCase();
  const canClaimFunds = isCreator && isEnded && campaign.status === 'completed' && !campaign.claimed;
  const canClaimRefund = parseFloat(myContribution) > 0 && isEnded && campaign.status === 'failed';
  const canDonate = campaign.status === 'active' && !isEnded;
  const quickSelectAmounts = getQuickSelectAmounts(parseFloat(campaign.goalAmount));

  const statusConfig = {
    active: { label: 'Active', icon: Clock, className: 'bg-emerald/20 text-emerald border-emerald/30' },
    completed: { label: 'Funded', icon: CheckCircle, className: 'bg-primary/20 text-primary border-primary/30' },
    failed: { label: 'Failed', icon: XCircle, className: 'bg-destructive/20 text-destructive border-destructive/30' },
    cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-muted text-muted-foreground border-border' },
  };

  const StatusIcon = statusConfig[campaign.status].icon;
  const fallbackImage = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/campaigns"><ArrowLeft className="w-4 h-4 mr-2" />Back to Campaigns</Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-muted">
              {imageError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <ImageOff className="w-12 h-12 mb-2" />
                  <span className="text-sm">Image not available</span>
                </div>
              ) : (
                <img 
                  src={campaign.imageUrl || fallbackImage} 
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              )}
              <Badge 
                variant="outline" 
                className={cn("absolute top-4 right-4 text-sm", statusConfig[campaign.status].className)}
              >
                <StatusIcon className="w-4 h-4 mr-1" />
                {statusConfig[campaign.status].label}
              </Badge>
            </div>

            {/* Title & Creator */}
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                {campaign.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Created by</span>
                  <button 
                    onClick={() => copyAddress(campaign.creator)}
                    className="font-mono text-primary hover:underline flex items-center gap-1"
                  >
                    {formatAddress(campaign.creator)}
                    <Copy className="w-3 h-3" />
                  </button>
                  <a 
                    href={`https://testnet.bscscan.com/address/${campaign.creator}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <ShareButtons title={campaign.title} />
              </div>
            </div>

            {/* Description */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>About this Campaign</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{campaign.description}</p>
              </CardContent>
            </Card>

            {/* Recent Donations */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Recent Donations ({donations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {donations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No donations yet. Be the first!</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {donations.slice().reverse().slice(0, 20).map((donation, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Heart className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-mono text-sm text-foreground">{formatAddress(donation.donor)}</p>
                            <p className="text-xs text-muted-foreground">{donation.timestamp.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-primary">{parseFloat(donation.amount).toLocaleString()} {tokenSymbol}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card className="glass-card sticky top-24">
              <CardContent className="pt-6 space-y-6">
                {/* Amount Raised */}
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-foreground">
                      {parseFloat(campaign.raisedAmount).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">{tokenSymbol}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    raised of {parseFloat(campaign.goalAmount).toLocaleString()} {tokenSymbol} goal
                  </p>
                </div>

                {/* Progress Bar */}
                <div>
                  <Progress value={Math.min(progress, 100)} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-2">{progress.toFixed(1)}% funded</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-lg font-semibold text-foreground">{campaign.donorCount}</p>
                    <p className="text-xs text-muted-foreground">Backers</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-lg font-semibold text-foreground">{isEnded ? 'Ended' : daysLeft}</p>
                    <p className="text-xs text-muted-foreground">{isEnded ? '' : 'days left'}</p>
                  </div>
                </div>

                <Separator />

                {/* Donate Section */}
                {isConnected ? (
                  <>
                    {canDonate && (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Your balance: <span className="text-foreground font-semibold">{parseFloat(tokenBalance).toLocaleString()} {tokenSymbol}</span>
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={donateAmount}
                            onChange={(e) => setDonateAmount(e.target.value)}
                            className="flex-1"
                          />
                          <span className="flex items-center text-muted-foreground text-sm">{tokenSymbol}</span>
                        </div>
                        <div className="flex gap-2">
                          {quickSelectAmounts.map((amount) => (
                            <Button 
                              key={amount}
                              variant="outline" 
                              size="sm"
                              className="flex-1"
                              onClick={() => setDonateAmount(amount.toString())}
                            >
                              {amount.toLocaleString()}
                            </Button>
                          ))}
                        </div>
                        <Button 
                          variant="gradient" 
                          className="w-full" 
                          size="lg"
                          onClick={handleDonate}
                          disabled={isProcessing || !donateAmount}
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Heart className="w-4 h-4 mr-2" />}
                          Donate Now
                        </Button>
                      </div>
                    )}

                    {/* My Contribution */}
                    {parseFloat(myContribution) > 0 && (
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm text-muted-foreground">Your contribution</p>
                        <p className="text-lg font-bold text-primary">{parseFloat(myContribution).toLocaleString()} {tokenSymbol}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {canClaimFunds && (
                      <Button variant="gradient" className="w-full" onClick={handleClaimFunds} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Claim Funds
                      </Button>
                    )}

                    {canClaimRefund && (
                      <Button variant="outline" className="w-full" onClick={handleClaimRefund} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Claim Refund
                      </Button>
                    )}

                    {!canDonate && !canClaimFunds && !canClaimRefund && (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">This campaign is no longer accepting donations.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-3">Connect your wallet to donate</p>
                  </div>
                )}

                {/* Campaign Dates */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Created: {campaign.createdAt.toLocaleDateString()}</p>
                  <p>Deadline: {campaign.deadline.toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CampaignDetail;
