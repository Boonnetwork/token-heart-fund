import React, { useEffect, useState } from 'react';
import { useMetrics } from '@/hooks/useMetrics';
import { useContracts } from '@/contexts/ContractContext';
import { Rocket, Users, Trophy, Coins, Loader2 } from 'lucide-react';

const useAnimatedNumber = (value: number, duration = 1200) => {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const delta = value - start;
    if (delta === 0) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(start + delta * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return display;
};

const Stat: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  format?: (v: number) => string;
  delay?: number;
}> = ({ icon: Icon, label, value, format, delay = 0 }) => {
  const animated = useAnimatedNumber(value);
  return (
    <div
      className="glass-card p-6 text-center animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-primary-foreground" />
      </div>
      <div className="font-display text-3xl md:text-4xl font-bold gradient-text">
        {format ? format(animated) : Math.round(animated).toLocaleString()}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
};

export const MetricsCounter: React.FC = () => {
  const m = useMetrics();
  const { tokenSymbol } = useContracts();

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <span className="text-xs font-mono text-primary font-bold tracking-wider">LIVE METRICS</span>
          <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mt-2">
            Platform Activity in Real Time
          </h2>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">
            Numbers pulled straight from the smart contract — updated live via on-chain events.
          </p>
          {m.loading && (
            <div className="inline-flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" /> syncing…
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Stat icon={Rocket} label="Total Campaigns" value={m.totalCampaigns} delay={0} />
          <Stat icon={Trophy} label="Funded Campaigns" value={m.fundedCampaigns} delay={0.1} />
          <Stat icon={Users} label="Unique Donors" value={m.uniqueDonors} delay={0.2} />
          <Stat
            icon={Coins}
            label={`Total Raised (${tokenSymbol})`}
            value={m.totalRaised}
            format={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
};
