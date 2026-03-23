import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet, BSC_TESTNET_CHAIN_ID } from '@/contexts/WalletContext';

export const NetworkWarning: React.FC = () => {
  const { isConnected, chainId, switchToBSCTestnet } = useWallet();

  const isWrongNetwork = isConnected && chainId !== BSC_TESTNET_CHAIN_ID;

  if (!isWrongNetwork) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">
            You are connected to the wrong network. Please switch to BSC Testnet to use this platform.
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={switchToBSCTestnet}
          className="shrink-0 border-destructive-foreground/50 text-destructive-foreground hover:bg-destructive-foreground/10"
        >
          Switch Network
        </Button>
      </div>
    </div>
  );
};
