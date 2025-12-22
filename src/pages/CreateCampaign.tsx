import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useWallet } from '@/contexts/WalletContext';
import { useContracts } from '@/contexts/ContractContext';
import { useCrowdfunding } from '@/hooks/useCrowdfunding';
import { Rocket, Upload, Wallet, Image, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const { crowdfundingContract, tokenSymbol } = useContracts();
  const { createCampaign } = useCrowdfunding();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    goalAmount: '',
    durationDays: '',
    imageUrl: '',
  });

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, imageUrl: url });
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!crowdfundingContract) {
      toast.error('Contract not configured. Please check settings.');
      return;
    }

    // Validation
    if (!formData.title || formData.title.length > 100) {
      toast.error('Title is required (max 100 characters)');
      return;
    }

    const fullDescription = formData.fullDescription || formData.shortDescription;
    if (!fullDescription || fullDescription.length > 5000) {
      toast.error('Description is required (max 5000 characters)');
      return;
    }

    const goalAmount = parseFloat(formData.goalAmount);
    if (isNaN(goalAmount) || goalAmount <= 0) {
      toast.error('Please enter a valid goal amount');
      return;
    }

    const durationDays = parseInt(formData.durationDays);
    if (isNaN(durationDays) || durationDays < 1 || durationDays > 365) {
      toast.error('Duration must be between 1 and 365 days');
      return;
    }

    setIsSubmitting(true);
    
    const success = await createCampaign(
      formData.title,
      fullDescription,
      formData.imageUrl || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
      formData.goalAmount,
      durationDays
    );

    if (success) {
      navigate('/campaigns');
    }
    
    setIsSubmitting(false);
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

  if (!crowdfundingContract) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Contracts Not Configured</h1>
          <p className="text-muted-foreground mb-6">
            Please configure the smart contract addresses in the settings page first.
          </p>
          <Button variant="gradient" asChild>
            <Link to="/settings">Go to Settings</Link>
          </Button>
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
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Campaign Title *</Label>
                <Input 
                  id="title"
                  placeholder="Enter campaign title (max 100 characters)" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={100}
                  required 
                />
                <p className="text-xs text-muted-foreground">{formData.title.length}/100</p>
              </div>

              {/* Short Description */}
              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input 
                  id="shortDescription"
                  placeholder="Brief description for preview cards" 
                  value={formData.shortDescription} 
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  maxLength={150}
                />
              </div>

              {/* Full Description */}
              <div className="space-y-2">
                <Label htmlFor="fullDescription">Full Description *</Label>
                <Textarea 
                  id="fullDescription"
                  placeholder="Detailed description of your campaign, goals, and how funds will be used" 
                  rows={6} 
                  value={formData.fullDescription} 
                  onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                  maxLength={5000}
                  required 
                />
                <p className="text-xs text-muted-foreground">{formData.fullDescription.length}/5000</p>
              </div>

              {/* Goal & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goalAmount">Goal Amount ({tokenSymbol}) *</Label>
                  <Input 
                    id="goalAmount"
                    type="number" 
                    placeholder="10000" 
                    value={formData.goalAmount} 
                    onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
                    min="1"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Days) *</Label>
                  <Input 
                    id="duration"
                    type="number" 
                    placeholder="30" 
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                    min="1"
                    max="365"
                    required 
                  />
                </div>
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Campaign Image</Label>
                <div className="space-y-3">
                  <Input 
                    id="imageUrl"
                    type="url"
                    placeholder="https://... (image URL or IPFS link)" 
                    value={formData.imageUrl}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                  />
                  
                  {/* Image Preview */}
                  {imagePreview ? (
                    <div className="relative rounded-lg overflow-hidden aspect-video bg-muted">
                      <img 
                        src={imagePreview} 
                        alt="Campaign preview"
                        className="w-full h-full object-cover"
                        onError={() => setImagePreview('')}
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setFormData({ ...formData, imageUrl: '' });
                          setImagePreview('');
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm mb-1">Enter an image URL above</p>
                      <p className="text-muted-foreground text-xs">Supports IPFS, HTTP/HTTPS links</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                variant="gradient" 
                size="lg" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Campaign...</>
                ) : (
                  <><Rocket className="w-4 h-4 mr-2" />Create Campaign</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateCampaign;
