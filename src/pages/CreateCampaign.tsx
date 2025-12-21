import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@/contexts/WalletContext';
import { Rocket, Upload, Wallet } from 'lucide-react';
import { toast } from 'sonner';

const CreateCampaign = () => {
  const { isConnected } = useWallet();
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    goalAmount: '',
    deadline: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    toast.info('Campaign creation requires smart contract integration');
  };

  if (!isConnected) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Connect Your Wallet</h1>
          <p className="text-muted-foreground">Please connect your wallet to create a campaign</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Create Campaign</h1>
          <p className="text-muted-foreground">Launch your fundraising campaign on the blockchain</p>
        </div>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Campaign Title</Label>
                <Input placeholder="Enter campaign title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input placeholder="Brief description for cards" value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea placeholder="Detailed description of your campaign" rows={6} value={formData.fullDescription} onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Goal Amount (Tokens)</Label>
                  <Input type="number" placeholder="10000" value={formData.goalAmount} onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Campaign Image</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Click to upload or drag and drop</p>
                </div>
              </div>
              <Button type="submit" variant="gradient" size="lg" className="w-full">
                <Rocket className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateCampaign;
