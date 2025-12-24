import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  balance: string;
  connectWallet: (walletType?: 'metamask' | 'walletconnect') => Promise<void>;
  disconnectWallet: () => void;
  switchToBSCTestnet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const BSC_TESTNET_CHAIN_ID = 97;
const BSC_TESTNET_CONFIG = {
  chainId: '0x61',
  chainName: 'BNB Smart Chain Testnet',
  nativeCurrency: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrls: ['https://data-seed-prebsc-1-s1.bnbchain.org:8545'],
  blockExplorerUrls: ['https://testnet.bscscan.com'],
};

// WalletConnect project ID - you should replace this with your own
const WALLETCONNECT_PROJECT_ID = '2f05ae7f1116030f0e2dc533bf41ec08';

const getEthereum = () => {
  if (typeof window !== 'undefined') {
    return window.ethereum;
  }
  return undefined;
};

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [balance, setBalance] = useState('0');
  const [walletConnectProvider, setWalletConnectProvider] = useState<any>(null);

  const updateBalance = async (addr: string, prov: ethers.providers.Web3Provider) => {
    try {
      const bal = await prov.getBalance(addr);
      setBalance(ethers.utils.formatEther(bal));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const refreshBalance = useCallback(async () => {
    if (address && provider) {
      await updateBalance(address, provider);
    }
  }, [address, provider]);

  const connectWallet = async (walletType: 'metamask' | 'walletconnect' = 'metamask') => {
    setIsConnecting(true);
    
    try {
      if (walletType === 'walletconnect') {
        // Dynamic import for WalletConnect
        const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
        
        const wcProvider = await EthereumProvider.init({
          projectId: WALLETCONNECT_PROJECT_ID,
          chains: [BSC_TESTNET_CHAIN_ID],
          showQrModal: true,
          optionalChains: [56, 1], // BSC Mainnet, Ethereum Mainnet
          rpcMap: {
            97: 'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
            56: 'https://bsc-dataseed.binance.org/',
            1: 'https://mainnet.infura.io/v3/',
          },
        });
        
        await wcProvider.connect();
        setWalletConnectProvider(wcProvider);
        
        const web3Provider = new ethers.providers.Web3Provider(wcProvider);
        const web3Signer = web3Provider.getSigner();
        const userAddress = await web3Signer.getAddress();
        const network = await web3Provider.getNetwork();

        setProvider(web3Provider);
        setSigner(web3Signer);
        setAddress(userAddress);
        setChainId(network.chainId);
        setIsConnected(true);

        await updateBalance(userAddress, web3Provider);
        localStorage.setItem('walletConnected', 'walletconnect');

        // WalletConnect event listeners
        wcProvider.on('accountsChanged', handleAccountsChanged);
        wcProvider.on('chainChanged', handleChainChanged);
        wcProvider.on('disconnect', () => disconnectWallet());
        
      } else {
        // MetaMask connection
        const ethereum = getEthereum();
        if (!ethereum) {
          window.open('https://metamask.io/download/', '_blank');
          return;
        }

        const web3Provider = new ethers.providers.Web3Provider(ethereum as ethers.providers.ExternalProvider);
        await web3Provider.send('eth_requestAccounts', []);
        
        const web3Signer = web3Provider.getSigner();
        const userAddress = await web3Signer.getAddress();
        const network = await web3Provider.getNetwork();

        setProvider(web3Provider);
        setSigner(web3Signer);
        setAddress(userAddress);
        setChainId(network.chainId);
        setIsConnected(true);

        await updateBalance(userAddress, web3Provider);
        localStorage.setItem('walletConnected', 'metamask');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = useCallback(() => {
    if (walletConnectProvider) {
      walletConnectProvider.disconnect();
      setWalletConnectProvider(null);
    }
    setAddress(null);
    setIsConnected(false);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setBalance('0');
    localStorage.removeItem('walletConnected');
  }, [walletConnectProvider]);

  const switchToBSCTestnet = async () => {
    const ethereum = getEthereum();
    if (!ethereum?.request && !walletConnectProvider) return;

    const requestProvider = walletConnectProvider || ethereum;
    
    try {
      await requestProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_TESTNET_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await requestProvider.request({
            method: 'wallet_addEthereumChain',
            params: [BSC_TESTNET_CONFIG],
          });
        } catch (addError) {
          console.error('Error adding BSC Testnet:', addError);
        }
      }
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else if (accounts[0] !== address) {
      setAddress(accounts[0]);
      if (provider) {
        updateBalance(accounts[0], provider);
      }
    }
  };

  const handleChainChanged = (chainIdHex: string) => {
    const newChainId = parseInt(chainIdHex, 16);
    setChainId(newChainId);
    window.location.reload();
  };

  // Listen for account and chain changes
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    ethereum.on?.('accountsChanged', handleAccountsChanged);
    ethereum.on?.('chainChanged', handleChainChanged);

    // Auto-reconnect if previously connected
    const wasConnected = localStorage.getItem('walletConnected');
    if (wasConnected === 'metamask') {
      connectWallet('metamask');
    } else if (wasConnected === 'walletconnect') {
      // WalletConnect auto-reconnect happens through stored session
      connectWallet('walletconnect').catch(() => {
        localStorage.removeItem('walletConnected');
      });
    }

    return () => {
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      ethereum.removeListener?.('chainChanged', handleChainChanged);
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isConnecting,
        chainId,
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
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
