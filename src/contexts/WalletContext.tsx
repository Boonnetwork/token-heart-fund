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
const BSC_TESTNET_RPC = 'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
const readOnlyProvider = new ethers.providers.JsonRpcProvider(BSC_TESTNET_RPC);

type InjectedEthereumProvider = {
  isMetaMask?: boolean;
  providers?: InjectedEthereumProvider[];
  request?: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
};

const MOBILE_DEVICE_REGEX = /android|iphone|ipad|ipod/i;

const getInjectedProvider = (): InjectedEthereumProvider | undefined => {
  if (typeof window === 'undefined') return undefined;

  const ethereum = (window as Window & { ethereum?: InjectedEthereumProvider }).ethereum;
  if (!ethereum) return undefined;

  if (ethereum.providers?.length) {
    return ethereum.providers.find((provider) => provider.isMetaMask) ?? ethereum.providers[0];
  }

  return ethereum;
};

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [fallbackAddress, setFallbackAddress] = useState<string | null>(null);
  const [fallbackChainId, setFallbackChainId] = useState<number | null>(null);
  const balanceRetryRef = useRef<NodeJS.Timeout | null>(null);
  const injectedProviderRef = useRef<InjectedEthereumProvider | null>(null);
  const injectedListenersRef = useRef<{
    accountsChanged?: (accounts: string[]) => void;
    chainChanged?: (chainId: string | number) => void;
  }>({});

  const { walletProvider } = useWeb3ModalProvider();
  const { address, isConnected, chainId } = useWeb3ModalAccount();
  const { disconnect } = useDisconnect();
  const { switchNetwork } = useSwitchNetwork();
  const { open } = useWeb3Modal();

  const activeAddress = address || fallbackAddress;
  const activeChainId = chainId || fallbackChainId;
  const activeIsConnected = isConnected || !!fallbackAddress;

  const clearInjectedListeners = useCallback(() => {
    const injectedProvider = injectedProviderRef.current;
    const { accountsChanged, chainChanged } = injectedListenersRef.current;

    if (injectedProvider?.removeListener && accountsChanged) {
      injectedProvider.removeListener('accountsChanged', accountsChanged);
    }

    if (injectedProvider?.removeListener && chainChanged) {
      injectedProvider.removeListener('chainChanged', chainChanged);
    }

    injectedListenersRef.current = {};
    injectedProviderRef.current = null;
  }, []);

  const clearFallbackSession = useCallback(() => {
    clearInjectedListeners();
    setFallbackAddress(null);
    setFallbackChainId(null);
  }, [clearInjectedListeners]);

  const updateBalance = useCallback(async (addr: string, _prov?: ethers.providers.Web3Provider) => {
    try {
      const bal = await readOnlyProvider.getBalance(addr);
      setBalance(ethers.utils.formatEther(bal));
      return true;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return false;
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (activeAddress && provider) await updateBalance(activeAddress, provider);
  }, [activeAddress, provider, updateBalance]);

  const connectInjectedWallet = useCallback(async (injectedProvider: InjectedEthereumProvider, requestAccounts = true) => {
    if (!injectedProvider.request) {
      throw new Error('No injected wallet provider available');
    }

    if (requestAccounts) {
      await injectedProvider.request({ method: 'eth_requestAccounts' });
    }

    const web3Provider = new ethers.providers.Web3Provider(
      injectedProvider as ethers.providers.ExternalProvider,
      'any'
    );

    const [accounts, network] = await Promise.all([
      web3Provider.listAccounts(),
      web3Provider.getNetwork(),
    ]);

    if (!accounts.length) {
      throw new Error('No wallet account returned');
    }

    clearInjectedListeners();

    const handleAccountsChanged = (accountsChanged: string[]) => {
      if (!accountsChanged.length) {
        setProvider(null);
        setSigner(null);
        setBalance('0');
        clearFallbackSession();
        return;
      }

      setFallbackAddress(accountsChanged[0]);
      updateBalance(accountsChanged[0], web3Provider).catch(() => undefined);
    };

    const handleChainChanged = (nextChainId: string | number) => {
      const parsedChainId = typeof nextChainId === 'string'
        ? parseInt(nextChainId, 16)
        : Number(nextChainId);

      setFallbackChainId(Number.isNaN(parsedChainId) ? null : parsedChainId);
      updateBalance(accounts[0], web3Provider).catch(() => undefined);
    };

    injectedProvider.on?.('accountsChanged', handleAccountsChanged);
    injectedProvider.on?.('chainChanged', handleChainChanged);

    injectedProviderRef.current = injectedProvider;
    injectedListenersRef.current = {
      accountsChanged: handleAccountsChanged,
      chainChanged: handleChainChanged,
    };

    setProvider(web3Provider);
    setSigner(web3Provider.getSigner());
    setFallbackAddress(accounts[0]);
    setFallbackChainId(network.chainId);
    await updateBalance(accounts[0], web3Provider);
  }, [clearFallbackSession, clearInjectedListeners, updateBalance]);

  useEffect(() => {
    if (walletProvider && isConnected && address) {
      const web3Provider = new ethers.providers.Web3Provider(walletProvider, 'any');
      setProvider(web3Provider);
      setSigner(web3Provider.getSigner());

      if (fallbackAddress || fallbackChainId) {
        clearFallbackSession();
      }
    } else if (!fallbackAddress) {
      setProvider(null);
      setSigner(null);
    }
  }, [walletProvider, isConnected, address, fallbackAddress, fallbackChainId, clearFallbackSession, clearInjectedListeners]);

  useEffect(() => {
    if (isConnected || fallbackAddress) return;

    const injectedProvider = getInjectedProvider();
    if (!injectedProvider?.request) return;

    let cancelled = false;

    const restoreInjectedSession = async () => {
      try {
        const accounts = await injectedProvider.request({ method: 'eth_accounts' }) as string[];
        if (cancelled || !accounts?.length) return;
        await connectInjectedWallet(injectedProvider, false);
      } catch {
        // Silent restore should never trigger visible errors or permission prompts.
      }
    };

    restoreInjectedSession();

    return () => { cancelled = true; };
  }, [connectInjectedWallet, fallbackAddress, isConnected]);

  useEffect(() => {
    if (balanceRetryRef.current) {
      clearTimeout(balanceRetryRef.current);
      balanceRetryRef.current = null;
    }

    if (activeAddress && provider && activeIsConnected) {
      updateBalance(activeAddress, provider).then((success) => {
        if (!success) {
          balanceRetryRef.current = setTimeout(() => {
            updateBalance(activeAddress, provider);
          }, 1500);
        }
      });
    } else {
      setBalance('0');
    }

    return () => {
      if (balanceRetryRef.current) clearTimeout(balanceRetryRef.current);
    };
  }, [activeAddress, activeChainId, activeIsConnected, provider, updateBalance]);

  const connectWallet = useCallback(async () => {
    if (isConnecting || activeIsConnected) return;

    setIsConnecting(true);

    try {
      const injectedProvider = getInjectedProvider();
      if (injectedProvider?.request) {
        await connectInjectedWallet(injectedProvider);
        return;
      }

      if (MOBILE_DEVICE_REGEX.test(navigator.userAgent)) {
        toast.info('Open ChainFunder inside your wallet browser to connect without repeated app prompts.');
        return;
      }

      await open({ view: 'Connect' });
    } catch (err: any) {
      if (err?.code === 4001) {
        toast.error('Wallet connection was cancelled');
      } else {
        console.error('Error connecting wallet:', err);
        toast.error('Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [activeIsConnected, connectInjectedWallet, isConnecting, open]);

  const disconnectWallet = useCallback(() => {
    clearFallbackSession();
    setProvider(null);
    setSigner(null);
    setBalance('0');
    disconnect().catch((error) => {
      console.error('Error disconnecting wallet:', error);
    });
  }, [clearFallbackSession, disconnect]);

  const switchToBSCTestnet = useCallback(async () => {
    try {
      const externalProvider = provider?.provider as InjectedEthereumProvider | undefined;

      if (externalProvider?.request) {
        await externalProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.utils.hexValue(BSC_TESTNET_CHAIN_ID) }],
        });
        setFallbackChainId(BSC_TESTNET_CHAIN_ID);
        return;
      }

      await switchNetwork(BSC_TESTNET_CHAIN_ID);
    } catch (error: any) {
      if (error?.code === 4902) {
        const externalProvider = provider?.provider as InjectedEthereumProvider | undefined;
        if (externalProvider?.request) {
          try {
            await externalProvider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: ethers.utils.hexValue(BSC_TESTNET_CHAIN_ID),
                chainName: 'BNB Smart Chain Testnet',
                nativeCurrency: {
                  name: 'tBNB',
                  symbol: 'tBNB',
                  decimals: 18,
                },
                rpcUrls: ['https://data-seed-prebsc-1-s1.bnbchain.org:8545'],
                blockExplorerUrls: ['https://testnet.bscscan.com'],
              }],
            });
            setFallbackChainId(BSC_TESTNET_CHAIN_ID);
            return;
          } catch (addChainError) {
            console.error('Error adding BSC Testnet:', addChainError);
          }
        }
      }

      console.error('Error switching network:', error);
    }
  }, [provider, switchNetwork]);

  useEffect(() => () => clearInjectedListeners(), [clearInjectedListeners]);

  return (
    <WalletContext.Provider
      value={{
        address: activeAddress,
        isConnected: activeIsConnected,
        isConnecting,
        chainId: activeChainId,
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
