import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';

const KEY = 'cfd_ref';

const isValidRef = (addr: string | null): addr is string =>
  !!addr && ethers.utils.isAddress(addr);

/**
 * Single-level referral helper.
 * - Reads `?ref=` from URL on first load and stores it (per browser).
 * - Exposes the pending referrer to use on the first stake().
 * - Exposes a sharable link the connected user can copy.
 */
export const useReferral = () => {
  const { address } = useWallet();
  const [pendingReferrer, setPendingReferrer] = useState<string | null>(null);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const fromUrl = url.searchParams.get('ref');
      if (isValidRef(fromUrl)) {
        // Reject self-ref attempts
        if (!address || fromUrl.toLowerCase() !== address.toLowerCase()) {
          localStorage.setItem(KEY, fromUrl);
        }
      }
      const stored = localStorage.getItem(KEY);
      if (isValidRef(stored)) {
        if (!address || stored.toLowerCase() !== address.toLowerCase()) {
          setPendingReferrer(stored);
        } else {
          setPendingReferrer(null);
        }
      }
    } catch {
      /* ignore */
    }
  }, [address]);

  const clearReferrer = useCallback(() => {
    localStorage.removeItem(KEY);
    setPendingReferrer(null);
  }, []);

  const referralLink = address
    ? `${window.location.origin}/?ref=${address}`
    : '';

  return { pendingReferrer, clearReferrer, referralLink };
};
