import { useEffect, useState, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useContracts } from '@/contexts/ContractContext';

export interface PlatformMetrics {
  totalCampaigns: number;
  fundedCampaigns: number;
  totalRaised: number;     // in token units
  uniqueDonors: number;
  loading: boolean;
}

const CACHE_KEY = 'chainfunder.metrics.cache.v1';
const CACHE_TTL_MS = 60_000; // 1 min

interface CachedMetrics {
  ts: number;
  data: Omit<PlatformMetrics, 'loading'>;
  contract: string;
}

const readCache = (contractAddr: string): CachedMetrics | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedMetrics;
    if (parsed.contract !== contractAddr) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (contractAddr: string, data: Omit<PlatformMetrics, 'loading'>) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ts: Date.now(), data, contract: contractAddr } as CachedMetrics),
    );
  } catch {}
};

/**
 * Aggregates platform-wide metrics directly from the CrowdFunding contract.
 * - Fallback: reads campaignCount + per-campaign state on mount.
 * - Live: subscribes to CampaignCreated + DonationMade events.
 * - Cache: persists last result in localStorage to avoid heavy RPC on every render.
 */
export const useMetrics = (): PlatformMetrics => {
  const { crowdfundingContract, tokenDecimals, settings } = useContracts();
  const [metrics, setMetrics] = useState<PlatformMetrics>(() => {
    const cached = settings.crowdfundingAddress ? readCache(settings.crowdfundingAddress) : null;
    if (cached) return { ...cached.data, loading: false };
    return { totalCampaigns: 0, fundedCampaigns: 0, totalRaised: 0, uniqueDonors: 0, loading: true };
  });
  const donorsRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!crowdfundingContract) return;
    try {
      const count = (await crowdfundingContract.campaignCount()).toNumber();

      // Fetch all campaigns in parallel
      const campaigns = await Promise.all(
        Array.from({ length: count }, (_, i) =>
          crowdfundingContract.getCampaign(i + 1).catch(() => null),
        ),
      );

      let funded = 0;
      let raised = ethers.BigNumber.from(0);
      for (const c of campaigns) {
        if (!c) continue;
        raised = raised.add(c.raisedAmount);
        if (c.raisedAmount.gte(c.goalAmount)) funded++;
      }

      // Unique donors — query all DonationMade events
      let donors = new Set<string>();
      try {
        const evs = await crowdfundingContract.queryFilter(
          crowdfundingContract.filters.DonationMade(),
        );
        for (const ev of evs) {
          const d = (ev as any).args?.donor;
          if (d) donors.add(d.toLowerCase());
        }
      } catch {
        // RPC may reject very large ranges — fall back to per-campaign donations
        for (let i = 1; i <= count; i++) {
          try {
            const list = await crowdfundingContract.getCampaignDonations(i);
            for (const d of list) donors.add(d.donor.toLowerCase());
          } catch {}
        }
      }
      donorsRef.current = donors;

      const data = {
        totalCampaigns: count,
        fundedCampaigns: funded,
        totalRaised: parseFloat(ethers.utils.formatUnits(raised, tokenDecimals)),
        uniqueDonors: donors.size,
      };
      setMetrics({ ...data, loading: false });
      if (settings.crowdfundingAddress) writeCache(settings.crowdfundingAddress, data);
    } catch (err) {
      console.error('useMetrics: refresh failed', err);
      setMetrics((m) => ({ ...m, loading: false }));
    }
  }, [crowdfundingContract, tokenDecimals, settings.crowdfundingAddress]);

  // Initial + event-driven refresh
  useEffect(() => {
    if (!crowdfundingContract) return;
    refresh();

    const onCreated = () => refresh();
    const onDonation = (_id: any, donor: string, _amt: any, _tot: any) => {
      // Optimistic donor count bump without a full refresh
      if (donor) {
        const addr = donor.toLowerCase();
        if (!donorsRef.current.has(addr)) {
          donorsRef.current.add(addr);
          setMetrics((m) => ({ ...m, uniqueDonors: donorsRef.current.size }));
        }
      }
      refresh();
    };
    const onClaim = () => refresh();

    crowdfundingContract.on('CampaignCreated', onCreated);
    crowdfundingContract.on('DonationMade', onDonation);
    crowdfundingContract.on('FundsClaimed', onClaim);

    return () => {
      try {
        crowdfundingContract.off('CampaignCreated', onCreated);
        crowdfundingContract.off('DonationMade', onDonation);
        crowdfundingContract.off('FundsClaimed', onClaim);
      } catch {}
    };
  }, [crowdfundingContract, refresh]);

  return metrics;
};
