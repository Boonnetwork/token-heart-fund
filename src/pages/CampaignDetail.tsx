import React, { useState, useEffect, useCallback } from 'react';
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
import { useCrowdfunding, CampaignData, DonationData, ClaimEventData } from '@/hooks/useCrowdfunding';
import { useContractEvents } from '@/hooks/useContractEvents';
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
  ImageOff,
  RefreshCw,
  BadgeCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const { getCampaign, getCampaignDonations, getClaimEvent, getDonorContribution, donate, claimFunds, claimRefund } = useCrowdfunding();
  
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [donations, setDonations] = useState<DonationData[]>([]);
  const [claimEvent, setClaimEvent] = useState<ClaimEventData | null>(null);
  const [myContribution, setMyContribution] = useState('0');
  const [donateAmount, setDonateAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (retryCount = 0) => {
    if (!id || !crowdfundingContract) return;
    
    const campaignId = parseInt(id);
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
      // Retry up to 3 times with delay for freshly created campaigns
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchData(retryCount + 1);
      }
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    
    setCampaign(campaignData);
    setDonations(donationsData);
    setImageError(false);
    
    // Fetch claim event if claimed
    if (campaignData.claimed) {
      const claimData = await getClaimEvent(campaignId);
      setClaimEvent(claimData);
    }
    
    if (address && campaignData) {
      const contribution = await getDonorContribution(campaignId, address);
      setMyContribution(contribution);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    setNotFound(false);
    if (crowdfundingContract) {
      fetchData();
    }
  }, [id, address, crowdfundingContract]);

  // Real-time event listeners for instant UI updates
  const campaignId = id ? parseInt(id) : 0;
  
  useContractEvents({
    onDonationMade: useCallback((evCampaignId: number, donor: string, amount: string) => {
      if (evCampaignId === campaignId) {
        // Refresh campaign data when a donation is made to this campaign
        fetchData();
        refreshTokenBalance().catch(() => {});
      }
    }, [campaignId]),
    onFundsClaimed: useCallback((evCampaignId: number) => {
      if (evCampaignId === campaignId) fetchData();
    }, [campaignId]),
    onRefundClaimed: useCallback((evCampaignId: number) => {
      if (evCampaignId === campaignId) fetchData();
    }, [campaignId]),
    onCampaignCancelled: useCallback((evCampaignId: number) => {
      if (evCampaignId === campaignId) fetchData();
    }, [campaignId]),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    toast.success('Campaign data refreshed');
  };

  const handleDonate = async () => {
    if (!campaign || !donateAmount || parseFloat(donateAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(donateAmount) > parseFloat(tokenBalance)) {
      toast.error('Insufficient token balance');
      return;
    }

    const remaining = parseFloat(campaign.goalAmount) - parseFloat(campaign.raisedAmount);
    if (remaining <= 0) {
      toast.error('Campaign goal has already been reached');
      return;
    }

    setIsProcessing(true);
    const success = await donate(campaign.id, donateAmount);
    if (success) {
      setDonateAmount('');
      // Small delay to allow blockchain state to propagate before re-fetching
      await new Promise(r => setTimeout(r, 2000));
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
    }
    setIsProcessing(false);
  };

  const handleClaimFunds = async () => {
    if (!campaign) return;
    setIsProcessing(true);
    await claimFunds(campaign.id);
    const updatedCampaign = await getCampaign(campaign.id);
    setCampaign(updatedCampaign);
    if (updatedCampaign?.claimed) {
      const claimData = await getClaimEvent(campaign.id);
      setClaimEvent(claimData);
    }
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

  const copyText = (text: string, label = 'Copied!') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatTxHash = (hash: string) => `${hash.slice(0, 10)}...${hash.slice(-6)}`;

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
            </div>
            <div>
              <Card className="glass-card">
                <CardContent className="pt-6 space-y-4">
                  <Skeleton className="h-10 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (notFound || !campaign) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Campaign Not Found</h1>
          <p className="text-muted-foreground mb-6">Campaign #{id} doesn't exist or has been removed.</p>
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
  const goalReached = parseFloat(campaign.raisedAmount) >= parseFloat(campaign.goalAmount);
  const remainingToGoal = Math.max(0, parseFloat(campaign.goalAmount) - parseFloat(campaign.raisedAmount));

  // Allow early claim if goal reached (even before deadline), as long as not already claimed
  const canClaimFunds = isCreator && goalReached && !campaign.claimed && !campaign.cancelled;
  const canClaimRefund = parseFloat(myContribution) > 0 && isEnded && campaign.status === 'failed';
  // Block donations if goal reached or deadline passed
  const canDonate = campaign.status === 'active' && !isEnded && !goalReached;
  const quickSelectAmounts = getQuickSelectAmounts(parseFloat(campaign.goalAmount));

  const statusConfig = {
    active: { label: 'Active', icon: Clock, className: 'bg-emerald/20 text-emerald border-emerald/30' },
    completed: { label: campaign.claimed ? 'Funds Released' : 'Goal Reached', icon: CheckCircle, className: 'bg-primary/20 text-primary border-primary/30' },
    failed: { label: 'Failed', icon: XCircle, className: 'bg-destructive/20 text-destructive border-destructive/30' },
    cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-muted text-muted-foreground border-border' },
  };

  const StatusIcon = statusConfig[campaign.status].icon;
  const fallbackImage = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800';
  const campaignUrl = `${window.location.origin}/campaign/${campaign.id}`;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Back & Refresh */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link to="/campaigns"><ArrowLeft className="w-4 h-4 mr-2" />Back to Campaigns</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("w-4 h-4 mr-1", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

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
                    onClick={() => copyText(campaign.creator, 'Address copied!')}
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
              </div>
              <ShareButtons title={campaign.title} url={campaignUrl} className="mt-3" />
            </div>

            {/* Funds Released Indicator */}
            {campaign.claimed && claimEvent && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="w-6 h-6 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">Funds Released</p>
                      <p className="text-sm text-muted-foreground">
                        {parseFloat(claimEvent.amount).toLocaleString()} {tokenSymbol} claimed (Fee: {parseFloat(claimEvent.platformFee).toLocaleString()} {tokenSymbol})
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={`https://testnet.bscscan.com/tx/${claimEvent.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline font-mono flex items-center gap-1"
                        >
                          Tx: {formatTxHash(claimEvent.txHash)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button onClick={() => copyText(claimEvent.txHash, 'Tx hash copied!')} className="text-muted-foreground hover:text-foreground">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {donations.slice().reverse().slice(0, 20).map((donation, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border/50 last:border-0 gap-2">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Heart className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            {/* Donor address */}
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`https://testnet.bscscan.com/address/${donation.donor}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-sm text-foreground hover:text-primary hover:underline"
                              >
                                {formatAddress(donation.donor)}
                              </a>
                              <button onClick={() => copyText(donation.donor, 'Address copied!')} className="text-muted-foreground hover:text-foreground">
                                <Copy className="w-3 h-3" />
                              </button>
                              <a
                                href={`https://testnet.bscscan.com/address/${donation.donor}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            {/* Tx hash */}
                            {donation.txHash && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <a
                                  href={`https://testnet.bscscan.com/tx/${donation.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-xs text-primary/70 hover:text-primary hover:underline"
                                >
                                  Tx: {formatTxHash(donation.txHash)}
                                </a>
                                <button onClick={() => copyText(donation.txHash!, 'Tx hash copied!')} className="text-muted-foreground hover:text-foreground">
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">{donation.timestamp.toLocaleDateString()} {donation.timestamp.toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-primary text-sm sm:text-base pl-11 sm:pl-0">{parseFloat(donation.amount).toLocaleString()} {tokenSymbol}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                  {goalReached && (
                    <Badge className="mt-2 bg-emerald/20 text-emerald border-emerald/30">
                      <CheckCircle className="w-3 h-3 mr-1" /> Goal Reached!
                    </Badge>
                  )}
                  {!goalReached && canDonate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Remaining: {remainingToGoal.toLocaleString()} {tokenSymbol}
                    </p>
                  )}
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
                            placeholder={`Max: ${remainingToGoal.toLocaleString()}`}
                            value={donateAmount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (val > remainingToGoal) {
                                setDonateAmount(remainingToGoal.toString());
                                toast.info(`Capped at ${remainingToGoal.toLocaleString()} ${tokenSymbol} (remaining to goal)`);
                              } else {
                                setDonateAmount(e.target.value);
                              }
                            }}
                            max={remainingToGoal}
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
                              onClick={() => {
                                const capped = Math.min(amount, remainingToGoal);
                                setDonateAmount(capped.toString());
                              }}
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

                    {goalReached && !canClaimFunds && !campaign.claimed && (
                      <div className="text-center py-4">
                        <CheckCircle className="w-8 h-8 text-emerald mx-auto mb-2" />
                        <p className="text-foreground font-semibold">Goal Reached!</p>
                        <p className="text-sm text-muted-foreground">This campaign is no longer accepting donations.</p>
                      </div>
                    )}

                    {/* My Contribution */}
                    {parseFloat(myContribution) > 0 && (
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm text-muted-foreground">Your contribution</p>
                        <p className="text-lg font-bold text-primary">{parseFloat(myContribution).toLocaleString()} {tokenSymbol}</p>
                      </div>
                    )}

                    {/* Claim Funds - available when goal is reached (even before deadline) */}
                    {canClaimFunds && (
                      <Button variant="gradient" className="w-full" onClick={handleClaimFunds} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Claim Funds
                      </Button>
                    )}

                    {/* Funds already claimed */}
                    {campaign.claimed && (
                      <div className="text-center py-3">
                        <BadgeCheck className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-foreground font-semibold">Funds Released</p>
                      </div>
                    )}

                    {canClaimRefund && (
                      <Button variant="outline" className="w-full" onClick={handleClaimRefund} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Claim Refund
                      </Button>
                    )}

                    {!canDonate && !canClaimFunds && !canClaimRefund && !goalReached && !campaign.claimed && (
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
