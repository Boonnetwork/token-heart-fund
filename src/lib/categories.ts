// Comprehensive campaign category catalog for ChainFunder.
// Edit this list to scale future categories — keep `slug` stable.

export interface Category {
  slug: string;
  label: string;
  group: string;
}

export const CATEGORIES: Category[] = [
  { slug: 'technology', label: 'Technology', group: 'Tech & Innovation' },
  { slug: 'artificial-intelligence', label: 'Artificial Intelligence', group: 'Tech & Innovation' },
  { slug: 'blockchain-web3', label: 'Blockchain & Web3', group: 'Tech & Innovation' },
  { slug: 'cryptocurrency', label: 'Cryptocurrency', group: 'Tech & Innovation' },
  { slug: 'defi', label: 'DeFi', group: 'Tech & Innovation' },
  { slug: 'nfts', label: 'NFTs', group: 'Tech & Innovation' },
  { slug: 'gaming', label: 'Gaming', group: 'Tech & Innovation' },
  { slug: 'open-source', label: 'Open Source Software', group: 'Tech & Innovation' },
  { slug: 'security-privacy', label: 'Security & Privacy', group: 'Tech & Innovation' },
  { slug: 'robotics', label: 'Robotics', group: 'Tech & Innovation' },
  { slug: 'space-technology', label: 'Space Technology', group: 'Tech & Innovation' },
  { slug: 'science-research', label: 'Science & Research', group: 'Tech & Innovation' },

  { slug: 'education', label: 'Education', group: 'Social & Community' },
  { slug: 'healthcare', label: 'Healthcare', group: 'Social & Community' },
  { slug: 'medical-research', label: 'Medical Research', group: 'Social & Community' },
  { slug: 'charity', label: 'Charity', group: 'Social & Community' },
  { slug: 'non-profit', label: 'Non-Profit', group: 'Social & Community' },
  { slug: 'community-projects', label: 'Community Projects', group: 'Social & Community' },
  { slug: 'social-impact', label: 'Social Impact', group: 'Social & Community' },
  { slug: 'women-empowerment', label: 'Women Empowerment', group: 'Social & Community' },
  { slug: 'youth-development', label: 'Youth Development', group: 'Social & Community' },
  { slug: 'financial-inclusion', label: 'Financial Inclusion', group: 'Social & Community' },
  { slug: 'religious-projects', label: 'Religious Projects', group: 'Social & Community' },
  { slug: 'government-civic', label: 'Government & Civic Projects', group: 'Social & Community' },

  { slug: 'agriculture', label: 'Agriculture', group: 'Sustainability' },
  { slug: 'food-farming', label: 'Food & Farming', group: 'Sustainability' },
  { slug: 'renewable-energy', label: 'Renewable Energy', group: 'Sustainability' },
  { slug: 'climate-environment', label: 'Climate & Environment', group: 'Sustainability' },
  { slug: 'sustainability', label: 'Sustainability', group: 'Sustainability' },

  { slug: 'infrastructure', label: 'Infrastructure', group: 'Industry' },
  { slug: 'real-estate', label: 'Real Estate', group: 'Industry' },
  { slug: 'construction', label: 'Construction', group: 'Industry' },
  { slug: 'manufacturing', label: 'Manufacturing', group: 'Industry' },
  { slug: 'transportation', label: 'Transportation', group: 'Industry' },
  { slug: 'logistics', label: 'Logistics', group: 'Industry' },

  { slug: 'sports', label: 'Sports', group: 'Lifestyle & Culture' },
  { slug: 'fitness', label: 'Fitness', group: 'Lifestyle & Culture' },
  { slug: 'music', label: 'Music', group: 'Lifestyle & Culture' },
  { slug: 'film-entertainment', label: 'Film & Entertainment', group: 'Lifestyle & Culture' },
  { slug: 'art-design', label: 'Art & Design', group: 'Lifestyle & Culture' },
  { slug: 'fashion', label: 'Fashion', group: 'Lifestyle & Culture' },
  { slug: 'photography', label: 'Photography', group: 'Lifestyle & Culture' },
  { slug: 'journalism', label: 'Journalism', group: 'Lifestyle & Culture' },
  { slug: 'publishing', label: 'Publishing', group: 'Lifestyle & Culture' },
  { slug: 'travel-tourism', label: 'Travel & Tourism', group: 'Lifestyle & Culture' },
  { slug: 'culture-heritage', label: 'Culture & Heritage', group: 'Lifestyle & Culture' },

  { slug: 'small-business', label: 'Small Business', group: 'Business' },
  { slug: 'startup', label: 'Startup', group: 'Business' },
  { slug: 'ecommerce', label: 'E-commerce', group: 'Business' },

  { slug: 'other', label: 'Other', group: 'Other' },
];

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));
const BY_LABEL = new Map(CATEGORIES.map((c) => [c.label.toLowerCase(), c]));

export const getCategoryBySlug = (slug?: string | null): Category | undefined =>
  slug ? BY_SLUG.get(slug) : undefined;

export const getCategoryByLabel = (label?: string | null): Category | undefined =>
  label ? BY_LABEL.get(label.toLowerCase()) : undefined;

export const resolveCategory = (value?: string | null): Category | undefined => {
  if (!value) return undefined;
  return getCategoryBySlug(value) || getCategoryByLabel(value);
};

export const CATEGORY_GROUPS: { group: string; items: Category[] }[] = (() => {
  const groups = new Map<string, Category[]>();
  for (const c of CATEGORIES) {
    if (!groups.has(c.group)) groups.set(c.group, []);
    groups.get(c.group)!.push(c);
  }
  return Array.from(groups.entries()).map(([group, items]) => ({ group, items }));
})();

// ---------- Backward-compatible encoding ----------
// Existing deployed CrowdFunding contract has no `category` field, so we
// prefix the description with a tag the frontend strips on read. New
// contract version stores it natively.
const TAG_RE = /^\s*\[CAT:([a-z0-9-]+)\]\s*\n?/i;

export const encodeCategoryIntoDescription = (description: string, slug: string): string => {
  const cleaned = description.replace(TAG_RE, '');
  return `[CAT:${slug}]\n${cleaned}`;
};

export const extractCategory = (description: string): { category?: Category; description: string } => {
  if (!description) return { description };
  const m = description.match(TAG_RE);
  if (!m) return { description };
  const cat = getCategoryBySlug(m[1].toLowerCase());
  return { category: cat, description: description.replace(TAG_RE, '') };
};
