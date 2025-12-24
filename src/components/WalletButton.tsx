import React, { useState } from 'react';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useWallet, BSC_TESTNET_CHAIN_ID } from '@/contexts/WalletContext';
import { useContracts } from '@/contexts/ContractContext';
import { toast } from 'sonner';

// Wallet icons as simple components
const MetaMaskIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.5 3L13 9L14.5 5.5L21.5 3Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.5 3L10.9 9.1L9.5 5.5L2.5 3Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 16.5L16.5 20L21 21.5L22.5 16.5H18.5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1.5 16.5L3 21.5L7.5 20L5.5 16.5H1.5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 10.5L6 12.5L10.5 12.75L10.25 8L7.5 10.5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.5 10.5L13.75 7.9L13.5 12.75L18 12.5L16.5 10.5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 20L10 18.5L7.75 16.5L7.5 20Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 18.5L16.5 20L16.25 16.5L14 18.5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WalletConnectIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.5 9C9.5 6 14.5 6 17.5 9L18 9.5C18.2 9.7 18.2 10 18 10.2L16.8 11.4C16.7 11.5 16.5 11.5 16.4 11.4L15.7 10.7C13.6 8.6 10.4 8.6 8.3 10.7L7.5 11.5C7.4 11.6 7.2 11.6 7.1 11.5L5.9 10.3C5.7 10.1 5.7 9.8 5.9 9.6L6.5 9ZM20 11.5L21.1 12.6C21.3 12.8 21.3 13.1 21.1 13.3L15.8 18.6C15.6 18.8 15.3 18.8 15.1 18.6L11.4 14.9C11.35 14.85 11.25 14.85 11.2 14.9L7.5 18.6C7.3 18.8 7 18.8 6.8 18.6L1.5 13.3C1.3 13.1 1.3 12.8 1.5 12.6L2.6 11.5C2.8 11.3 3.1 11.3 3.3 11.5L7 15.2C7.05 15.25 7.15 15.25 7.2 15.2L10.9 11.5C11.1 11.3 11.4 11.3 11.6 11.5L15.3 15.2C15.35 15.25 15.45 15.25 15.5 15.2L19.2 11.5C19.4 11.3 19.7 11.3 19.9 11.5L20 11.5Z" fill="#3B99FC"/>
  </svg>
);

export const WalletButton: React.FC = () => {
  const { 
    address, 
    isConnected, 
    isConnecting, 
    chainId, 
    balance,
    connectWallet, 
    disconnectWallet,
    switchToBSCTestnet 
  } = useWallet();
  const { tokenBalance, tokenSymbol } = useContracts();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const isWrongNetwork = isConnected && chainId !== BSC_TESTNET_CHAIN_ID;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  const openExplorer = () => {
    if (address) {
      window.open(`https://testnet.bscscan.com/address/${address}`, '_blank');
    }
  };

  const handleConnectMetaMask = async () => {
    setShowWalletModal(false);
    await connectWallet('metamask');
  };

  const handleConnectWalletConnect = async () => {
    setShowWalletModal(false);
    await connectWallet('walletconnect');
  };

  if (!isConnected) {
    return (
      <>
        <Button 
          variant="wallet" 
          size="lg"
          onClick={() => setShowWalletModal(true)}
          disabled={isConnecting}
          className="gap-2"
        >
          <Wallet className="w-5 h-5" />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>

        <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>
                Choose your preferred wallet to connect to the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button 
                variant="outline" 
                className="w-full h-16 justify-start gap-4 text-left"
                onClick={handleConnectMetaMask}
                disabled={isConnecting}
              >
                <MetaMaskIcon />
                <div>
                  <div className="font-semibold">MetaMask</div>
                  <div className="text-xs text-muted-foreground">Connect using browser wallet</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-16 justify-start gap-4 text-left"
                onClick={handleConnectWalletConnect}
                disabled={isConnecting}
              >
                <WalletConnectIcon />
                <div>
                  <div className="font-semibold">WalletConnect</div>
                  <div className="text-xs text-muted-foreground">Scan with mobile wallet</div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (isWrongNetwork) {
    return (
      <Button 
        variant="destructive" 
        size="lg"
        onClick={switchToBSCTestnet}
        className="gap-2"
      >
        <AlertTriangle className="w-5 h-5" />
        Switch to BSC Testnet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="glass" size="lg" className="gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
          <span className="font-mono">{formatAddress(address!)}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-card border-border">
        <DropdownMenuLabel className="text-muted-foreground text-xs">Connected Wallet</DropdownMenuLabel>
        <div className="px-2 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">BNB Balance</span>
            <span className="font-mono text-foreground">{parseFloat(balance).toFixed(4)} tBNB</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Token Balance</span>
            <span className="font-mono text-primary">{parseFloat(tokenBalance).toFixed(2)} {tokenSymbol}</span>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          <Copy className="w-4 h-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openExplorer} className="cursor-pointer">
          <ExternalLink className="w-4 h-4 mr-2" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem onClick={disconnectWallet} className="cursor-pointer text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
