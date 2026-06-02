# CrowdFunding Smart Contract

A decentralized crowdfunding platform built for the ChainFunder (CFD) token on BNB Smart Chain.

## Deployment Guide

### Prerequisites

1. Install dependencies:
```bash
npm install @openzeppelin/contracts
# or using Hardhat
npm install --save-dev hardhat @openzeppelin/contracts @nomiclabs/hardhat-ethers ethers
```

2. You need your CFD token address already deployed on BSC Testnet.

### Deployment Steps

#### Using Remix (Easiest)

1. Go to [Remix IDE](https://remix.ethereum.org)
2. Create a new file `CrowdFunding.sol` and paste the contract code
3. Install OpenZeppelin by creating `.deps/npm/@openzeppelin/contracts` or using Remix's plugin
4. Compile with Solidity 0.8.19+
5. Deploy:
   - Environment: `Injected Provider - MetaMask`
   - Contract: `CrowdFunding`
   - Constructor arg: Your CFD token address (e.g., `0x123...abc`)
6. Click Deploy and confirm in MetaMask

#### Using Hardhat

1. Initialize project:
```bash
npx hardhat init
npm install @openzeppelin/contracts @nomiclabs/hardhat-ethers ethers dotenv
```

2. Configure `hardhat.config.js`:
```javascript
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

3. Create `.env`:
```
PRIVATE_KEY=your_wallet_private_key_without_0x
```

4. Create deploy script `scripts/deploy.js`:
```javascript
const hre = require("hardhat");

async function main() {
  const CFD_TOKEN_ADDRESS = "YOUR_CFD_TOKEN_ADDRESS_HERE";
  
  const CrowdFunding = await hre.ethers.getContractFactory("CrowdFunding");
  const crowdfunding = await CrowdFunding.deploy(CFD_TOKEN_ADDRESS);
  await crowdfunding.deployed();
  
  console.log("CrowdFunding deployed to:", crowdfunding.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

5. Deploy:
```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

## Contract Functions

### For Users

| Function | Description |
|----------|-------------|
| `createCampaign(title, description, imageUrl, goalAmount, durationDays)` | Create a new campaign |
| `donate(campaignId, amount)` | Donate CFD tokens to a campaign |
| `claimRefund(campaignId)` | Claim refund if campaign failed/cancelled |

### For Campaign Creators

| Function | Description |
|----------|-------------|
| `claimFunds(campaignId)` | Claim raised funds after successful campaign |
| `cancelCampaign(campaignId)` | Cancel campaign (allows refunds) |

### View Functions

| Function | Description |
|----------|-------------|
| `getCampaign(id)` | Get campaign details |
| `getActiveCampaigns(offset, limit)` | Get paginated active campaigns |
| `getCampaignsByCreator(address)` | Get campaigns by creator |
| `getCampaignsByDonor(address)` | Get campaigns user donated to |
| `getCampaignDonations(id)` | Get all donations for a campaign |

### Admin Functions

| Function | Description |
|----------|-------------|
| `updatePlatformFee(feePercent)` | Update platform fee (max 10%) |

## Contract ABI (Copy to Settings)

After deployment, get the ABI from Remix or your build folder. The key functions for frontend integration:

```json
[
  "function createCampaign(string title, string description, string imageUrl, uint256 goalAmount, uint256 durationDays) returns (uint256)",
  "function donate(uint256 campaignId, uint256 amount)",
  "function claimFunds(uint256 campaignId)",
  "function claimRefund(uint256 campaignId)",
  "function cancelCampaign(uint256 campaignId)",
  "function getCampaign(uint256 campaignId) view returns (tuple(uint256 id, address creator, string title, string description, string imageUrl, uint256 goalAmount, uint256 raisedAmount, uint256 deadline, uint256 createdAt, bool claimed, bool cancelled, uint256 donorCount))",
  "function getActiveCampaigns(uint256 offset, uint256 limit) view returns (tuple[])",
  "function campaignCount() view returns (uint256)",
  "function cfiToken() view returns (address)",
  "function platformFeePercent() view returns (uint256)"
]
```

## Integration with Frontend

1. Deploy the contract and get the address
2. Go to `/settings` on your platform
3. Enter the CFD token address and ABI
4. Enter the CrowdFunding contract address and ABI
5. Save settings

## Security Features

- ✅ ReentrancyGuard for all fund transfers
- ✅ SafeERC20 for token operations
- ✅ Owner-only admin functions
- ✅ Refund mechanism for failed campaigns
- ✅ Platform fee capped at 10%
- ✅ Cannot withdraw campaign funds (CFD token)

## Platform Fee

Default: 2.5% (250 basis points)
- Deducted when creator claims successful campaign funds
- Goes to contract owner
- Can be updated by owner (max 10%)

## Get tBNB for Testing

1. Go to [BNB Faucet](https://testnet.bnbchain.org/faucet-smart)
2. Enter your wallet address
3. Complete captcha and request tBNB
