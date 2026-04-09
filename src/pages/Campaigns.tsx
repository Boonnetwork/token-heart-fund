import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { CampaignCard, Campaign } from '@/components/CampaignCard';
import { CampaignCardSkeleton } from '@/components/CampaignCardSkeleton';
import { BackToTop } from '@/components/BackToTop';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCrowdfunding } from '@/hooks/useCrowdfunding';
import { Search, Filter, Rocket, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'active' | 'completed' | 'failed' | 'cancelled';
type SortOption = 'newest' | 'ending-soon' | 'most-funded' | 'most-backers';

const ITEMS_PER_PAGE = 9;

const Campaigns = () => {
  const { campaigns, isLoading, tokenSymbol, fetchCampaigns } = useCrowdfunding();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCampaigns();
    setIsRefreshing(false);
    toast.success('Campaigns refreshed');
  };

  const filteredAndSortedCampaigns = useMemo(() => {
    let result = campaigns.map(c => ({
      id: c.id.toString(),
      title: c.title,
      shortDescription: c.description.slice(0, 150) + (c.description.length > 150 ? '...' : ''),
      imageUrl: c.imageUrl,
      goalAmount: parseFloat(c.goalAmount),
      raisedAmount: parseFloat(c.raisedAmount),
      deadline: c.deadline,
      creatorAddress: c.creator,
      donorsCount: c.donorCount,
      status: c.status,
      tokenSymbol: tokenSymbol,
    } as Campaign));

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(query) || 
        c.shortDescription.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    switch (sortOption) {
      case 'newest': result.sort((a, b) => parseInt(b.id) - parseInt(a.id)); break;
      case 'ending-soon': result.sort((a, b) => a.deadline.getTime() - b.deadline.getTime()); break;
      case 'most-funded': result.sort((a, b) => b.raisedAmount - a.raisedAmount); break;
      case 'most-backers': result.sort((a, b) => b.donorsCount - a.donorsCount); break;
    }

    return result;
  }, [campaigns, searchQuery, statusFilter, sortOption, tokenSymbol]);

  const totalPages = Math.ceil(filteredAndSortedCampaigns.length / ITEMS_PER_PAGE);
  const paginatedCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedCampaigns.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedCampaigns, currentPage]);

  React.useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, sortOption]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">All Campaigns</h1>
            <p className="text-muted-foreground">Discover and support innovative blockchain projects</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("w-4 h-4 mr-1", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="gradient" asChild>
              <Link to="/create"><Rocket className="w-4 h-4 mr-2" />Create Campaign</Link>
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search campaigns..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
              <SelectItem value="most-funded">Most Funded</SelectItem>
              <SelectItem value="most-backers">Most Backers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CampaignCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredAndSortedCampaigns.length === 0 ? (
          <div className="text-center py-20">
            <Rocket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No campaigns found' : 'No campaigns yet'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Be the first to create a campaign!'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button variant="gradient" asChild>
                <Link to="/create">Create First Campaign</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {paginatedCampaigns.length} of {filteredAndSortedCampaigns.length} campaign{filteredAndSortedCampaigns.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(page)} className="w-8 h-8 p-0">
                      {page}
                    </Button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <BackToTop />
    </Layout>
  );
};

export default Campaigns;
