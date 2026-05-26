import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { CampaignCard, Campaign } from '@/components/CampaignCard';
import { useCrowdfunding } from '@/hooks/useCrowdfunding';
import { Rocket, Shield, Zap, Users, ArrowRight, Coins, Lock, Globe, Loader2, Wallet, Search, Heart, BadgeCheck, HandCoins, Cog, Receipt, Gem, Landmark, Check } from 'lucide-react';

const platformSteps = [
  {
    number: '1',
    icon: Rocket,
    title: 'Create Campaigns',
    description: 'Anyone can launch a fundraising campaign — smart contracts securely manage the funds on-chain.',
    listLabel: 'Built for:',
    items: ['Startups', 'Personal causes', 'NGOs', 'Open-source projects', 'Charity initiatives', 'Creative projects', 'Community funding'],
  },
  {
    number: '2',
    icon: HandCoins,
    title: 'Contribute Securely',
    description: 'Supporters contribute using the native token. Every transaction is publicly verifiable on the blockchain. The only accepted token is the Native Token.',
    listLabel: '',
    items: [] as string[],
  },
  {
    number: '3',
    icon: Cog,
    title: 'Automated Fund Distribution',
    description: 'No middlemen. Funds are released automatically by the rules written into the contract.',
    listLabel: 'Released based on:',
    items: ['Campaign success conditions', 'Smart contract rules', 'Time-based campaign completion'],
  },
];

const tokenUtilities = ['Reduced platform fees', 'Governance voting', 'Staking rewards', 'Community incentives'];
const treasuryUses = ['Security audits', 'Ecosystem expansion', 'Community grants', 'Liquidity growth', 'Platform development'];

const whyBlockchain = [
  { title: 'Global Accessibility', description: 'Anyone with a crypto wallet can participate from anywhere.' },
  { title: 'Full Transparency', description: 'All campaign transactions are verifiable on-chain.' },
  { title: 'Lower Fees', description: 'Reduced intermediary costs compared to traditional platforms.' },
  { title: 'Faster Payments', description: 'Smart contracts automate fund distribution globally.' },
  { title: 'Community Governance', description: 'Users help shape the future of the ecosystem.' },
];

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
        <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="space-y-6 sm:space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium animate-fade-in">
                <Coins className="w-4 h-4" />
                Powered by BNB Smart Chain
              </div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground animate-fade-in-up leading-tight" style={{ animationDelay: '0.1s' }}>
                Fund the Future with{' '}
                <span className="gradient-text text-glow">Blockchain</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Decentralized crowdfunding platform where every donation is transparent, 
                secure, and powered by smart contracts.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
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
      <section className="py-12 sm:py-20 bg-card/30">
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
      <section className="py-12 sm:py-20">
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

      {/* Business Model — Platform, Revenue & Why Blockchain */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 space-y-20">

          {/* Intro */}
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-mono text-primary font-bold tracking-wider">OUR MODEL</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3 mb-5 leading-tight">
              Transparent. Community-Driven.<br />Built for Global Fundraising.
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Our platform combines decentralized crowdfunding with blockchain transparency to create a fair ecosystem for campaign creators, contributors, and communities worldwide.
            </p>
          </div>

          {/* How The Platform Works */}
          <div>
            <div className="text-center mb-10">
              <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground">How The Platform Works</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {platformSteps.map((step, index) => (
                <div
                  key={step.number}
                  className="glass-card p-6 sm:p-8 animate-fade-in-up flex flex-col"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="text-xs font-mono text-primary font-bold tracking-wider">STEP {step.number}</span>
                  </div>
                  <h4 className="font-display text-lg font-semibold text-foreground mb-2">{step.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5">{step.description}</p>
                  {step.items.length > 0 && (
                    <>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{step.listLabel}</p>
                      <ul className="space-y-2">
                        {step.items.map((it) => (
                          <li key={it} className="flex items-start gap-2 text-sm text-foreground/90">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Model */}
          <div>
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <span className="text-xs font-mono text-primary font-bold tracking-wider">REVENUE MODEL</span>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-2">Platform Fee</h3>
              <p className="text-muted-foreground mt-3">
                A small percentage fee is charged only on successfully funded campaigns.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 sm:p-8 text-center md:col-span-1">
                <Receipt className="w-8 h-8 text-primary mx-auto mb-4" />
                <div className="font-display text-5xl font-bold gradient-text">2%</div>
                <p className="text-sm text-muted-foreground mt-2">Platform fee on successful campaigns</p>
              </div>
              <div className="glass-card p-6 sm:p-8 md:col-span-2">
                <h4 className="font-display text-lg font-semibold text-foreground mb-4">Typical structure</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-foreground/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>2% platform fee</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-foreground/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Lower than traditional crowdfunding platforms</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-foreground/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>No hidden charges</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Token Utility + Treasury */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Gem className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">Token Utility Ecosystem</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-5">
                Our native ecosystem token powers the platform economy.
              </p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Token utilities include:</p>
              <ul className="space-y-2">
                {tokenUtilities.map((u) => (
                  <li key={u} className="flex items-start gap-2 text-sm text-foreground/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">Treasury & Ecosystem Growth</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-5">
                A portion of platform revenue supports long-term sustainability.
              </p>
              <ul className="space-y-2">
                {treasuryUses.map((u) => (
                  <li key={u} className="flex items-start gap-2 text-sm text-foreground/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Why Blockchain Crowdfunding */}
          <div>
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <h3 className="font-display text-2xl md:text-4xl font-bold text-foreground">Why Blockchain Crowdfunding?</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {whyBlockchain.map((item, index) => (
                <div
                  key={item.title}
                  className="glass-card p-6 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <h4 className="font-display text-lg font-semibold text-foreground mb-2">{item.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Roadmap */}
          <div>
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <h3 className="font-display text-2xl md:text-4xl font-bold text-foreground">Roadmap (2025–2027)</h3>
              <p className="text-muted-foreground mt-3 text-sm md:text-base">Our journey from prototype to multi-chain ecosystem.</p>
            </div>

            <div className="relative">
              {/* Horizontal scroll container */}
              <div className="overflow-x-auto pb-6 -mx-4 px-4 scroll-smooth snap-x snap-mandatory">
                <div className="relative flex gap-5 min-w-max">
                  {/* Connecting line */}
                  <div className="absolute top-6 left-6 right-6 h-px bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 hidden md:block" />

                  {[
                    {
                      quarter: "Q3 2025",
                      title: "Planning & Research",
                      points: [
                        "Finalise protocol design",
                        "Tokenomics & legal framework",
                        "Begin prototype smart contract development",
                      ],
                    },
                    {
                      quarter: "Q4 2025",
                      title: "Development Phase I",
                      points: [
                        "Build core smart contract functionality",
                        "Develop frontend prototype",
                        "Initial community building",
                      ],
                    },
                    {
                      quarter: "Q1 2026",
                      title: "Testnet Launch & Beta",
                      points: [
                        "Deploy CrowdFunder testnet on BNB Testnet",
                        "Invite community testers",
                        "Usability and security testing",
                        "Engage advisors and refine features",
                      ],
                    },
                    {
                      quarter: "Q2 2026",
                      title: "Mainnet & Token Launch",
                      points: [
                        "Launch mainnet platform on BNB Chain",
                        "Private + public CFI token sale",
                        "Marketing and partnerships",
                        "Get listed on exchanges",
                      ],
                    },
                    {
                      quarter: "Q3 2026",
                      title: "Community & DAO",
                      points: [
                        "Launch CFI staking reward program",
                        "Begin governance voting on proposals",
                        "Onboard early NGOs and creators",
                      ],
                    },
                    {
                      quarter: "Q4 2026",
                      title: "Feature Expansion",
                      points: [
                        "Integrate NFT rewards & advanced KYC",
                        "NGO and academic collaborations",
                        "Continued audits & compliance reviews",
                      ],
                    },
                    {
                      quarter: "Q1 2027",
                      title: "Multi-chain Expansion",
                      points: [
                        "Evaluate Ethereum, Polygon bridging",
                        "Expand global presence",
                        "Localized campaigns & multilingual UI",
                      ],
                    },
                  ].map((phase, index) => (
                    <div
                      key={phase.quarter}
                      className="snap-start w-72 sm:w-80 shrink-0 relative animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {/* Node dot */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow shrink-0 relative z-10">
                          <span className="text-primary-foreground font-bold text-xs">{phase.quarter.split(" ")[0]}</span>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">{phase.quarter.split(" ")[1]}</div>
                      </div>

                      <div className="glass-card p-5 h-full">
                        <h4 className="font-display text-lg font-semibold text-foreground mb-3">{phase.title}</h4>
                        <ul className="space-y-2">
                          {phase.points.map((p) => (
                            <li key={p} className="flex items-start gap-2 text-sm text-foreground/90">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">← Scroll horizontally to view all phases →</p>
            </div>
          </div>

        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-12 sm:py-20 bg-card/30">

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
      <section className="py-12 sm:py-20 bg-gradient-hero">
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
