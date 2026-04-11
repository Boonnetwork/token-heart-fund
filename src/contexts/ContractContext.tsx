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
  refreshTokenBalance: () => Promise<void>;
}

// ERC20 Token ABI (standard functions)
const TOKEN_ABI =
  '[{"inputs":[],"name":"name","outputs":[{"type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"account","type":"address"}],"name":"balanceOf","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"name":"approve","outputs":[{"type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"}]';

// New CrowdFunding ABI with all features
const CROWDFUNDING_ABI = '[{"inputs":[{"internalType":"address","name":"_cfi","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"SafeERC20FailedOperation","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"campaignId","type":"uint256"},{"indexed":true,"internalType":"address","name":"creator","type":"address"}],"name":"CampaignCancelled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"campaignId","type":"uint256"},{"indexed":true,"internalType":"address","name":"creator","type":"address"},{"indexed":false,"internalType":"string","name":"title","type":"string"},{"indexed":false,"internalType":"uint256","name":"goalAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"CampaignCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"campaignId","type":"uint256"},{"indexed":true,"internalType":"address","name":"donor","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"totalRaised","type":"uint256"}],"name":"DonationMade","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"campaignId","type":"uint256"},{"indexed":true,"internalType":"address","name":"creator","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"platformFee","type":"uint256"}],"name":"FundsClaimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"oldFee","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newFee","type":"uint256"}],"name":"PlatformFeeUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"campaignId","type":"uint256"},{"indexed":true,"internalType":"address","name":"donor","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"RefundClaimed","type":"event"},{"inputs":[],"name":"BASIS_POINTS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_FEE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"campaignCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"campaignDonations","outputs":[{"internalType":"address","name":"donor","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"campaigns","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"creator","type":"address"},{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"string","name":"imageUrl","type":"string"},{"internalType":"uint256","name":"goalAmount","type":"uint256"},{"internalType":"uint256","name":"raisedAmount","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"createdAt","type":"uint256"},{"internalType":"bool","name":"claimed","type":"bool"},{"internalType":"bool","name":"cancelled","type":"bool"},{"internalType":"uint256","name":"donorCount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"}],"name":"cancelCampaign","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"cfi","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"}],"name":"claimFunds","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"}],"name":"claimRefund","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_title","type":"string"},{"internalType":"string","name":"_description","type":"string"},{"internalType":"string","name":"_imageUrl","type":"string"},{"internalType":"uint256","name":"_goalAmount","type":"uint256"},{"internalType":"uint256","name":"_durationDays","type":"uint256"}],"name":"createCampaign","outputs":[{"internalType":"uint256","name":"campaignId","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"creatorCampaigns","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"donate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"donorCampaigns","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"name":"donorContributions","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"emergencyWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_offset","type":"uint256"},{"internalType":"uint256","name":"_limit","type":"uint256"}],"name":"getActiveCampaigns","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"creator","type":"address"},{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"string","name":"imageUrl","type":"string"},{"internalType":"uint256","name":"goalAmount","type":"uint256"},{"internalType":"uint256","name":"raisedAmount","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"createdAt","type":"uint256"},{"internalType":"bool","name":"claimed","type":"bool"},{"internalType":"bool","name":"cancelled","type":"bool"},{"internalType":"uint256","name":"donorCount","type":"uint256"}],"internalType":"struct CrowdFunding.Campaign[]","name":"campaignList","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"}],"name":"getCampaign","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"creator","type":"address"},{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"string","name":"imageUrl","type":"string"},{"internalType":"uint256","name":"goalAmount","type":"uint256"},{"internalType":"uint256","name":"raisedAmount","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"createdAt","type":"uint256"},{"internalType":"bool","name":"claimed","type":"bool"},{"internalType":"bool","name":"cancelled","type":"bool"},{"internalType":"uint256","name":"donorCount","type":"uint256"}],"internalType":"struct CrowdFunding.Campaign","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"}],"name":"getCampaignDonations","outputs":[{"components":[{"internalType":"address","name":"donor","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"internalType":"struct CrowdFunding.Donation[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_creator","type":"address"}],"name":"getCampaignsByCreator","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_donor","type":"address"}],"name":"getCampaignsByDonor","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"},{"internalType":"address","name":"_donor","type":"address"}],"name":"getDonorContribution","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"}],"name":"isCampaignActive","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"platformFeePercent","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_newFeePercent","type":"uint256"}],"name":"updatePlatformFee","outputs":[],"stateMutability":"nonpayable","type":"function"}]';

const BSC_TESTNET_RPC = 'https://data-seed-prebsc-1-s1.bnbchain.org:8545';

const defaultSettings: ContractSettings = {
  tokenAddress: "0x732e22E963C914756Bf2B3401249A43d733A6A3b",
  tokenABI: TOKEN_ABI,
  crowdfundingAddress: "0x66aB9BdBC16344B159a84A284c37b515741e3B60",
  crowdfundingABI: CROWDFUNDING_ABI,
};

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const ContractProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { signer, provider, address, isConnected } = useWallet();
  const [settings, setSettings] = useState<ContractSettings>(defaultSettings);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [crowdfundingContract, setCrowdfundingContract] = useState<ethers.Contract | null>(null);
  const [tokenBalance, setTokenBalance] = useState("0");
  const [tokenSymbol, setTokenSymbol] = useState("CFI");
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

  // Initialize contracts - with signer when connected, read-only provider when not
  useEffect(() => {
    if (!settings.tokenAddress || !settings.crowdfundingAddress) {
      setTokenContract(null);
      setCrowdfundingContract(null);
      return;
    }

    try {
      const tokenAbi = JSON.parse(settings.tokenABI);
      const crowdAbi = JSON.parse(settings.crowdfundingABI);

      // Use signer if available, otherwise use read-only public provider
      const contractRunner = signer || new ethers.providers.JsonRpcProvider(BSC_TESTNET_RPC);

      if (tokenAbi.length > 0) {
        setTokenContract(new ethers.Contract(settings.tokenAddress, tokenAbi, contractRunner));
      }
      if (crowdAbi.length > 0) {
        setCrowdfundingContract(new ethers.Contract(settings.crowdfundingAddress, crowdAbi, contractRunner));
      }
    } catch (error) {
      console.error("Error initializing contracts:", error);
    }
  }, [signer, settings]);

  // Fetch token info when connected
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

  // Also fetch token symbol/decimals for read-only mode (no address)
  useEffect(() => {
    const fetchReadOnlyTokenInfo = async () => {
      if (!tokenContract || address) return; // skip if address is set (handled above)
      try {
        const [symbol, decimals] = await Promise.all([
          tokenContract.symbol(),
          tokenContract.decimals(),
        ]);
        setTokenSymbol(symbol);
        setTokenDecimals(decimals);
      } catch (error) {
        console.error("Error fetching read-only token info:", error);
      }
    };
    fetchReadOnlyTokenInfo();
  }, [tokenContract, address]);

  const updateSettings = (newSettings: ContractSettings) => {
    setSettings(newSettings);
    localStorage.setItem("contractSettings", JSON.stringify(newSettings));
  };

  const refreshTokenBalance = async () => {
    if (!tokenContract || !address) return;
    try {
      const balance = await tokenContract.balanceOf(address);
      setTokenBalance(ethers.utils.formatUnits(balance, tokenDecimals));
    } catch (error) {
      console.error("Error refreshing token balance:", error);
    }
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
        refreshTokenBalance,
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
