import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { BackToTop } from '@/components/BackToTop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGovernance, Proposal, ProposalStatus } from '@/hooks/useGovernance';
import { useWallet } from '@/contexts/WalletContext';
import { useContracts } from '@/contexts/ContractContext';
import {
  ArrowLeft, ThumbsUp, ThumbsDown, CheckCircle, XCircle, Clock, Loader2, AlertTriangle, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig: Record<ProposalStatus, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  Active: { label: 'Active', cls: 'bg-emerald/20 text-emerald border-emerald/30', icon: Clock },
  Passed: { label: 'Passed', cls: 'bg-primary/20 text-primary border-primary/30', icon: CheckCircle },
  Rejected: { label: 'Rejected', cls: 'bg-destructive/20 text-destructive border-destructive/30', icon: XCircle },
  Executed: { label: 'Executed', cls: 'bg-muted text-muted-foreground border-border', icon: CheckCircle },
};

const ProposalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected } = useWallet();
  const { governanceContract } = useContracts();
  const { formatProposal, hasVoted, vote, execute } = useGovernance();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'yes' | 'no' | 'exec' | null>(null);

  const load = async () => {
    if (!id) return;
    const p = await formatProposal(parseInt(id));
    setProposal(p);
    if (p && address) setVoted(await hasVoted(p.id, address));
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    if (governanceContract) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, address, governanceContract]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-10 w-40 mb-6" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </Layout>
    );
  }

  if (!proposal) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Proposal Not Found</h1>
          <Button variant="outline" asChild><Link to="/governance"><ArrowLeft className="w-4 h-4 mr-2" />Back</Link></Button>
        </div>
      </Layout>
    );
  }

  const cfg = statusConfig[proposal.status];
  const Icon = cfg.icon;
  const yes = parseFloat(proposal.yesVotes), no = parseFloat(proposal.noVotes);
  const total = yes + no;
  const yesPct = total > 0 ? (yes / total) * 100 : 0;
  const canVote = isConnected && proposal.status === 'Active' && !voted;
  const canExecute = isConnected && proposal.status === 'Passed';

  const handleVote = async (support: boolean) => {
    setBusy(support ? 'yes' : 'no');
    const ok = await vote(proposal.id, support);
    if (ok) await load();
    setBusy(null);
  };

  const handleExecute = async () => {
    setBusy('exec');
    const ok = await execute(proposal.id);
    if (ok) await load();
    setBusy(null);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/governance"><ArrowLeft className="w-4 h-4 mr-2" />Back to Proposals</Link>
        </Button>

        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold break-words">{proposal.title}</h1>
          <Badge variant="outline" className={cn('text-sm shrink-0', cfg.cls)}>
            <Icon className="w-4 h-4 mr-1" />{cfg.label}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Proposed by <a href={`https://testnet.bscscan.com/address/${proposal.proposer}`} target="_blank" rel="noopener noreferrer" className="font-mono text-primary hover:underline inline-flex items-center gap-1">
            {proposal.proposer.slice(0, 6)}…{proposal.proposer.slice(-4)}<ExternalLink className="w-3 h-3" />
          </a> · Deadline {proposal.deadline.toLocaleString()}
        </p>

        <Card className="glass-card mb-6">
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{proposal.description}</p>
          </CardContent>
        </Card>

        <Card className="glass-card mb-6">
          <CardHeader><CardTitle>Vote Tally</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-emerald font-semibold">Yes {yes.toLocaleString()}</span>
                <span className="text-destructive font-semibold">No {no.toLocaleString()}</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald to-primary" style={{ width: `${yesPct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground text-center">{yesPct.toFixed(1)}% in favor · Total {total.toLocaleString()} voting power</p>
            </div>

            {canVote && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="gradient" onClick={() => handleVote(true)} disabled={busy !== null}>
                  {busy === 'yes' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ThumbsUp className="w-4 h-4 mr-2" />}Vote Yes
                </Button>
                <Button variant="outline" onClick={() => handleVote(false)} disabled={busy !== null}>
                  {busy === 'no' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ThumbsDown className="w-4 h-4 mr-2" />}Vote No
                </Button>
              </div>
            )}
            {voted && <p className="text-xs text-muted-foreground text-center">You've already voted on this proposal.</p>}
            {canExecute && (
              <Button variant="gradient" className="w-full" onClick={handleExecute} disabled={busy !== null}>
                {busy === 'exec' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Executing…</> : 'Execute Proposal'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      <BackToTop />
    </Layout>
  );
};

export default ProposalDetail;
