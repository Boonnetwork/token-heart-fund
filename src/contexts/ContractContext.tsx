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

// ERC20 Token ABI (standard functions)
const TOKEN_ABI =
  '[{"inputs":[],"name":"name","outputs":[{"type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"account","type":"address"}],"name":"balanceOf","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"name":"approve","outputs":[{"type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"}]';

// New CrowdFunding ABI with all features
const CROWDFUNDING_ABI = '[{"type":"constructor","inputs":[{"name":"_CFI","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"name":"OwnableInvalidOwner","type":"error","inputs":[{"name":"owner","type":"address","internalType":"address"}]},{"name":"OwnableUnauthorizedAccount","type":"error","inputs":[{"name":"account","type":"address","internalType":"address"}]},{"name":"SafeERC20FailedOperation","type":"error","inputs":[{"name":"token","type":"address","internalType":"address"}]},{"name":"CampaignCancelled","type":"event","inputs":[{"name":"campaignId","type":"uint256","indexed":true,"internalType":"uint256"},{"name":"creator","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"name":"CampaignCreated","type":"event","inputs":[{"name":"campaignId","type":"uint256","indexed":true,"internalType":"uint256"},{"name":"creator","type":"address","indexed":true,"internalType":"address"},{"name":"title","type":"string","indexed":false,"internalType":"string"},{"name":"goalAmount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"deadline","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"name":"DonationMade","type":"event","inputs":[{"name":"campaignId","type":"uint256","indexed":true,"internalType":"uint256"},{"name":"donor","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"totalRaised","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"name":"FundsClaimed","type":"event","inputs":[{"name":"campaignId","type":"uint256","indexed":true,"internalType":"uint256"},{"name":"creator","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"platformFee","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"name":"OwnershipTransferred","type":"event","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"name":"PlatformFeeUpdated","type":"event","inputs":[{"name":"oldFee","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"newFee","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"name":"RefundClaimed","type":"event","inputs":[{"name":"campaignId","type":"uint256","indexed":true,"internalType":"uint256"},{"name":"donor","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"name":"BASIS_POINTS","type":"function","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"name":"CFI","type":"function","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IERC20"}],"stateMutability":"view"},{"name":"MAX_FEE","type":"function","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"name":"campaignCount","type":"function","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"name":"campaignDonations","type":"function","inputs":[{"name":"","type":"uint256","internalType":"uint256"},{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"donor","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"timestamp","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"name":"campaigns","type":"function","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"id","type":"uint256","internalType":"uint256"},{"name":"creator","type":"address","internalType":"address"},{"name":"title","type":"string","internalType":"string"},{"name":"description","type":"string","internalType":"string"},{"name":"imageUrl","type":"string","internalType":"string"},{"name":"goalAmount","type":"uint256","internalType":"uint256"},{"name":"raisedAmount","type":"uint256","internalType":"uint256"},{"name":"deadline","type":"uint256","internalType":"uint256"},{"name":"createdAt","type":"uint256","internalType":"uint256"},{"name":"claimed","type":"bool","internalType":"bool"},{"name":"cancelled","type":"bool","internalType":"bool"},{"name":"donorCount","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"name":"cancelCampaign","type":"function","inputs":[{"name":"_campaignId","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"name":"claimFunds","type":"function","inputs":[{"name":"_campaignId","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"name":"claimRefund","type":"function","inputs":[{"name":"_campaignId","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"name":"createCampaign","type":"function","inputs":[{"name":"_title","type":"string","internalType":"string"},{"name":"_description","type":"string","internalType":"string"},{"name":"_imageUrl","type":"string","internalType":"string"},{"name":"_goalAmount","type":"uint256","internalType":"uint256"},{"name":"_durationDays","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"campaignId","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"name":"creatorCampaigns","type":"function","inputs":[{"name":"","type":"address","internalType":"address"},{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"name":"donate","type":"function","inputs":[{"name":"_campaignId","type":"uint256","internalType":"uint256"},{"name":"_amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"name":"donorCampaigns","type":"function","inputs":[{"name":"","type":"address","internalType":"address"},{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"name":"donorContributions","type":"function","inputs":[{"name":"","type":"uint256","internalType":"uint256"},{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"name":"emergencyWithdraw","type":"function","inputs":[{"name":"_token","type":"address","internalType":"address"},{"name":"_amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"name":"getActiveCampaigns","type":"function","inputs":[{"name":"_offset","type":"uint256","internalType":"uint256"},{"name":"_limit","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"campaignList","type":"tuple[]","components":[{"name":"id","type":"uint256","internalType":"uint256"},{"name":"creator","type":"address","internalType":"address"},{"name":"title","type":"string","internalType":"string"},{"name":"description","type":"string","internalType":"string"},{"name":"imageUrl","type":"string","internalType":"string"},{"name":"goalAmount","type":"uint256","internalType":"uint256"},{"name":"raisedAmount","type":"uint256","internalType":"uint256"},{"name":"deadline","type":"uint256","internalType":"uint256"},{"name":"createdAt","type":"uint256","internalType":"uint256"},{"name":"claimed","type":"bool","internalType":"bool"},{"name":"cancelled","type":"bool","internalType":"bool"},{"name":"donorCount","type":"uint256","internalType":"uint256"}],"internalType":"struct CrowdFunding.Campaign[]"}],"stateMutability":"view"},{"name":"getCampaign","type":"function","inputs":[{"name":"_campaignId","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"tuple","components":[{"name":"id","type":"uint256","internalType":"uint256"},{"name":"creator","type":"address","internalType":"address"},{"name":"title","type":"string","internalType":"string"},{"name":"description","type":"string","internalType":"string"},{"name":"imageUrl","type":"string","internalType":"string"},{"name":"goalAmount","type":"uint256","internalType":"uint256"},{"name":"raisedAmount","type":"uint256","internalType":"uint256"},{"name":"deadline","type":"uint256","internalType":"uint256"},{"name":"createdAt","type":"uint256","internalType":"uint256"},{"name":"claimed","type":"bool","internalType":"bool"},{"name":"cancelled","type":"bool","internalType":"bool"},{"name":"donorCount","type":"uint256","internalType":"uint256"}],"internalType":"struct CrowdFunding.Campaign"}],"stateMutability":"view"},{"name":"getCampaignDonations","type":"function","inputs":[{"name":"_campaignId","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"tuple[]","components":[{"name":"donor","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"timestamp","type":"uint256","internalType":"uint256"}],"internalType":"struct CrowdFunding.Donation[]"}],"stateMutability":"view"},{"name":"getCampaignsByCreator","type":"function","inputs":[{"name":"_creator","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"view"},{"name":"getCampaignsByDonor","type":"function","inputs":[{"name":"_donor","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"view"},{"name":"getDonorContribution","type":"function","inputs":[{"name":"_campaignId","type":"uint256","internalType":"uint256"},{"name":"_donor","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"name":"isCampaignActive","type":"function","inputs":[{"name":"_campaignId","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"name":"owner","type":"function","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"name":"platformFeePercent","type":"function","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"name":"renounceOwnership","type":"function","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"name":"transferOwnership","type":"function","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"name":"updatePlatformFee","type":"function","inputs":[{"name":"_newFeePercent","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"}]';

const defaultSettings: ContractSettings = {
  tokenAddress: "0x732e22E963C914756Bf2B3401249A43d733A6A3b", // CFI Token on BSC Testnet
  tokenABI: TOKEN_ABI,
  crowdfundingAddress: "0x3Ea8169c11A4B7E49BCe65B9403339Ae46Dea212", // New CrowdFunding contract
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
