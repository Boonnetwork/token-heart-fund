import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { BackToTop } from '@/components/BackToTop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGovernance, ProposalStatus } from '@/hooks/useGovernance';
import { useContracts } from '@/contexts/ContractContext';
import { useWallet } from '@/contexts/WalletContext';
import { Vote, PlusCircle, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const statusConfig: Record<ProposalStatus, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  Active: { label: 'Active', cls: 'bg-emerald/20 text-emerald border-emerald/30', icon: Clock },
  Passed: { label: 'Passed', cls: 'bg-primary/20 text-primary border-primary/30', icon: CheckCircle },
  Rejected: { label: 'Rejected', cls: 'bg-destructive/20 text-destructive border-destructive/30', icon: XCircle },
  Executed: { label: 'Executed', cls: 'bg-muted text-muted-foreground border-border', icon: CheckCircle },
};

const Governance = () => {
  const { isConnected } = useWallet();
  const { governanceContract } = useContracts();
  const { proposals, isLoading, createProposal } = useGovernance();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [period, setPeriod] = useState('259200'); // 3 days
  const [submitting, setSubmitting] = useState(false);

  if (!governanceContract) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center max-w-lg">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold mb-3">Governance Not Configured</h1>
          <p className="text-muted-foreground mb-6">
            The admin needs to deploy <code className="px-1 bg-muted rounded">CFDGovernance.sol</code> and set its address in Settings.
          </p>
          <Button variant="gradient" asChild><Link to="/settings">Go to Settings</Link></Button>
        </div>
      </Layout>
    );
  }

  const handleCreate = async () => {
    setSubmitting(true);
    const ok = await createProposal(title.trim(), desc.trim(), parseInt(period));
    if (ok) { setTitle(''); setDesc(''); setOpen(false); }
    setSubmitting(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-10">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
              Governance
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              On-chain proposals & voting powered by your staked balance.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" disabled={!isConnected}>
                <PlusCircle className="w-4 h-4 mr-2" />New Proposal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Proposal</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="Proposal title" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={6} maxLength={10000} placeholder="Detailed rationale, scope and expected outcome" />
                </div>
                <div className="space-y-2">
                  <Label>Voting Period</Label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="86400">1 day</SelectItem>
                      <SelectItem value="259200">3 days</SelectItem>
                      <SelectItem value="604800">7 days</SelectItem>
                      <SelectItem value="1209600">14 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="gradient" onClick={handleCreate} disabled={submitting || !title.trim() || !desc.trim()}>
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</> : 'Submit Proposal'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : proposals.length === 0 ? (
          <Card className="glass-card"><CardContent className="py-16 text-center">
            <Vote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No proposals yet. Be the first to submit one.</p>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proposals.map((p) => {
              const yes = parseFloat(p.yesVotes), no = parseFloat(p.noVotes);
              const total = yes + no;
              const yesPct = total > 0 ? (yes / total) * 100 : 0;
              const cfg = statusConfig[p.status];
              const Icon = cfg.icon;
              return (
                <Link key={p.id} to={`/governance/${p.id}`} className="glass-card-hover block p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display font-semibold text-lg line-clamp-2">{p.title}</h3>
                    <Badge variant="outline" className={cn('text-xs shrink-0', cfg.cls)}>
                      <Icon className="w-3 h-3 mr-1" />{cfg.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Yes {yes.toLocaleString()}</span>
                      <span>No {no.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald to-primary" style={{ width: `${yesPct}%` }} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deadline: {p.deadline.toLocaleString()}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <BackToTop />
    </Layout>
  );
};

export default Governance;
