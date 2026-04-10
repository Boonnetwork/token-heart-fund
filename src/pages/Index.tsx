import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { CampaignCard, Campaign } from '@/components/CampaignCard';
import { useCrowdfunding } from '@/hooks/useCrowdfunding';
import { Rocket, Shield, Zap, Users, ArrowRight, Coins, Lock, Globe, Loader2, Wallet, Search, Heart, BadgeCheck } from 'lucide-react';

const features = [
  { icon: Shield, title: 'Fully Decentralized', description: 'All funds are managed by smart contracts with complete transparency.' },
  { icon: Zap, title: 'Instant Transactions', description: 'Lightning-fast donations on BNB Smart Chain with minimal fees.' },
  { icon: Lock, title: 'Secure & Audited', description: 'Smart contracts are thoroughly tested and audited for security.' },
  { icon: Globe, title: 'Global Access', description: 'Anyone with a wallet can participate from anywhere in the world.' },
];

const howItWorks = [
  { step: '01', icon: Wallet, title: 'Connect Wallet', description: 'Connect your MetaMask or WalletConnect compatible wallet to get started.' },
  { step: '02', icon: Search, title: 'Browse Campaigns', description: 'Explore active campaigns or create your own fundraising project.' },
  { step: '03', icon: Heart, title: 'Donate Tokens', description: 'Support projects by donating CFI tokens. Your donation is recorded on-chain.' },
  { step: '04', icon: BadgeCheck, title: 'Funds Released', description: 'Once the goal is reached, creators can claim funds. If not, donors get refunds.' },
];

const Index = () => {
  const { campaigns, isLoading, tokenSymbol } = useCrowdfunding();

  const featuredCampaigns: Campaign[] = campaigns
    .filter(c => c.status === 'active')
    .slice(0, 3)
    .map(c => ({
      id: c.id.toString(),
      title: c.title,
      shortDescription: c.description.slice(0, 150) + (c.description.length > 150 ? '...' : ''),
      imageUrl: c.imageUrl,
      goalAmount: parseFloat(c.goalAmount),
      raisedAmount: parseFloat(c.raisedAmount),
      deadline: c.deadline,
      creatorAddress: c.creator,
      donorsCount: c.donorCount,
      status: c.status === 'cancelled' ? 'failed' : c.status,
      tokenSymbol: tokenSymbol,
    }));

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="container mx-auto px-4 py-20 lg:py-32 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium animate-fade-in">
                <Coins className="w-4 h-4" />
                Powered by BNB Smart Chain
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                Fund the Future with{' '}
                <span className="gradient-text text-glow">Blockchain</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Decentralized crowdfunding platform where every donation is transparent, 
                secure, and powered by smart contracts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <Button variant="gradient" size="xl" asChild>
                  <Link to="/campaigns">
                    <Rocket className="w-5 h-5" />
                    Explore Campaigns
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link to="/create">
                    Start a Campaign
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in just a few simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div 
                key={item.step} 
                className="relative text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Connector line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <item.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <span className="text-xs font-mono text-primary font-bold tracking-wider">STEP {item.step}</span>
                  <h3 className="font-display font-semibold text-foreground mt-2 mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose CrowdChain?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built on blockchain technology for maximum transparency and security.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className="glass-card p-6 text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Featured Campaigns
              </h2>
              <p className="text-muted-foreground">Discover innovative projects seeking funding</p>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex">
              <Link to="/campaigns">
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : featuredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Rocket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">No Active Campaigns Yet</h3>
              <p className="text-muted-foreground mb-6">Be the first to create a campaign!</p>
              <Button variant="gradient" asChild>
                <Link to="/create">Create Campaign</Link>
              </Button>
            </div>
          )}
          
          <div className="text-center mt-8 sm:hidden">
            <Button variant="outline" asChild>
              <Link to="/campaigns">View All Campaigns</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Launch Your Project?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Create your campaign in minutes and start receiving donations from supporters worldwide.
          </p>
          <Button variant="gradient" size="xl" asChild>
            <Link to="/create">
              <Rocket className="w-5 h-5" />
              Create Campaign
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
