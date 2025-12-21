import React from 'react';
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
import { useWallet, BSC_TESTNET_CHAIN_ID } from '@/contexts/WalletContext';
import { useContracts } from '@/contexts/ContractContext';
import { toast } from 'sonner';

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

  if (!isConnected) {
    return (
      <Button 
        variant="wallet" 
        size="lg"
        onClick={connectWallet}
        disabled={isConnecting}
        className="gap-2"
      >
        <Wallet className="w-5 h-5" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
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
