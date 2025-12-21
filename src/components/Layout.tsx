import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  showFooter?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, className, showFooter = true }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={cn("flex-1 pt-16 lg:pt-20", className)}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};
