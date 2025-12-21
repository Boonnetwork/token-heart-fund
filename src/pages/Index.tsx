import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { CampaignCard, Campaign } from '@/components/CampaignCard';
import { Rocket, Shield, Zap, Users, ArrowRight, Coins, Lock, Globe } from 'lucide-react';

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'DeFi Education Platform',
    shortDescription: 'Building a free educational platform to teach blockchain and DeFi concepts to beginners worldwide.',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop',
    goalAmount: 50000,
    raisedAmount: 32500,
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    creatorAddress: '0x1234...5678',
    donorsCount: 128,
    status: 'active',
    tokenSymbol: 'TOKEN',
  },
  {
    id: '2',
    title: 'Green Energy NFT Marketplace',
    shortDescription: 'Carbon-neutral NFT marketplace that plants trees with every transaction.',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop',
    goalAmount: 100000,
    raisedAmount: 87000,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    creatorAddress: '0xabcd...efgh',
    donorsCount: 256,
    status: 'active',
    tokenSymbol: 'TOKEN',
  },
  {
    id: '3',
    title: 'Web3 Gaming Studio',
    shortDescription: 'Creating the next generation of play-to-earn games with fair tokenomics.',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop',
    goalAmount: 75000,
    raisedAmount: 75000,
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    creatorAddress: '0x9876...5432',
    donorsCount: 189,
    status: 'completed',
    tokenSymbol: 'TOKEN',
  },
];

const features = [
  { icon: Shield, title: 'Fully Decentralized', description: 'All funds are managed by smart contracts with complete transparency.' },
  { icon: Zap, title: 'Instant Transactions', description: 'Lightning-fast donations on BNB Smart Chain with minimal fees.' },
  { icon: Lock, title: 'Secure & Audited', description: 'Smart contracts are thoroughly tested and audited for security.' },
  { icon: Globe, title: 'Global Access', description: 'Anyone with a wallet can participate from anywhere in the world.' },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="container mx-auto px-4 py-20 lg:py-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium animate-fade-in">
              <Coins className="w-4 h-4" />
              Powered by BNB Smart Chain
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-foreground animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Fund the Future with{' '}
              <span className="gradient-text text-glow">Blockchain</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
      </section>

      {/* Features */}
      <section className="py-20 bg-card/30">
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
      <section className="py-20">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
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
