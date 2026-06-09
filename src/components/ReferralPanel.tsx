import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStaking } from '@/hooks/useStaking';
import { useReferral } from '@/hooks/useReferral';
import { useContracts } from '@/contexts/ContractContext';
import { Gift, Users, Copy, Award, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v: string | number, d = 4) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (!isFinite(n)) return '0';
  return n.toLocaleString(undefined, { maximumFractionDigits: d });
};

export const ReferralPanel: React.FC = () => {
  const { state, tokenSymbol } = useStaking();
  const { referralLink } = useReferral();
  const { stakingContract } = useContracts();

  const copy = (text: string, label = 'Copied!') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  if (!stakingContract) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-primary" />Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The referral system activates as soon as the staking contract is configured.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-primary" />Referrals</CardTitle>
        <p className="text-xs text-muted-foreground">Earn 0.1% of your referees' staking reward claims. Single-level only.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Mini label="Total Referrals" value={state.referralCount.toString()} icon={Users} />
          <Mini label="Earned" value={`${fmt(state.referralEarned, 6)} ${tokenSymbol}`} icon={Award} />
          <Mini label="Claimed" value={`${fmt(state.referralClaimed, 6)} ${tokenSymbol}`} icon={Gift} />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Your Referral Link</p>
          <div className="flex gap-2">
            <Input readOnly value={referralLink} className="font-mono text-xs" />
            <Button type="button" variant="outline" onClick={() => copy(referralLink, 'Link copied!')}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {state.referredAddresses.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Referred Wallets</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {state.referredAddresses.map((addr) => (
                <div key={addr} className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0">
                  <a
                    href={`https://testnet.bscscan.com/address/${addr}`}
                    target="_blank" rel="noopener noreferrer"
                    className="font-mono text-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    {addr.slice(0, 8)}…{addr.slice(-6)}<ExternalLink className="w-3 h-3" />
                  </a>
                  <button onClick={() => copy(addr, 'Address copied!')} className="text-muted-foreground hover:text-foreground">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Mini: React.FC<{ label: string; value: string; icon: React.ComponentType<{ className?: string }> }> = ({ label, value, icon: Icon }) => (
  <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
    <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
      <Icon className="w-3.5 h-3.5" />{label}
    </div>
    <div className="font-semibold text-foreground text-sm break-all">{value}</div>
  </div>
);
