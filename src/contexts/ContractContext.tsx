import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './WalletContext';

interface ContractSettings {
  tokenAddress: string;
  tokenABI: string;
  crowdfundingAddress: string;
  crowdfundingABI: string;
}

interface ContractContextType {
  settings: ContractSettings;
  updateSettings: (newSettings: ContractSettings) => void;
  tokenContract: ethers.Contract | null;
  crowdfundingContract: ethers.Contract | null;
  tokenBalance: string;
  tokenSymbol: string;
  tokenDecimals: number;
  isLoading: boolean;
  approveTokens: (amount: string) => Promise<boolean>;
  getAllowance: () => Promise<string>;
}

const defaultSettings: ContractSettings = {
  tokenAddress: '',
  tokenABI: '[]',
  crowdfundingAddress: '',
  crowdfundingABI: '[]',
};

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const ContractProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { signer, provider, address, isConnected } = useWallet();
  const [settings, setSettings] = useState<ContractSettings>(defaultSettings);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [crowdfundingContract, setCrowdfundingContract] = useState<ethers.Contract | null>(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenSymbol, setTokenSymbol] = useState('TOKEN');
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('contractSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Error parsing saved settings:', e);
      }
    }
  }, []);

  // Initialize contracts when settings or signer changes
  useEffect(() => {
    if (!signer || !settings.tokenAddress || !settings.crowdfundingAddress) {
      setTokenContract(null);
      setCrowdfundingContract(null);
      return;
    }

    try {
      const tokenAbi = JSON.parse(settings.tokenABI);
      const crowdAbi = JSON.parse(settings.crowdfundingABI);

      if (tokenAbi.length > 0 && settings.tokenAddress) {
        const token = new ethers.Contract(settings.tokenAddress, tokenAbi, signer);
        setTokenContract(token);
      }

      if (crowdAbi.length > 0 && settings.crowdfundingAddress) {
        const crowd = new ethers.Contract(settings.crowdfundingAddress, crowdAbi, signer);
        setCrowdfundingContract(crowd);
      }
    } catch (error) {
      console.error('Error initializing contracts:', error);
    }
  }, [signer, settings]);

  // Fetch token info
  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!tokenContract || !address) return;

      setIsLoading(true);
      try {
        const [symbol, decimals, balance] = await Promise.all([
          tokenContract.symbol(),
          tokenContract.decimals(),
          tokenContract.balanceOf(address),
        ]);

        setTokenSymbol(symbol);
        setTokenDecimals(decimals);
        setTokenBalance(ethers.utils.formatUnits(balance, decimals));
      } catch (error) {
        console.error('Error fetching token info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenInfo();
  }, [tokenContract, address]);

  const updateSettings = (newSettings: ContractSettings) => {
    setSettings(newSettings);
    localStorage.setItem('contractSettings', JSON.stringify(newSettings));
  };

  const approveTokens = async (amount: string): Promise<boolean> => {
    if (!tokenContract || !settings.crowdfundingAddress) return false;

    try {
      const amountWei = ethers.utils.parseUnits(amount, tokenDecimals);
      const tx = await tokenContract.approve(settings.crowdfundingAddress, amountWei);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error approving tokens:', error);
      return false;
    }
  };

  const getAllowance = async (): Promise<string> => {
    if (!tokenContract || !address || !settings.crowdfundingAddress) return '0';

    try {
      const allowance = await tokenContract.allowance(address, settings.crowdfundingAddress);
      return ethers.utils.formatUnits(allowance, tokenDecimals);
    } catch (error) {
      console.error('Error getting allowance:', error);
      return '0';
    }
  };

  return (
    <ContractContext.Provider
      value={{
        settings,
        updateSettings,
        tokenContract,
        crowdfundingContract,
        tokenBalance,
        tokenSymbol,
        tokenDecimals,
        isLoading,
        approveTokens,
        getAllowance,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContracts = () => {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContracts must be used within a ContractProvider');
  }
  return context;
};
