import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { BackToTop } from '@/components/BackToTop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@/contexts/WalletContext';
import { useContracts } from '@/contexts/ContractContext';
import { useStaking } from '@/hooks/useStaking';
import { useReferral } from '@/hooks/useReferral';
import {
  Coins, TrendingUp, Gift, Layers, Loader2, AlertCircle, ArrowUpRight, ArrowDownRight, Wallet,
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { toast } from 'sonner';

const fmt = (v: string | number, d = 4) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (!isFinite(n)) return '0';
  return n.toLocaleString(undefined, { maximumFractionDigits: d });
};

const Staking = () => {
  const { isConnected, address } = useWallet();
  const { tokenBalance, tokenSymbol, stakingContract } = useContracts();
  const { state, isLoading, stake, unstake, claim } = useStaking();
  const { pendingReferrer } = useReferral();

  const [stakeAmt, setStakeAmt] = useState('');
  const [unstakeAmt, setUnstakeAmt] = useState('');
  const [busy, setBusy] = useState<'stake' | 'unstake' | 'claim' | null>(null);

  if (!isConnected) return <Navigate to="/" replace />;

  if (!stakingContract) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center max-w-lg">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold mb-3">Staking Not Configured</h1>
          <p className="text-muted-foreground mb-6">
            The staking contract address hasn't been set. The admin can deploy
            <code className="px-1 mx-1 bg-muted rounded">CFDStaking.sol</code> and configure its
            address from the Settings page.
          </p>
          <Button variant="gradient" asChild>
            <Link to="/settings">Go to Settings</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleStake = async () => {
    if (!stakeAmt) return;
    if (pendingReferrer && pendingReferrer.toLowerCase() === address?.toLowerCase()) {
      toast.error('Cannot use your own address as referrer'); return;
    }
    setBusy('stake');
    const ok = await stake(stakeAmt, state.referrer ? null : pendingReferrer);
    if (ok) setStakeAmt('');
    setBusy(null);
  };

  const handleUnstake = async () => {
    if (!unstakeAmt) return;
    setBusy('unstake');
    const ok = await unstake(unstakeAmt);
    if (ok) setUnstakeAmt('');
    setBusy(null);
  };

  const handleClaim = async () => {
    setBusy('claim');
    await claim();
    setBusy(null);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
        <div className="mb-6 sm:mb-10">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
            Staking
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Stake {tokenSymbol} to earn rewards and participate in governance.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8">
          <Stat label="Total Staked" value={`${fmt(state.totalStaked)} ${tokenSymbol}`} icon={Layers} />
          <Stat label="My Stake" value={`${fmt(state.myStake)} ${tokenSymbol}`} icon={Coins} />
          <Stat label="Pending Rewards" value={`${fmt(state.pendingReward, 6)} ${tokenSymbol}`} icon={TrendingUp} />
          <Stat label="Wallet Balance" value={`${fmt(tokenBalance)} ${tokenSymbol}`} icon={Wallet} />
        </div>

        {pendingReferrer && !state.referrer && (
          <Card className="glass-card mb-6 border-primary/30">
            <CardContent className="py-4 flex items-start gap-3">
              <Gift className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Referral detected</p>
                <p className="text-sm text-muted-foreground break-all">
                  Your first stake will register <span className="font-mono">{pendingReferrer}</span> as your referrer.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="stake" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="stake">Stake</TabsTrigger>
            <TabsTrigger value="unstake">Unstake</TabsTrigger>
            <TabsTrigger value="claim">Claim</TabsTrigger>
          </TabsList>

          <TabsContent value="stake">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ArrowUpRight className="w-5 h-5 text-emerald" />Stake {tokenSymbol}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number" min="0" step="any"
                      placeholder="0.0"
                      value={stakeAmt}
                      onChange={(e) => setStakeAmt(e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={() => setStakeAmt(tokenBalance)}>Max</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Available: {fmt(tokenBalance)} {tokenSymbol}</p>
                </div>
                <Button variant="gradient" size="lg" className="w-full" onClick={handleStake} disabled={busy === 'stake' || !stakeAmt}>
                  {busy === 'stake' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Staking…</> : 'Stake'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unstake">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ArrowDownRight className="w-5 h-5 text-destructive" />Unstake {tokenSymbol}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number" min="0" step="any"
                      placeholder="0.0"
                      value={unstakeAmt}
                      onChange={(e) => setUnstakeAmt(e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={() => setUnstakeAmt(state.myStake)}>Max</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Currently staked: {fmt(state.myStake)} {tokenSymbol}</p>
                </div>
                <Button variant="outline" size="lg" className="w-full" onClick={handleUnstake} disabled={busy === 'unstake' || !unstakeAmt || parseFloat(state.myStake) <= 0}>
                  {busy === 'unstake' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Unstaking…</> : 'Unstake'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claim">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Claim Rewards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-2">Pending Rewards</p>
                  <p className="font-display text-3xl font-bold gradient-text">
                    {fmt(state.pendingReward, 6)} {tokenSymbol}
                  </p>
                  {state.referrer && (
                    <p className="text-xs text-muted-foreground mt-3">
                      0.1% of your claim will be paid to your referrer (<span className="font-mono">{state.referrer.slice(0, 6)}…{state.referrer.slice(-4)}</span>).
                    </p>
                  )}
                </div>
                <Button variant="gradient" size="lg" className="w-full" onClick={handleClaim} disabled={busy === 'claim' || parseFloat(state.pendingReward) <= 0}>
                  {busy === 'claim' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Claiming…</> : 'Claim Rewards'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Refreshing on-chain state…
          </div>
        )}
      </div>
      <BackToTop />
    </Layout>
  );
};

const Stat: React.FC<{ label: string; value: string; icon: React.ComponentType<{ className?: string }> }> = ({ label, value, icon: Icon }) => (
  <Card className="glass-card">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      <Icon className="w-4 h-4 text-primary" />
    </CardHeader>
    <CardContent>
      <div className="text-lg sm:text-2xl font-bold text-foreground break-all">{value}</div>
    </CardContent>
  </Card>
);

export default Staking;
