import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, ArrowRight, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Campaign {
  id: string;
  title: string;
  shortDescription: string;
  imageUrl: string;
  goalAmount: number;
  raisedAmount: number;
  deadline: Date;
  creatorAddress: string;
  donorsCount: number;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  tokenSymbol: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  className?: string;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800';

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, className }) => {
  const progress = (campaign.raisedAmount / campaign.goalAmount) * 100;
  const daysLeft = Math.max(0, Math.ceil((campaign.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isEnded = daysLeft === 0;
  const [imgError, setImgError] = React.useState(false);

  const statusConfig = {
    active: { label: 'Active', className: 'bg-emerald/20 text-emerald border-emerald/30' },
    completed: { label: 'Funded', className: 'bg-primary/20 text-primary border-primary/30' },
    failed: { label: 'Ended', className: 'bg-destructive/20 text-destructive border-destructive/30' },
    cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground border-border' },
  };

  return (
    <Link 
      to={`/campaign/${campaign.id}`}
      className={cn("glass-card-hover block overflow-hidden group", className)}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imgError ? DEFAULT_IMAGE : campaign.imageUrl || DEFAULT_IMAGE} 
          alt={campaign.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        <Badge 
          variant="outline" 
          className={cn("absolute top-3 right-3", statusConfig[campaign.status].className)}
        >
          {campaign.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
          {statusConfig[campaign.status].label}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {campaign.title}
          </h3>
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
            {campaign.shortDescription}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="relative">
            <Progress value={Math.min(progress, 100)} className="h-2 bg-muted" />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-foreground font-semibold">
              {campaign.raisedAmount.toLocaleString()} {campaign.tokenSymbol}
            </span>
            <span className="text-muted-foreground">
              {progress.toFixed(1)}% of {campaign.goalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {isEnded ? 'Ended' : `${daysLeft}d left`}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {campaign.donorsCount}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  );
};
