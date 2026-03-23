import { createWeb3Modal, defaultConfig } from "@web3modal/ethers5/react";

/**
 * WalletConnect Cloud Project ID
 *
 * Note: If you see 403 errors from api.web3modal.com, your Project ID is invalid
 * or the current domain is not allowlisted in your WalletConnect Cloud settings.
 */
export const WALLETCONNECT_PROJECT_ID =
  (import.meta as any).env?.VITE_WALLETCONNECT_PROJECT_ID || "d0d285318792eb7b50c5ce363ebd9501";

// BSC Testnet configuration
const bscTestnet = {
  chainId: 97,
  name: "BNB Smart Chain Testnet",
  currency: "tBNB",
  explorerUrl: "https://testnet.bscscan.com",
  rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
};

// Metadata for the dApp
const metadata = {
  name: "CrowdFund Platform",
  description: "Decentralized crowdfunding platform on BNB Smart Chain",
  url: typeof window !== "undefined" ? window.location.origin : "https://crowdfund.app",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Ethers config
const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: false,
  rpcUrl: bscTestnet.rpcUrl,
  defaultChainId: bscTestnet.chainId,
});

// Create the Web3Modal instance
export const web3Modal = createWeb3Modal({
  ethersConfig,
  chains: [bscTestnet],
  projectId: WALLETCONNECT_PROJECT_ID,
  enableAnalytics: false,
  enableOnramp: false,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#10b981",
    "--w3m-border-radius-master": "2px",
  },
});
