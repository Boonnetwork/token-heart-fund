import React from 'react';
import { Layout } from '@/components/Layout';
import { CampaignCard, Campaign } from '@/components/CampaignCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';

const mockCampaigns: Campaign[] = [
  { id: '1', title: 'DeFi Education Platform', shortDescription: 'Building a free educational platform to teach blockchain and DeFi concepts.', imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800', goalAmount: 50000, raisedAmount: 32500, deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), creatorAddress: '0x1234...5678', donorsCount: 128, status: 'active', tokenSymbol: 'TOKEN' },
  { id: '2', title: 'Green Energy NFT Marketplace', shortDescription: 'Carbon-neutral NFT marketplace that plants trees.', imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800', goalAmount: 100000, raisedAmount: 87000, deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), creatorAddress: '0xabcd...efgh', donorsCount: 256, status: 'active', tokenSymbol: 'TOKEN' },
  { id: '3', title: 'Web3 Gaming Studio', shortDescription: 'Creating play-to-earn games with fair tokenomics.', imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800', goalAmount: 75000, raisedAmount: 75000, deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), creatorAddress: '0x9876...5432', donorsCount: 189, status: 'completed', tokenSymbol: 'TOKEN' },
  { id: '4', title: 'DAO Governance Tools', shortDescription: 'Open-source tools for decentralized governance.', imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', goalAmount: 40000, raisedAmount: 12000, deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), creatorAddress: '0x5555...6666', donorsCount: 45, status: 'active', tokenSymbol: 'TOKEN' },
];

const Campaigns = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">All Campaigns</h1>
          <p className="text-muted-foreground">Discover and support innovative blockchain projects</p>
        </div>
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search campaigns..." className="pl-10" />
          </div>
          <Button variant="outline"><Filter className="w-4 h-4 mr-2" />Filter</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Campaigns;
