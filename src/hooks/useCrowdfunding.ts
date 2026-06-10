import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { useContracts } from '@/contexts/ContractContext';
import { toast } from 'sonner';
import { extractCategory, encodeCategoryIntoDescription } from '@/lib/categories';

export interface CampaignData {
  id: number;
  creator: string;
  title: string;
  description: string;
  imageUrl: string;
  goalAmount: string;
  raisedAmount: string;
  deadline: Date;
  createdAt: Date;
  claimed: boolean;
  cancelled: boolean;
  donorCount: number;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  category?: string; // slug
}

export interface DonationData {
  donor: string;
  amount: string;
  timestamp: Date;
  txHash?: string;
}

export interface ClaimEventData {
  txHash: string;
  amount: string;
  platformFee: string;
}

const shortenTxHash = (hash: string) => `${hash.slice(0, 10)}...${hash.slice(-8)}`;
const getTxUrl = (hash: string) => `https://testnet.bscscan.com/tx/${hash}`;

export const useCrowdfunding = () => {
  const { address, signer } = useWallet();
  const { crowdfundingContract, tokenContract, tokenDecimals, tokenSymbol, approveTokens, getAllowance, refreshTokenBalance } = useContracts();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [campaignCount, setCampaignCount] = useState(0);

  const formatCampaign = useCallback((raw: any, decimals: number): CampaignData => {
    const now = Date.now();
    const deadline = new Date(raw.deadline.toNumber() * 1000);
    const createdAt = new Date(raw.createdAt.toNumber() * 1000);
    const goalAmount = ethers.utils.formatUnits(raw.goalAmount, decimals);
    const raisedAmount = ethers.utils.formatUnits(raw.raisedAmount, decimals);

    // New contract returns `category` on the struct; fall back to description tag
    // for backward compatibility with the currently deployed contract.
    let category: string | undefined =
      (raw.category && typeof raw.category === 'string' && raw.category) || undefined;
    let description: string = raw.description;
    if (!category) {
      const parsed = extractCategory(description);
      if (parsed.category) category = parsed.category.slug;
      description = parsed.description;
    }

    let status: CampaignData['status'] = 'active';
    if (raw.cancelled) status = 'cancelled';
    else if (raw.claimed) status = 'completed';
    else if (parseFloat(raisedAmount) >= parseFloat(goalAmount)) status = 'completed';
    else if (deadline.getTime() < now) status = parseFloat(raisedAmount) >= parseFloat(goalAmount) ? 'completed' : 'failed';

    return {
      id: raw.id.toNumber(), creator: raw.creator, title: raw.title, description,
      imageUrl: raw.imageUrl || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
      goalAmount, raisedAmount, deadline, createdAt, claimed: raw.claimed, cancelled: raw.cancelled,
      donorCount: raw.donorCount.toNumber(), status, category,
    };
  }, []);

  const fetchCampaigns = useCallback(async () => {
    if (!crowdfundingContract) return;
    setIsLoading(true);
    try {
      const count = await crowdfundingContract.campaignCount();
      const totalCount = count.toNumber();
      setCampaignCount(totalCount);
      if (totalCount === 0) { setCampaigns([]); return; }

      const promises = [];
      for (let id = 1; id <= totalCount; id++) {
        promises.push(crowdfundingContract.getCampaign(id).then((r: any) => formatCampaign(r, tokenDecimals)).catch(() => null));
      }
      const results = await Promise.all(promises);
      setCampaigns(results.filter((c): c is CampaignData => c !== null));
    } catch (error) { console.error('Error fetching campaigns:', error); }
    finally { setIsLoading(false); }
  }, [crowdfundingContract, tokenDecimals, formatCampaign]);

  const getCampaign = useCallback(async (id: number): Promise<CampaignData | null> => {
    if (!crowdfundingContract) return null;
    try { return formatCampaign(await crowdfundingContract.getCampaign(id), tokenDecimals); }
    catch { return null; }
  }, [crowdfundingContract, tokenDecimals, formatCampaign]);

  const getCampaignDonations = useCallback(async (id: number): Promise<DonationData[]> => {
    if (!crowdfundingContract) return [];
    try {
      const [donations, events] = await Promise.all([
        crowdfundingContract.getCampaignDonations(id),
        crowdfundingContract.queryFilter(crowdfundingContract.filters.DonationMade(id)).catch(() => []),
      ]);
      
      // Build a map of events by matching donor+amount+order for reliable tx hash lookup
      const eventList = events.map((ev: any) => ({
        donor: ev.args?.donor?.toLowerCase(),
        amount: ev.args?.amount?.toString(),
        txHash: ev.transactionHash,
      }));
      
      // Track usage of events to handle multiple donations from same donor
      const usedEvents = new Set<number>();
      
      return donations.map((d: any) => {
        const donorLower = d.donor.toLowerCase();
        const amountStr = d.amount.toString();
        
        // Find matching event that hasn't been used yet
        let txHash: string | undefined;
        for (let i = 0; i < eventList.length; i++) {
          if (!usedEvents.has(i) && eventList[i].donor === donorLower && eventList[i].amount === amountStr) {
            txHash = eventList[i].txHash;
            usedEvents.add(i);
            break;
          }
        }
        
        // Fallback: match by donor only if exact match not found
        if (!txHash) {
          for (let i = 0; i < eventList.length; i++) {
            if (!usedEvents.has(i) && eventList[i].donor === donorLower) {
              txHash = eventList[i].txHash;
              usedEvents.add(i);
              break;
            }
          }
        }
        
        return {
          donor: d.donor,
          amount: ethers.utils.formatUnits(d.amount, tokenDecimals),
          timestamp: new Date(d.timestamp.toNumber() * 1000),
          txHash,
        };
      });
    } catch { return []; }
  }, [crowdfundingContract, tokenDecimals]);

  const getClaimEvent = useCallback(async (campaignId: number): Promise<ClaimEventData | null> => {
    if (!crowdfundingContract) return null;
    try {
      const events = await crowdfundingContract.queryFilter(crowdfundingContract.filters.FundsClaimed(campaignId));
      if (events.length > 0) {
        const ev = events[0];
        return {
          txHash: ev.transactionHash,
          amount: ethers.utils.formatUnits(ev.args?.amount || 0, tokenDecimals),
          platformFee: ethers.utils.formatUnits(ev.args?.platformFee || 0, tokenDecimals),
        };
      }
      return null;
    } catch { return null; }
  }, [crowdfundingContract, tokenDecimals]);

  const getDonorContribution = useCallback(async (campaignId: number, donor: string): Promise<string> => {
    if (!crowdfundingContract) return '0';
    try { return ethers.utils.formatUnits(await crowdfundingContract.getDonorContribution(campaignId, donor), tokenDecimals); }
    catch { return '0'; }
  }, [crowdfundingContract, tokenDecimals]);

  const createCampaign = useCallback(async (title: string, description: string, imageUrl: string, goalAmount: string, durationDays: number, category?: string): Promise<number | false> => {
    if (!crowdfundingContract || !signer) { toast.error('Contract not initialized'); return false; }
    try {
      const writableCrowdfunding = crowdfundingContract.connect(signer);
      // Encode category into the description for backward compatibility with
      // the deployed CrowdFunding contract that has no `category` field.
      const encodedDescription = category
        ? encodeCategoryIntoDescription(description, category)
        : description;

      toast.loading('Sending transaction...', { id: 'create-campaign' });
      let tx;
      // If a newer contract exposes a 6-arg overload, use it; otherwise fall back.
      try {
        if (category && writableCrowdfunding['createCampaign(string,string,string,uint256,uint256,string)']) {
          tx = await writableCrowdfunding['createCampaign(string,string,string,uint256,uint256,string)'](
            title, description, imageUrl, ethers.utils.parseUnits(goalAmount, tokenDecimals), durationDays, category
          );
        } else {
          tx = await writableCrowdfunding.createCampaign(title, encodedDescription, imageUrl, ethers.utils.parseUnits(goalAmount, tokenDecimals), durationDays);
        }
      } catch {
        tx = await writableCrowdfunding.createCampaign(title, encodedDescription, imageUrl, ethers.utils.parseUnits(goalAmount, tokenDecimals), durationDays);
      }
      toast.loading('Waiting for confirmation...', { id: 'create-campaign' });
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 30000));
      const receipt = await Promise.race([tx.wait(1), timeoutPromise]);
      let newId: number | null = null;
      if (receipt && (receipt as any).events) {
        const ev = (receipt as any).events.find((e: any) => e.event === 'CampaignCreated');
        if (ev?.args) newId = ev.args.id?.toNumber() || ev.args[0]?.toNumber();
      }
      if (!newId) {
        try { newId = (await crowdfundingContract.campaignCount()).toNumber(); } catch {}
      }
      toast.success(`Campaign created! View tx: ${shortenTxHash(tx.hash)}`, { id: 'create-campaign', action: { label: 'View', onClick: () => window.open(getTxUrl(tx.hash), '_blank') } });
      fetchCampaigns().catch(() => {});
      return newId || 1;
    } catch (error: any) { toast.error(error.reason || 'Failed to create campaign', { id: 'create-campaign' }); return false; }
  }, [crowdfundingContract, signer, tokenDecimals, fetchCampaigns]);

  const donate = useCallback(async (campaignId: number, amount: string): Promise<boolean> => {
    if (!crowdfundingContract || !tokenContract || !signer) { toast.error('Contracts not initialized'); return false; }
    try {
      const writableCrowdfunding = crowdfundingContract.connect(signer);
      // Check campaign status and remaining amount
      const campaign = await getCampaign(campaignId);
      if (!campaign) { toast.error('Campaign not found'); return false; }
      
      const remaining = parseFloat(campaign.goalAmount) - parseFloat(campaign.raisedAmount);
      if (remaining <= 0) { toast.error('Campaign goal has already been reached'); return false; }
      
      const donateAmt = Math.min(parseFloat(amount), remaining);
      if (donateAmt < parseFloat(amount)) {
        toast.info(`Amount capped to ${donateAmt.toLocaleString()} ${tokenSymbol} (remaining to goal)`);
      }

      const amountWei = ethers.utils.parseUnits(donateAmt.toString(), tokenDecimals);
      if (parseFloat(await getAllowance()) < donateAmt) {
        toast.loading('Approving tokens...', { id: 'donate' });
        if (!await approveTokens(donateAmt.toString())) { toast.error('Token approval failed', { id: 'donate' }); return false; }
      }
      toast.loading('Processing donation...', { id: 'donate' });
      const tx = await writableCrowdfunding.donate(campaignId, amountWei);
      await tx.wait(1);
      toast.success(`Donation successful! Tx: ${shortenTxHash(tx.hash)}`, { id: 'donate', action: { label: 'View', onClick: () => window.open(getTxUrl(tx.hash), '_blank') } });
      // Refresh data in background - don't block the UI
      refreshTokenBalance().catch(() => {});
      fetchCampaigns().catch(() => {});
      return true;
    } catch (error: any) { toast.error(error.reason || 'Failed to donate', { id: 'donate' }); return false; }
  }, [crowdfundingContract, tokenContract, signer, tokenDecimals, tokenSymbol, approveTokens, getAllowance, fetchCampaigns, refreshTokenBalance, getCampaign]);

  const claimFunds = useCallback(async (campaignId: number): Promise<boolean> => {
    if (!crowdfundingContract || !signer) { toast.error('Contract not initialized'); return false; }
    try {
      toast.loading('Claiming funds...', { id: 'claim' });
      const tx = await crowdfundingContract.connect(signer).claimFunds(campaignId);
      await tx.wait();
      toast.success(`Funds claimed! Tx: ${shortenTxHash(tx.hash)}`, { id: 'claim', action: { label: 'View', onClick: () => window.open(getTxUrl(tx.hash), '_blank') } });
      await refreshTokenBalance(); await fetchCampaigns();
      return true;
    } catch (error: any) { toast.error(error.reason || 'Failed to claim funds', { id: 'claim' }); return false; }
  }, [crowdfundingContract, signer, fetchCampaigns, refreshTokenBalance]);

  const claimRefund = useCallback(async (campaignId: number): Promise<boolean> => {
    if (!crowdfundingContract) { toast.error('Contract not initialized'); return false; }
    try {
      toast.loading('Claiming refund...', { id: 'refund' });
      const tx = await crowdfundingContract.claimRefund(campaignId);
      await tx.wait();
      toast.success(`Refund claimed! Tx: ${shortenTxHash(tx.hash)}`, { id: 'refund', action: { label: 'View', onClick: () => window.open(getTxUrl(tx.hash), '_blank') } });
      await refreshTokenBalance(); await fetchCampaigns();
      return true;
    } catch (error: any) { toast.error(error.reason || 'Failed to claim refund', { id: 'refund' }); return false; }
  }, [crowdfundingContract, fetchCampaigns, refreshTokenBalance]);

  const cancelCampaign = useCallback(async (campaignId: number): Promise<boolean> => {
    if (!crowdfundingContract) { toast.error('Contract not initialized'); return false; }
    try {
      toast.loading('Cancelling campaign...', { id: 'cancel' });
      const tx = await crowdfundingContract.cancelCampaign(campaignId);
      await tx.wait();
      toast.success(`Campaign cancelled! Tx: ${shortenTxHash(tx.hash)}`, { id: 'cancel', action: { label: 'View', onClick: () => window.open(getTxUrl(tx.hash), '_blank') } });
      await fetchCampaigns();
      return true;
    } catch (error: any) { toast.error(error.reason || 'Failed to cancel campaign', { id: 'cancel' }); return false; }
  }, [crowdfundingContract, fetchCampaigns]);

  const getMyCampaigns = useCallback(async (): Promise<number[]> => {
    if (!crowdfundingContract || !address) return [];
    try { return (await crowdfundingContract.getCampaignsByCreator(address)).map((id: any) => id.toNumber()); } catch { return []; }
  }, [crowdfundingContract, address]);

  const getMyDonations = useCallback(async (): Promise<number[]> => {
    if (!crowdfundingContract || !address) return [];
    try { return (await crowdfundingContract.getCampaignsByDonor(address)).map((id: any) => id.toNumber()); } catch { return []; }
  }, [crowdfundingContract, address]);

  useEffect(() => { if (crowdfundingContract) fetchCampaigns(); }, [crowdfundingContract, fetchCampaigns]);

  return { campaigns, campaignCount, isLoading, fetchCampaigns, getCampaign, getCampaignDonations, getClaimEvent, getDonorContribution, createCampaign, donate, claimFunds, claimRefund, cancelCampaign, getMyCampaigns, getMyDonations, tokenSymbol };
};
