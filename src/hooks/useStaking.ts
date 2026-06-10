import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { useWallet } from '@/contexts/WalletContext';
import { useContracts } from '@/contexts/ContractContext';

export interface StakingState {
  totalStaked: string;
  myStake: string;
  pendingReward: string;
  rewardRatePerSecond: string;
  referrer: string | null;
  referralCount: number;
  referralEarned: string;
  referralClaimed: string;
  referredAddresses: string[];
}

const empty: StakingState = {
  totalStaked: '0',
  myStake: '0',
  pendingReward: '0',
  rewardRatePerSecond: '0',
  referrer: null,
  referralCount: 0,
  referralEarned: '0',
  referralClaimed: '0',
  referredAddresses: [],
};

const shortenTxHash = (h: string) => `${h.slice(0, 10)}...${h.slice(-8)}`;
const getTxUrl = (h: string) => `https://testnet.bscscan.com/tx/${h}`;

export const useStaking = () => {
  const { address, signer } = useWallet();
  const { stakingContract, tokenContract, tokenDecimals, tokenSymbol, settings, refreshTokenBalance } = useContracts();
  const [state, setState] = useState<StakingState>(empty);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!stakingContract) { setState(empty); return; }
    setIsLoading(true);
    try {
      const [total, rate] = await Promise.all([
        stakingContract.totalStaked(),
        stakingContract.rewardRatePerSecond(),
      ]);
      const base: StakingState = {
        ...empty,
        totalStaked: ethers.utils.formatUnits(total, tokenDecimals),
        rewardRatePerSecond: ethers.utils.formatUnits(rate, tokenDecimals),
      };
      if (address) {
        const [stakeInfo, pending, ref, refCount, refEarned, refClaimed, refLen] = await Promise.all([
          stakingContract.stakes(address),
          stakingContract.pendingReward(address),
          stakingContract.referrerOf(address),
          stakingContract.referralCountOf(address),
          stakingContract.referralEarned(address),
          stakingContract.referralClaimed(address),
          stakingContract.referredUsersLength(address),
        ]);
        const refList: string[] = [];
        const len = refLen.toNumber();
        for (let i = 0; i < len && i < 100; i++) {
          try { refList.push(await stakingContract.referredUsersOf(address, i)); } catch {}
        }
        base.myStake = ethers.utils.formatUnits(stakeInfo.amount, tokenDecimals);
        base.pendingReward = ethers.utils.formatUnits(pending, tokenDecimals);
        base.referrer = ref === ethers.constants.AddressZero ? null : ref;
        base.referralCount = refCount.toNumber();
        base.referralEarned = ethers.utils.formatUnits(refEarned, tokenDecimals);
        base.referralClaimed = ethers.utils.formatUnits(refClaimed, tokenDecimals);
        base.referredAddresses = refList;
      }
      setState(base);
    } catch (e) {
      console.error('Staking fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [stakingContract, address, tokenDecimals]);

  useEffect(() => { fetch(); }, [fetch]);

  const ensureAllowance = useCallback(async (amount: string): Promise<boolean> => {
    if (!tokenContract || !signer || !address || !settings.stakingAddress) return false;
    try {
      const need = ethers.utils.parseUnits(amount, tokenDecimals);
      const current = await tokenContract.allowance(address, settings.stakingAddress);
      if (current.gte(need)) return true;
      toast.loading('Approving tokens…', { id: 'stake-approve' });
      const tx = await tokenContract.connect(signer).approve(settings.stakingAddress, ethers.constants.MaxUint256);
      await tx.wait(1);
      toast.success('Approval confirmed', { id: 'stake-approve' });
      return true;
    } catch (e: any) {
      toast.error(e.reason || 'Approval failed', { id: 'stake-approve' });
      return false;
    }
  }, [tokenContract, signer, address, settings.stakingAddress, tokenDecimals]);

  const stake = useCallback(async (amount: string, referrer: string | null): Promise<boolean> => {
    if (!stakingContract || !signer) { toast.error('Staking contract not configured'); return false; }
    if (parseFloat(amount) <= 0) { toast.error('Enter a valid amount'); return false; }
    try {
      if (!(await ensureAllowance(amount))) return false;
      const ref = referrer && ethers.utils.isAddress(referrer)
        ? referrer
        : ethers.constants.AddressZero;
      toast.loading('Staking…', { id: 'stake' });
      const tx = await stakingContract.connect(signer).stake(ethers.utils.parseUnits(amount, tokenDecimals), ref);
      await tx.wait(1);
      toast.success(`Staked! Tx: ${shortenTxHash(tx.hash)}`, { id: 'stake', action: { label: 'View', onClick: () => window.open(getTxUrl(tx.hash), '_blank') } });
      await Promise.all([fetch(), refreshTokenBalance()]);
      return true;
    } catch (e: any) {
      toast.error(e.reason || 'Stake failed', { id: 'stake' });
      return false;
    }
  }, [stakingContract, signer, tokenDecimals, ensureAllowance, fetch, refreshTokenBalance]);

  const unstake = useCallback(async (amount: string): Promise<boolean> => {
    if (!stakingContract || !signer) { toast.error('Staking contract not configured'); return false; }
    try {
      toast.loading('Unstaking…', { id: 'unstake' });
      const tx = await stakingContract.connect(signer).unstake(ethers.utils.parseUnits(amount, tokenDecimals));
      await tx.wait(1);
      toast.success(`Unstaked! Tx: ${shortenTxHash(tx.hash)}`, { id: 'unstake', action: { label: 'View', onClick: () => window.open(getTxUrl(tx.hash), '_blank') } });
      await Promise.all([fetch(), refreshTokenBalance()]);
      return true;
    } catch (e: any) {
      toast.error(e.reason || 'Unstake failed', { id: 'unstake' });
      return false;
    }
  }, [stakingContract, signer, tokenDecimals, fetch, refreshTokenBalance]);

  const claim = useCallback(async (): Promise<boolean> => {
    if (!stakingContract || !signer) { toast.error('Staking contract not configured'); return false; }
    try {
      toast.loading('Claiming rewards…', { id: 'claim-stake' });
      const tx = await stakingContract.connect(signer).claimRewards();
      await tx.wait(1);
      toast.success(`Rewards claimed! Tx: ${shortenTxHash(tx.hash)}`, { id: 'claim-stake', action: { label: 'View', onClick: () => window.open(getTxUrl(tx.hash), '_blank') } });
      await Promise.all([fetch(), refreshTokenBalance()]);
      return true;
    } catch (e: any) {
      toast.error(e.reason || 'Claim failed', { id: 'claim-stake' });
      return false;
    }
  }, [stakingContract, signer, fetch, refreshTokenBalance]);

  return { state, isLoading, tokenSymbol, fetch, stake, unstake, claim };
};
