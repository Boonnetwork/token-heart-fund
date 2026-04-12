import { useEffect, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContracts } from '@/contexts/ContractContext';

type EventCallback = (...args: any[]) => void;

/**
 * Hook that listens to real-time contract events and triggers callbacks.
 * Automatically cleans up listeners on unmount or contract change.
 */
export const useContractEvents = (options: {
  onDonationMade?: (campaignId: number, donor: string, amount: string, totalRaised: string) => void;
  onCampaignCreated?: (campaignId: number, creator: string) => void;
  onFundsClaimed?: (campaignId: number) => void;
  onRefundClaimed?: (campaignId: number) => void;
  onCampaignCancelled?: (campaignId: number) => void;
}) => {
  const { crowdfundingContract, tokenDecimals } = useContracts();
  const listenersRef = useRef<Array<{ event: string; handler: EventCallback }>>([]);

  const cleanup = useCallback(() => {
    if (!crowdfundingContract) return;
    for (const { event, handler } of listenersRef.current) {
      try { crowdfundingContract.off(event, handler); } catch {}
    }
    listenersRef.current = [];
  }, [crowdfundingContract]);

  useEffect(() => {
    if (!crowdfundingContract) return;
    cleanup();

    const addListener = (event: string, handler: EventCallback) => {
      crowdfundingContract.on(event, handler);
      listenersRef.current.push({ event, handler });
    };

    if (options.onDonationMade) {
      const cb = options.onDonationMade;
      addListener('DonationMade', (campaignId: any, donor: string, amount: any, totalRaised: any) => {
        cb(
          campaignId.toNumber(),
          donor,
          ethers.utils.formatUnits(amount, tokenDecimals),
          ethers.utils.formatUnits(totalRaised, tokenDecimals),
        );
      });
    }

    if (options.onCampaignCreated) {
      const cb = options.onCampaignCreated;
      addListener('CampaignCreated', (campaignId: any, creator: string) => {
        cb(campaignId.toNumber(), creator);
      });
    }

    if (options.onFundsClaimed) {
      const cb = options.onFundsClaimed;
      addListener('FundsClaimed', (campaignId: any) => {
        cb(campaignId.toNumber());
      });
    }

    if (options.onRefundClaimed) {
      const cb = options.onRefundClaimed;
      addListener('RefundClaimed', (campaignId: any) => {
        cb(campaignId.toNumber());
      });
    }

    if (options.onCampaignCancelled) {
      const cb = options.onCampaignCancelled;
      addListener('CampaignCancelled', (campaignId: any) => {
        cb(campaignId.toNumber());
      });
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crowdfundingContract, tokenDecimals]);
};
