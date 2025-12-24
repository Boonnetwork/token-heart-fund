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
import { Rocket, Wallet, Image, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { campaignSchema, sanitizeText } from '@/lib/validation';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const { crowdfundingContract, tokenSymbol } = useContracts();
  const { createCampaign } = useCrowdfunding();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    // Validate URL format
    if (url) {
      try {
        const parsed = new URL(url);
        if (['http:', 'https:', 'ipfs:'].includes(parsed.protocol)) {
          setImagePreview(url);
          setErrors(prev => ({ ...prev, imageUrl: '' }));
        } else {
          setImagePreview('');
          setErrors(prev => ({ ...prev, imageUrl: 'Only HTTP, HTTPS, or IPFS URLs are allowed' }));
        }
      } catch {
        setImagePreview('');
        if (url.length > 5) {
          setErrors(prev => ({ ...prev, imageUrl: 'Invalid URL format' }));
        }
      }
    } else {
      setImagePreview('');
      setErrors(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!crowdfundingContract) {
      toast.error('Contract not configured. Please check settings.');
      return;
    }

    // Sanitize inputs
    const sanitizedData = {
      title: sanitizeText(formData.title),
      shortDescription: sanitizeText(formData.shortDescription),
      fullDescription: sanitizeText(formData.fullDescription || formData.shortDescription),
      goalAmount: formData.goalAmount,
      durationDays: formData.durationDays,
      imageUrl: formData.imageUrl,
    };

    // Validate with Zod
    const result = campaignSchema.safeParse(sanitizedData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      toast.error('Please fix the validation errors');
      return;
    }

    setIsSubmitting(true);
    
    const campaignId = await createCampaign(
      sanitizedData.title,
      sanitizedData.fullDescription,
      sanitizedData.imageUrl || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
      sanitizedData.goalAmount,
      parseInt(sanitizedData.durationDays)
    );

    if (campaignId) {
      // Redirect to the newly created campaign
      navigate(`/campaign/${campaignId}`);
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
                  className={errors.title ? 'border-destructive' : ''}
                  required 
                />
                <div className="flex justify-between">
                  {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
                  <p className="text-xs text-muted-foreground ml-auto">{formData.title.length}/100</p>
                </div>
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
                  className={errors.shortDescription ? 'border-destructive' : ''}
                />
                {errors.shortDescription && <p className="text-destructive text-xs">{errors.shortDescription}</p>}
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
                  className={errors.fullDescription ? 'border-destructive' : ''}
                  required 
                />
                <div className="flex justify-between">
                  {errors.fullDescription && <p className="text-destructive text-xs">{errors.fullDescription}</p>}
                  <p className="text-xs text-muted-foreground ml-auto">{formData.fullDescription.length}/5000</p>
                </div>
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
                    step="any"
                    className={errors.goalAmount ? 'border-destructive' : ''}
                    required 
                  />
                  {errors.goalAmount && <p className="text-destructive text-xs">{errors.goalAmount}</p>}
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
                    className={errors.durationDays ? 'border-destructive' : ''}
                    required 
                  />
                  {errors.durationDays && <p className="text-destructive text-xs">{errors.durationDays}</p>}
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
                    className={errors.imageUrl ? 'border-destructive' : ''}
                  />
                  {errors.imageUrl && <p className="text-destructive text-xs">{errors.imageUrl}</p>}
                  
                  {/* Image Preview */}
                  {imagePreview ? (
                    <div className="relative rounded-lg overflow-hidden aspect-video bg-muted">
                      <img 
                        src={imagePreview} 
                        alt="Campaign preview"
                        className="w-full h-full object-cover"
                        onError={() => {
                          setImagePreview('');
                          setErrors(prev => ({ ...prev, imageUrl: 'Failed to load image' }));
                        }}
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setFormData({ ...formData, imageUrl: '' });
                          setImagePreview('');
                          setErrors(prev => ({ ...prev, imageUrl: '' }));
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
