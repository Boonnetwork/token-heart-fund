import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext";

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

// Placeholder ABIs - replace addresses after deploying contracts
const TOKEN_ABI =
  '[{"inputs":[],"name":"name","outputs":[{"type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"account","type":"address"}],"name":"balanceOf","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"name":"approve","outputs":[{"type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"}]';

const CROWDFUNDING_ABI =
  '[{"inputs":[],"name":"campaignCount","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_campaignId","type":"uint256"}],"name":"getCampaign","outputs":[{"components":[{"name":"id","type":"uint256"},{"name":"creator","type":"address"},{"name":"title","type":"string"},{"name":"description","type":"string"},{"name":"imageUrl","type":"string"},{"name":"goalAmount","type":"uint256"},{"name":"raisedAmount","type":"uint256"},{"name":"deadline","type":"uint256"},{"name":"createdAt","type":"uint256"},{"name":"claimed","type":"bool"},{"name":"cancelled","type":"bool"},{"name":"donorCount","type":"uint256"}],"type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_title","type":"string"},{"name":"_description","type":"string"},{"name":"_imageUrl","type":"string"},{"name":"_goalAmount","type":"uint256"},{"name":"_durationDays","type":"uint256"}],"name":"createCampaign","outputs":[{"type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_campaignId","type":"uint256"},{"name":"_amount","type":"uint256"}],"name":"donate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_campaignId","type":"uint256"}],"name":"claimFunds","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_campaignId","type":"uint256"}],"name":"claimRefund","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_campaignId","type":"uint256"}],"name":"cancelCampaign","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_campaignId","type":"uint256"}],"name":"getCampaignDonations","outputs":[{"components":[{"name":"donor","type":"address"},{"name":"amount","type":"uint256"},{"name":"timestamp","type":"uint256"}],"type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_campaignId","type":"uint256"},{"name":"_donor","type":"address"}],"name":"getDonorContribution","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_creator","type":"address"}],"name":"getCampaignsByCreator","outputs":[{"type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_donor","type":"address"}],"name":"getCampaignsByDonor","outputs":[{"type":"uint256[]"}],"stateMutability":"view","type":"function"}]';

const defaultSettings: ContractSettings = {
  tokenAddress: "0x732e22E963C914756Bf2B3401249A43d733A6A3b", // CFI Token on BSC Testnet
  tokenABI: CFI_ABI,
  crowdfundingAddress: "", // Deploy CrowdFunding.sol and add address here
  crowdfundingABI: CROWDFUNDING_ABI,
};

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const ContractProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { signer, provider, address, isConnected } = useWallet();
  const [settings, setSettings] = useState<ContractSettings>(defaultSettings);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [crowdfundingContract, setCrowdfundingContract] = useState<ethers.Contract | null>(null);
  const [tokenBalance, setTokenBalance] = useState("0");
  const [tokenSymbol, setTokenSymbol] = useState("TOKEN");
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("contractSettings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Error parsing saved settings:", e);
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
      console.error("Error initializing contracts:", error);
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
        console.error("Error fetching token info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenInfo();
  }, [tokenContract, address]);

  const updateSettings = (newSettings: ContractSettings) => {
    setSettings(newSettings);
    localStorage.setItem("contractSettings", JSON.stringify(newSettings));
  };

  const approveTokens = async (amount: string): Promise<boolean> => {
    if (!tokenContract || !settings.crowdfundingAddress) return false;

    try {
      const amountWei = ethers.utils.parseUnits(amount, tokenDecimals);
      const tx = await tokenContract.approve(settings.crowdfundingAddress, amountWei);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error approving tokens:", error);
      return false;
    }
  };

  const getAllowance = async (): Promise<string> => {
    if (!tokenContract || !address || !settings.crowdfundingAddress) return "0";

    try {
      const allowance = await tokenContract.allowance(address, settings.crowdfundingAddress);
      return ethers.utils.formatUnits(allowance, tokenDecimals);
    } catch (error) {
      console.error("Error getting allowance:", error);
      return "0";
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
    throw new Error("useContracts must be used within a ContractProvider");
  }
  return context;
};
