import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Twitter, Github, MessageCircle, ExternalLink, Send } from 'lucide-react';

// Social links - can be customized
const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/chainfunder',
  github: 'https://github.com/chainfunder',
  telegram: 'https://t.me/chainfunder',
  discord: 'https://discord.gg/chainfunder',
};

export const Footer = forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer ref={ref} className="bg-card/50 border-t border-border/50 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <img src="/chainfunder.png" alt="ChainFunder" className="w-6 h-6" />
              </div>
              <span className="font-display text-xl font-bold gradient-text">
                ChainFunder
              </span>
            </Link>
            <p className="text-muted-foreground max-w-md mb-6">
              Decentralized crowdfunding powered by blockchain. Fund innovative projects with 
              transparency, security, and trust built on BNB Smart Chain.
            </p>
            <div className="flex gap-4">
              <a 
                href={SOCIAL_LINKS.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Follow us on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href={SOCIAL_LINKS.github} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                title="View on GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href={SOCIAL_LINKS.telegram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Join our Telegram"
              >
                <Send className="w-5 h-5" />
              </a>
              <a 
                href={SOCIAL_LINKS.discord} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Join our Discord"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/campaigns" className="text-muted-foreground hover:text-primary transition-colors">
                  Browse Campaigns
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-muted-foreground hover:text-primary transition-colors">
                  Start a Campaign
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog & News
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://testnet.bscscan.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  BSC Testnet Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href={SOCIAL_LINKS.github}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  Documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://testnet.bscscan.com"
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  Smart Contracts
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} ChainFunder. All rights reserved.
          </p>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            BSC Testnet
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
