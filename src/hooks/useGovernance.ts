import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { useContracts } from '@/contexts/ContractContext';
import { useWallet } from '@/contexts/WalletContext';

export type ProposalStatus = 'Active' | 'Passed' | 'Rejected' | 'Executed';
const STATUS_MAP: ProposalStatus[] = ['Active', 'Passed', 'Rejected', 'Executed'];

export interface Proposal {
  id: number;
  proposer: string;
  title: string;
  description: string;
  createdAt: Date;
  deadline: Date;
  yesVotes: string;
  noVotes: string;
  executed: boolean;
  status: ProposalStatus;
}

const shortenTxHash = (h: string) => `${h.slice(0, 10)}...${h.slice(-8)}`;
const getTxUrl = (h: string) => `https://testnet.bscscan.com/tx/${h}`;

export const useGovernance = () => {
  const { governanceContract, tokenDecimals } = useContracts();
  const { signer } = useWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const formatProposal = useCallback(async (id: number): Promise<Proposal | null> => {
    if (!governanceContract) return null;
    try {
      const [p, statusRaw] = await Promise.all([
        governanceContract.proposals(id),
        governanceContract.getStatus(id),
      ]);
      return {
        id: p.id.toNumber(),
        proposer: p.proposer,
        title: p.title,
        description: p.description,
        createdAt: new Date(p.createdAt.toNumber() * 1000),
        deadline: new Date(p.deadline.toNumber() * 1000),
        yesVotes: ethers.utils.formatUnits(p.yesVotes, tokenDecimals),
        noVotes: ethers.utils.formatUnits(p.noVotes, tokenDecimals),
        executed: p.executed,
        status: STATUS_MAP[statusRaw] || 'Active',
      };
    } catch { return null; }
  }, [governanceContract, tokenDecimals]);

  const fetchAll = useCallback(async () => {
    if (!governanceContract) { setProposals([]); return; }
    setIsLoading(true);
    try {
      const count = (await governanceContract.proposalCount()).toNumber();
      if (count === 0) { setProposals([]); return; }
      const all = await Promise.all(
        Array.from({ length: count }, (_, i) => formatProposal(i + 1))
      );
      setProposals(all.filter((p): p is Proposal => p !== null).reverse());
    } catch (e) { console.error('Governance fetch error:', e); }
    finally { setIsLoading(false); }
  }, [governanceContract, formatProposal]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const hasVoted = useCallback(async (id: number, voter: string): Promise<boolean> => {
    if (!governanceContract) return false;
    try { return await governanceContract.hasVoted(id, voter); } catch { return false; }
  }, [governanceContract]);

  const createProposal = useCallback(async (title: string, description: string, votingPeriodSecs: number): Promise<boolean> => {
    if (!governanceContract || !signer) { toast.error('Governance contract not configured'); return false; }
    try {
      toast.loading('Submitting proposal…', { id: 'gov-create' });
      const tx = await governanceContract.connect(signer).createProposal(title, description, votingPeriodSecs);
      await tx.wait(1);
      toast.success(`Proposal created! Tx: ${shortenTxHash(tx.hash)}`, { id: 'gov-create', action: { label: 'View', onClick: () => window.open(getTxUrl(tx.hash), '_blank') } });
      await fetchAll();
      return true;
    } catch (e: any) {
      toast.error(e.reason || 'Create failed', { id: 'gov-create' });
      return false;
    }
  }, [governanceContract, signer, fetchAll]);

  const vote = useCallback(async (id: number, support: boolean): Promise<boolean> => {
    if (!governanceContract || !signer) { toast.error('Governance contract not configured'); return false; }
    try {
      toast.loading('Casting vote…', { id: 'gov-vote' });
      const tx = await governanceContract.connect(signer).vote(id, support);
      await tx.wait(1);
      toast.success(`Vote recorded! Tx: ${shortenTxHash(tx.hash)}`, { id: 'gov-vote', action: { label: 'View', onClick: () => window.open(getTxUrl(tx.hash), '_blank') } });
      await fetchAll();
      return true;
    } catch (e: any) {
      toast.error(e.reason || 'Vote failed', { id: 'gov-vote' });
      return false;
    }
  }, [governanceContract, signer, fetchAll]);

  const execute = useCallback(async (id: number): Promise<boolean> => {
    if (!governanceContract || !signer) { toast.error('Governance contract not configured'); return false; }
    try {
      toast.loading('Executing proposal…', { id: 'gov-exec' });
      const tx = await governanceContract.connect(signer).execute(id);
      await tx.wait(1);
      toast.success(`Executed! Tx: ${shortenTxHash(tx.hash)}`, { id: 'gov-exec' });
      await fetchAll();
      return true;
    } catch (e: any) {
      toast.error(e.reason || 'Execute failed', { id: 'gov-exec' });
      return false;
    }
  }, [governanceContract, signer, fetchAll]);

  return { proposals, isLoading, fetchAll, formatProposal, hasVoted, createProposal, vote, execute };
};
