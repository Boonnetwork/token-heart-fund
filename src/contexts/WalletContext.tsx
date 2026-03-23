import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  useWeb3ModalProvider,
  useWeb3ModalAccount,
  useDisconnect,
  useSwitchNetwork,
  useWeb3Modal
} from '@web3modal/ethers5/react';
import { toast } from 'sonner';

import { WALLETCONNECT_PROJECT_ID } from '@/lib/web3modal';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  balance: string;
  connectWallet: () => void;
  disconnectWallet: () => void;
  switchToBSCTestnet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const BSC_TESTNET_CHAIN_ID = 97;

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);

  const { walletProvider } = useWeb3ModalProvider();
  const { address, isConnected, chainId } = useWeb3ModalAccount();
  const { disconnect } = useDisconnect();
  const { switchNetwork } = useSwitchNetwork();
  const { open } = useWeb3Modal();

  const updateBalance = useCallback(async (addr: string, prov: ethers.providers.Web3Provider) => {
    try {
      const bal = await prov.getBalance(addr);
      setBalance(ethers.utils.formatEther(bal));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (address && provider) await updateBalance(address, provider);
  }, [address, provider, updateBalance]);

  useEffect(() => {
    if (walletProvider && isConnected && address) {
      const web3Provider = new ethers.providers.Web3Provider(walletProvider);
      setProvider(web3Provider);
      setSigner(web3Provider.getSigner());
      updateBalance(address, web3Provider);
    } else {
      setProvider(null);
      setSigner(null);
      setBalance('0');
    }
  }, [walletProvider, isConnected, address, updateBalance]);

  const preflightWalletList = useCallback(async () => {
    try {
      const res = await fetch('https://api.web3modal.com/getWallets?page=1&entries=1', {
        headers: {
          'x-project-id': WALLETCONNECT_PROJECT_ID,
          'x-sdk-type': 'w3m',
          'x-sdk-version': 'react-ethers5-4.2.3',
        },
      });

      if (res.status === 403) {
        toast.error('WalletConnect is blocked for this Project ID / domain', {
          description:
            'Fix: use your own WalletConnect Cloud Project ID + allowlist this domain. Then set VITE_WALLETCONNECT_PROJECT_ID.',
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const connectWallet = useCallback(() => {
    setIsConnecting(true);
    preflightWalletList()
      .finally(() => open())
      .finally(() => setIsConnecting(false));
  }, [open, preflightWalletList]);

  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const switchToBSCTestnet = useCallback(async () => {
    try {
      await switchNetwork(BSC_TESTNET_CHAIN_ID);
    } catch (error) {
      console.error('Error switching network:', error);
    }
  }, [switchNetwork]);

  return (
    <WalletContext.Provider
      value={{
        address: address || null,
        isConnected,
        isConnecting,
        chainId: chainId || null,
        provider,
        signer,
        balance,
        connectWallet,
        disconnectWallet,
        switchToBSCTestnet,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a WalletProvider');
  return context;
};
