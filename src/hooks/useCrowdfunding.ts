import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { useContracts } from '@/contexts/ContractContext';
import { toast } from 'sonner';

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
}

export interface DonationData {
  donor: string;
  amount: string;
  timestamp: Date;
}

export const useCrowdfunding = () => {
  const { address, isConnected } = useWallet();
  const { crowdfundingContract, tokenContract, tokenDecimals, tokenSymbol, approveTokens, getAllowance } = useContracts();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [campaignCount, setCampaignCount] = useState(0);

  const formatCampaign = useCallback((raw: any, decimals: number, id: number): CampaignData => {
    const now = Date.now();
    const deadline = new Date(raw.deadline.toNumber() * 1000);
    const goalAmount = ethers.utils.formatUnits(raw.goal, decimals);
    const raisedAmount = ethers.utils.formatUnits(raw.raised, decimals);
    
    // Parse metadata JSON string
    let title = 'Untitled Campaign';
    let description = '';
    let imageUrl = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800';
    
    try {
      const metadata = JSON.parse(raw.metadata);
      title = metadata.title || title;
      description = metadata.description || description;
      imageUrl = metadata.imageUrl || imageUrl;
    } catch {
      // If metadata is not valid JSON, use it as title
      title = raw.metadata || title;
    }
    
    let status: CampaignData['status'] = 'active';
    if (raw.claimed) {
      status = 'completed';
    } else if (deadline.getTime() < now) {
      status = parseFloat(raisedAmount) >= parseFloat(goalAmount) ? 'completed' : 'failed';
    }

    return {
      id,
      creator: raw.creator,
      title,
      description,
      imageUrl,
      goalAmount,
      raisedAmount,
      deadline,
      createdAt: deadline, // Contract doesn't store createdAt, use deadline as fallback
      claimed: raw.claimed,
      cancelled: false, // Contract doesn't have cancelled field
      donorCount: 0, // Contract doesn't track donor count
      status,
    };
  }, []);

  const fetchCampaigns = useCallback(async () => {
    if (!crowdfundingContract) return;
    
    setIsLoading(true);
    try {
      // Fetch campaigns starting from id 0, incrementing until we get an error
      const fetchedCampaigns: CampaignData[] = [];
      let id = 0;
      
      while (true) {
        try {
          const raw = await crowdfundingContract.getCampaign(id);
          // Check if campaign has valid data (creator is not zero address)
          if (raw.creator === ethers.constants.AddressZero) break;
          fetchedCampaigns.push(formatCampaign(raw, tokenDecimals, id));
          id++;
        } catch {
          break;
        }
      }
      
      setCampaignCount(fetchedCampaigns.length);
      setCampaigns(fetchedCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  }, [crowdfundingContract, tokenDecimals, formatCampaign]);

  const getCampaign = useCallback(async (id: number): Promise<CampaignData | null> => {
    if (!crowdfundingContract) return null;
    
    try {
      const raw = await crowdfundingContract.getCampaign(id);
      return formatCampaign(raw, tokenDecimals, id);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      return null;
    }
  }, [crowdfundingContract, tokenDecimals, formatCampaign]);

  const getCampaignDonations = useCallback(async (id: number): Promise<DonationData[]> => {
    if (!crowdfundingContract) return [];
    
    try {
      const donations = await crowdfundingContract.getCampaignDonations(id);
      return donations.map((d: any) => ({
        donor: d.donor,
        amount: ethers.utils.formatUnits(d.amount, tokenDecimals),
        timestamp: new Date(d.timestamp.toNumber() * 1000),
      }));
    } catch (error) {
      console.error('Error fetching donations:', error);
      return [];
    }
  }, [crowdfundingContract, tokenDecimals]);

  const getDonorContribution = useCallback(async (campaignId: number, donor: string): Promise<string> => {
    if (!crowdfundingContract) return '0';
    
    try {
      const contribution = await crowdfundingContract.getDonorContribution(campaignId, donor);
      return ethers.utils.formatUnits(contribution, tokenDecimals);
    } catch (error) {
      console.error('Error fetching contribution:', error);
      return '0';
    }
  }, [crowdfundingContract, tokenDecimals]);

  const createCampaign = useCallback(async (
    title: string,
    description: string,
    imageUrl: string,
    goalAmount: string,
    durationDays: number
  ): Promise<boolean> => {
    if (!crowdfundingContract) {
      toast.error('Contract not initialized');
      return false;
    }

    try {
      const goalWei = ethers.utils.parseUnits(goalAmount, tokenDecimals);
      // Contract expects: _goal, _duration (in seconds), _metadata (JSON string)
      const durationSeconds = durationDays * 24 * 60 * 60;
      const metadata = JSON.stringify({ title, description, imageUrl });
      
      toast.loading('Creating campaign...', { id: 'create-campaign' });
      const tx = await crowdfundingContract.createCampaign(
        goalWei,
        durationSeconds,
        metadata
      );
      
      await tx.wait();
      toast.success('Campaign created successfully!', { id: 'create-campaign' });
      
      await fetchCampaigns();
      return true;
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(error.reason || 'Failed to create campaign', { id: 'create-campaign' });
      return false;
    }
  }, [crowdfundingContract, tokenDecimals, fetchCampaigns]);

  const donate = useCallback(async (campaignId: number, amount: string): Promise<boolean> => {
    if (!crowdfundingContract || !tokenContract) {
      toast.error('Contracts not initialized');
      return false;
    }

    try {
      const amountWei = ethers.utils.parseUnits(amount, tokenDecimals);
      
      // Check allowance
      const currentAllowance = await getAllowance();
      if (parseFloat(currentAllowance) < parseFloat(amount)) {
        toast.loading('Approving tokens...', { id: 'donate' });
        const approved = await approveTokens(amount);
        if (!approved) {
          toast.error('Token approval failed', { id: 'donate' });
          return false;
        }
      }

      toast.loading('Processing donation...', { id: 'donate' });
      const tx = await crowdfundingContract.donate(campaignId, amountWei);
      await tx.wait();
      
      toast.success('Donation successful!', { id: 'donate' });
      await fetchCampaigns();
      return true;
    } catch (error: any) {
      console.error('Error donating:', error);
      toast.error(error.reason || 'Failed to donate', { id: 'donate' });
      return false;
    }
  }, [crowdfundingContract, tokenContract, tokenDecimals, approveTokens, getAllowance, fetchCampaigns]);

  const claimFunds = useCallback(async (campaignId: number): Promise<boolean> => {
    if (!crowdfundingContract) {
      toast.error('Contract not initialized');
      return false;
    }

    try {
      toast.loading('Claiming funds...', { id: 'claim' });
      const tx = await crowdfundingContract.claimFunds(campaignId);
      await tx.wait();
      
      toast.success('Funds claimed successfully!', { id: 'claim' });
      await fetchCampaigns();
      return true;
    } catch (error: any) {
      console.error('Error claiming funds:', error);
      toast.error(error.reason || 'Failed to claim funds', { id: 'claim' });
      return false;
    }
  }, [crowdfundingContract, fetchCampaigns]);

  const claimRefund = useCallback(async (campaignId: number): Promise<boolean> => {
    if (!crowdfundingContract) {
      toast.error('Contract not initialized');
      return false;
    }

    try {
      toast.loading('Claiming refund...', { id: 'refund' });
      const tx = await crowdfundingContract.refund(campaignId);
      await tx.wait();
      
      toast.success('Refund claimed successfully!', { id: 'refund' });
      await fetchCampaigns();
      return true;
    } catch (error: any) {
      console.error('Error claiming refund:', error);
      toast.error(error.reason || 'Failed to claim refund', { id: 'refund' });
      return false;
    }
  }, [crowdfundingContract, fetchCampaigns]);

  const cancelCampaign = useCallback(async (campaignId: number): Promise<boolean> => {
    if (!crowdfundingContract) {
      toast.error('Contract not initialized');
      return false;
    }

    try {
      toast.loading('Cancelling campaign...', { id: 'cancel' });
      const tx = await crowdfundingContract.cancelCampaign(campaignId);
      await tx.wait();
      
      toast.success('Campaign cancelled!', { id: 'cancel' });
      await fetchCampaigns();
      return true;
    } catch (error: any) {
      console.error('Error cancelling campaign:', error);
      toast.error(error.reason || 'Failed to cancel campaign', { id: 'cancel' });
      return false;
    }
  }, [crowdfundingContract, fetchCampaigns]);

  const getMyCampaigns = useCallback(async (): Promise<number[]> => {
    if (!crowdfundingContract || !address) return [];
    
    try {
      const ids = await crowdfundingContract.getCampaignsByCreator(address);
      return ids.map((id: any) => id.toNumber());
    } catch (error) {
      console.error('Error fetching my campaigns:', error);
      return [];
    }
  }, [crowdfundingContract, address]);

  const getMyDonations = useCallback(async (): Promise<number[]> => {
    if (!crowdfundingContract || !address) return [];
    
    try {
      const ids = await crowdfundingContract.getCampaignsByDonor(address);
      return ids.map((id: any) => id.toNumber());
    } catch (error) {
      console.error('Error fetching my donations:', error);
      return [];
    }
  }, [crowdfundingContract, address]);

  useEffect(() => {
    if (crowdfundingContract) {
      fetchCampaigns();
    }
  }, [crowdfundingContract, fetchCampaigns]);

  return {
    campaigns,
    campaignCount,
    isLoading,
    fetchCampaigns,
    getCampaign,
    getCampaignDonations,
    getDonorContribution,
    createCampaign,
    donate,
    claimFunds,
    claimRefund,
    cancelCampaign,
    getMyCampaigns,
    getMyDonations,
    tokenSymbol,
  };
};
