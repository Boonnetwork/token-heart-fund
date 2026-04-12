import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import {
  useWeb3ModalProvider,
  useWeb3ModalAccount,
  useDisconnect,
  useSwitchNetwork,
  useWeb3Modal
} from '@web3modal/ethers5/react';
import { toast } from 'sonner';

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
  const balanceRetryRef = useRef<NodeJS.Timeout | null>(null);

  const { walletProvider } = useWeb3ModalProvider();
  const { address, isConnected, chainId } = useWeb3ModalAccount();
  const { disconnect } = useDisconnect();
  const { switchNetwork } = useSwitchNetwork();
  const { open } = useWeb3Modal();

  const updateBalance = useCallback(async (addr: string, prov: ethers.providers.Web3Provider) => {
    try {
      const bal = await prov.getBalance(addr);
      setBalance(ethers.utils.formatEther(bal));
      return true;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return false;
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (address && provider) await updateBalance(address, provider);
  }, [address, provider, updateBalance]);

  useEffect(() => {
    // Clear any pending retry
    if (balanceRetryRef.current) {
      clearTimeout(balanceRetryRef.current);
      balanceRetryRef.current = null;
    }

    if (walletProvider && isConnected && address) {
      const web3Provider = new ethers.providers.Web3Provider(walletProvider);
      setProvider(web3Provider);
      setSigner(web3Provider.getSigner());
      
      // Fetch balance immediately, retry once if it fails (provider may not be ready)
      updateBalance(address, web3Provider).then((success) => {
        if (!success) {
          balanceRetryRef.current = setTimeout(() => {
            updateBalance(address, web3Provider);
          }, 1500);
        }
      });
    } else {
      setProvider(null);
      setSigner(null);
      setBalance('0');
    }

    return () => {
      if (balanceRetryRef.current) clearTimeout(balanceRetryRef.current);
    };
  }, [walletProvider, isConnected, address, chainId, updateBalance]);

  const connectWallet = useCallback(() => {
    setIsConnecting(true);
    open()
      .catch((err) => {
        console.error('Error opening wallet modal:', err);
        toast.error('Failed to open wallet connection');
      })
      .finally(() => setIsConnecting(false));
  }, [open]);

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
