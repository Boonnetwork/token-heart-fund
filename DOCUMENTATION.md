# ChainFunder — Complete Platform Documentation

ChainFunder is a decentralized crowdfunding platform built on **BNB Smart Chain (BSC Testnet)**. It uses the native **CFD** BEP‑20 token (ChainFunder Token) to receive donations, manage campaign goals, and release funds through smart contracts — without intermediaries.

This document covers everything: how the platform works, how to use it as a creator or donor, how to administer it, how to deploy the smart contracts on Remix, and how to connect the frontend to your deployed contracts.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Tech Stack](#2-tech-stack)
3. [How the Platform Works](#3-how-the-platform-works)
4. [User Guide](#4-user-guide)
   - [4.1 Connect a Wallet](#41-connect-a-wallet)
   - [4.2 Create a Campaign](#42-create-a-campaign)
   - [4.3 Fund (Donate to) a Campaign](#43-fund-donate-to-a-campaign)
   - [4.4 Claim Funds After a Successful Campaign](#44-claim-funds-after-a-successful-campaign)
   - [4.5 Claim Refund for a Failed/Cancelled Campaign](#45-claim-refund-for-a-failedcancelled-campaign)
   - [4.6 Dashboard](#46-dashboard)
   - [4.7 Blog & News](#47-blog--news)
5. [Admin Guide](#5-admin-guide)
   - [5.1 Accessing Admin Settings](#51-accessing-admin-settings)
   - [5.2 Updating Contract Addresses & ABIs](#52-updating-contract-addresses--abis)
   - [5.3 Media Manager (Pinata IPFS)](#53-media-manager-pinata-ipfs)
   - [5.4 Posting Blog & News Articles](#54-posting-blog--news-articles)
   - [5.5 Managing “How It Works” Media](#55-managing-how-it-works-media)
6. [Branding & Customization](#6-branding--customization)
   - [6.1 Change the Logo](#61-change-the-logo)
   - [6.2 Change the Platform Name](#62-change-the-platform-name)
   - [6.3 Edit Footer Links](#63-edit-footer-links)
   - [6.4 Theme Colors & Fonts](#64-theme-colors--fonts)
7. [Smart Contracts](#7-smart-contracts)
   - [7.1 Contracts Overview](#71-contracts-overview)
   - [7.2 Deploy the CFD Token (BEP‑20) with Remix](#72-deploy-the-cfd-token-bep20-with-remix)
   - [7.3 Deploy the CrowdFunding Contract with Remix](#73-deploy-the-crowdfunding-contract-with-remix)
   - [7.4 Verify on BscScan](#74-verify-on-bscscan)
8. [Connect the Frontend to Your Contracts](#8-connect-the-frontend-to-your-contracts)
9. [Environment Variables](#9-environment-variables)
10. [Real‑Time Metrics](#10-realtime-metrics)
11. [Media Uploads (Pinata IPFS)](#11-media-uploads-pinata-ipfs)
12. [Security Model](#12-security-model)
13. [Troubleshooting / FAQ](#13-troubleshooting--faq)

---

## 1. Platform Overview

- **Network:** BNB Smart Chain Testnet (chainId `97`). Switch to Mainnet (`56`) for production.
- **Donation token:** **CFD** — a BEP‑20 token deployed by the platform owner.
- **Platform fee:** 2.5% (configurable, capped at 10%) deducted **only** when a creator claims a successful campaign.
- **Goal cap:** Donations are automatically capped at the remaining goal. Excess is returned to the donor.
- **Refunds:** Full refunds for donors if the campaign is cancelled or ends without meeting its goal.
- **Early claim:** Creators may claim immediately once the goal is reached (no need to wait for deadline).

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Web3 | ethers.js v6 + Web3Modal (WalletConnect) |
| Storage | LocalStorage (admin config, blog posts, media library, metrics cache) |
| Media | Pinata IPFS (images & videos, up to 100 MB) |
| Smart Contracts | Solidity 0.8.19 + OpenZeppelin (Ownable, ReentrancyGuard, SafeERC20) |
| Chain | BNB Smart Chain (BEP‑20) |

---

## 3. How the Platform Works

```
Creator                      ChainFunder Contract              Donor
   │                                  │                          │
   │  createCampaign(...) ───────────▶│                          │
   │                                  │                          │
   │                                  │◀── approve(CFD) ────────│
   │                                  │◀── donate(id, amount) ──│
   │                                  │   (capped at goal,       │
   │                                  │    excess refunded)      │
   │                                  │                          │
   │  Goal reached or deadline?       │                          │
   │                                  │                          │
   │  claimFunds(id) ────────────────▶│                          │
   │  (creator receives 97.5%,        │                          │
   │   platform receives 2.5%)        │                          │
   │                                  │                          │
   │  Failed/cancelled? ─────────────▶│◀── claimRefund(id) ─────│
```

**Lifecycle states**

| State | Meaning |
|-------|--------|
| `active` | Accepting donations (before deadline, goal not reached, not cancelled) |
| `completed` | Goal reached. Creator can claim. |
| `failed` | Deadline passed without reaching goal. Donors can refund. |
| `cancelled` | Creator cancelled. Donors can refund. |

---

## 4. User Guide

### 4.1 Connect a Wallet
1. Click **Connect Wallet** in the top‑right (MetaMask, Trust Wallet, or any WalletConnect‑compatible wallet).
2. Approve the connection.
3. If you are not on **BSC Testnet**, the app prompts you to switch. Approve the network switch.
4. Get test **tBNB** for gas from: <https://testnet.bnbchain.org/faucet-smart>
5. Get **CFD** tokens from the platform owner (or the token's distribution mechanism once deployed).

### 4.2 Create a Campaign
1. Connect your wallet.
2. Go to **Create** in the top navigation (`/create`).
3. Fill in the form:
   - **Title** (max 100 chars)
   - **Description** (max 5,000 chars — Markdown supported)
   - **Image** — either paste an external URL or click **Upload to IPFS** (Pinata, max 100 MB image/video)
   - **Goal amount** (in CFD)
   - **Duration** in days (1–365)
4. Click **Create Campaign** and confirm the transaction in your wallet.
5. After confirmation you'll be redirected to the campaign page.

### 4.3 Fund (Donate to) a Campaign
1. Browse `/campaigns` or click any featured campaign.
2. Enter the amount of **CFD** to donate.
3. **First donation:** approve the contract to spend your CFD (MaxUint256 approval — one‑time per wallet).
4. Click **Donate** and confirm the second transaction.
5. The donation is capped at the remaining goal — any excess automatically returns to your wallet.
6. Your address and transaction hash appear in the **Recent Donors** list (transparency).

### 4.4 Claim Funds After a Successful Campaign
> Only the campaign **creator** can claim.

1. Open your campaign page.
2. When `raisedAmount ≥ goalAmount` (or after deadline if goal is met), the **Claim Funds** button activates.
3. Click **Claim Funds**, confirm in wallet.
4. 97.5% of the raised CFD is sent to your wallet; 2.5% goes to the platform treasury.
5. The campaign is marked `claimed = true` (one‑time action).

### 4.5 Claim Refund for a Failed/Cancelled Campaign
1. Open a campaign that is `failed` or `cancelled`.
2. If you donated, the **Claim Refund** button appears.
3. Click it and confirm — your full donation amount is returned.

### 4.6 Dashboard
`/dashboard` shows:
- Campaigns you created (with claim status)
- Campaigns you donated to (with refund eligibility)
- Total raised across your campaigns

### 4.7 Blog & News
- `/blog` lists posts as cards, filterable by **Blog** or **News**.
- Click a card to read the full post at `/blog/:id`.
- Posts support inline images and videos (Markdown `![alt](ipfs-url)`).

---

## 5. Admin Guide

### 5.1 Accessing Admin Settings
The admin panel is intentionally hidden from the UI.

1. Navigate manually to **`/settings`**.
2. Enter the admin password (default: see your local memory; change it after first launch — see [5.1.1](#511-changing-the-admin-password)).
3. After 5 failed attempts, the panel locks for 15 minutes.

#### 5.1.1 Changing the Admin Password
Edit `src/pages/Settings.tsx`, locate the `ADMIN_PASSWORD` constant, and replace it with your hashed value. **Never commit a plaintext password to GitHub.** Use a strong random string.

### 5.2 Updating Contract Addresses & ABIs
In `/settings → Contracts` you can update at runtime (saved to LocalStorage):
- **CFD Token Address** + ABI
- **CrowdFunding Contract Address** + ABI

These overrides take effect immediately without redeploying the frontend.

### 5.3 Media Manager (Pinata IPFS)
- Upload images and videos up to **100 MB** to IPFS via Pinata.
- Returned `ipfs://CID` URLs are resolved through multiple gateways (`ipfs.io`, `cloudflare-ipfs.com`, `gateway.pinata.cloud`) with automatic fallback.
- All uploads require `VITE_PINATA_JWT` to be set (see [Environment Variables](#9-environment-variables)).

### 5.4 Posting Blog & News Articles
1. Open `/settings → Media Manager → Posts`.
2. Choose type: **Blog** or **News** (badge is shown to readers).
3. Fill title, excerpt, body (Markdown).
4. Click **Insert image** inside the body to upload to IPFS — the editor auto‑inserts `![filename](ipfs://CID)`.
5. **Publish** — saved to LocalStorage and visible on `/blog`.

### 5.5 Managing “How It Works” Media
- Upload images/videos in `/settings → Media Manager → How It Works`.
- Selected media render on the homepage under the **How It Works** section.

---

## 6. Branding & Customization

### 6.1 Change the Logo
The logo is a Lucide `Rocket` icon inside a gradient tile.
- **File:** `src/components/Navbar.tsx` (and `src/components/Footer.tsx` if duplicated).
- Replace the `<Rocket />` element with your own SVG or `<img src="/logo.svg" />` placed in `public/`.

```tsx
// Before
<Rocket className="w-5 h-5 text-primary-foreground" />
// After
<img src="/logo.svg" alt="MyBrand" className="w-6 h-6" />
```

### 6.2 Change the Platform Name
Search and replace `ChainFunder` across the codebase:
- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`
- `src/pages/Index.tsx` (e.g. "Why Choose ChainFunder?")
- `index.html` `<title>` and meta tags
- `DOCUMENTATION.md` / `contracts/README.md`

### 6.3 Edit Footer Links
- **File:** `src/components/Footer.tsx`
- Find the `footerLinks` object (Product / Resources / Legal / Social).
- Add, remove, or rename entries; each item is `{ label, href }`.

### 6.4 Theme Colors & Fonts
- **Colors:** `src/index.css` (HSL design tokens) and `tailwind.config.ts` (Tailwind mapping).
- **Fonts:** `index.html` (`<link>` to Google Fonts) and `tailwind.config.ts` `fontFamily`. Defaults: **Sora** (display) + **Space Grotesk** (body).

> Never hardcode colors in components. Always use semantic tokens (`bg-primary`, `text-foreground`, etc.).

---

## 7. Smart Contracts

### 7.1 Contracts Overview
- **`CFDToken.sol`** — A standard OpenZeppelin BEP‑20 token (`ERC20`). Symbol: `CFD`.
- **`CrowdFunding.sol`** — The crowdfunding engine. Takes the CFD token address in its constructor.

Source for `CrowdFunding.sol` is in [`contracts/CrowdFunding.sol`](contracts/CrowdFunding.sol).

### 7.2 Deploy the CFD Token (BEP‑20) with Remix

> Skip this section if you already have a CFD token deployed; just reuse its address.

1. Open <https://remix.ethereum.org>.
2. Create `contracts/CFDToken.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CFDToken is ERC20, Ownable {
    constructor(uint256 initialSupply)
        ERC20("ChainFunder", "CFD")
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
```

3. **Compile** with Solidity `0.8.19`+ (enable optimizer, 200 runs).
4. In **Deploy & Run Transactions**:
   - **Environment:** `Injected Provider — MetaMask`
   - Make sure MetaMask is on **BSC Testnet** (chainId 97). RPC: `https://data-seed-prebsc-1-s1.bnbchain.org:8545`
   - Get test BNB: <https://testnet.bnbchain.org/faucet-smart>
   - **Contract:** `CFDToken`
   - **Constructor arg:** initial supply, e.g. `1000000` (= 1,000,000 CFD)
5. Click **Deploy**, confirm in MetaMask.
6. Copy the deployed contract address — this is your **CFD Token Address**.

### 7.3 Deploy the CrowdFunding Contract with Remix
1. In Remix, create `contracts/CrowdFunding.sol` and paste the full file from this repo (`contracts/CrowdFunding.sol`).
2. Ensure OpenZeppelin imports resolve (Remix auto‑resolves `@openzeppelin/contracts`).
3. **Compile** with `0.8.19`+.
4. In **Deploy & Run Transactions**:
   - **Environment:** `Injected Provider — MetaMask` (BSC Testnet)
   - **Contract:** `CrowdFunding`
   - **Constructor arg:** the **CFD Token Address** from step 7.2
5. Click **Deploy**, confirm in MetaMask.
6. Copy the deployed address — this is your **CrowdFunding Contract Address**.
7. In Remix, open the contract panel and click **ABI** (clipboard icon) to copy the JSON ABI.

### 7.4 Verify on BscScan
1. Go to <https://testnet.bscscan.com> → your contract → **Verify and Publish**.
2. Compiler type: **Solidity (Single file)** or **Standard JSON** (Remix can export Standard JSON via the Solidity Compiler tab).
3. Compiler version: must match Remix exactly (e.g. `v0.8.19+commit.7dd6d404`).
4. Optimizer: same setting used during compilation.
5. Paste source + constructor arguments (ABI‑encoded — BscScan provides a helper).
6. Submit. Once verified, the **Read/Write Contract** tabs appear.

---

## 8. Connect the Frontend to Your Contracts

You do **not** need to redeploy or rebuild the frontend to point it at new contracts.

1. Open the deployed app and go to **`/settings`**.
2. Enter the admin password.
3. In the **Contracts** section:
   - Paste the **CFD Token Address** + its ABI (a standard ERC‑20 ABI is sufficient).
   - Paste the **CrowdFunding Contract Address** + its full ABI (copied from Remix).
4. Click **Save**. The configuration is stored in LocalStorage and used immediately by all contract calls.

> Optional: hardcode defaults in `src/contexts/ContractContext.tsx` so the contract addresses are baked into the build (useful for production deployments).

---

## 9. Environment Variables

Create a `.env` (or `.env.local`) at the project root:

```dotenv
# WalletConnect (required) — get from https://cloud.walletconnect.com
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Pinata IPFS (required for image/video uploads) — get a JWT at https://app.pinata.cloud/developers/api-keys
VITE_PINATA_JWT=your_pinata_jwt_here

# Optional: override the default BSC chain (97 = Testnet, 56 = Mainnet)
VITE_CHAIN_ID=97
```

After changing env vars, restart the dev server.

> **WalletConnect note:** add your production URL to the WalletConnect allowlist (Cloud dashboard → your project → Allowed Domains), otherwise mobile wallet connections will fail in production.

---

## 10. Real‑Time Metrics

The homepage **Live Metrics** widget shows:
- Total Campaigns
- Total Funded (goal reached)
- Total Raised (CFD)
- Unique Donors

**How it works** (`src/hooks/useMetrics.ts`):
1. On mount, reads `campaignCount` and iterates over campaigns via `getCampaign()` for the fallback baseline.
2. Subscribes to `CampaignCreated` and `DonationMade` ethers event listeners for live updates.
3. Caches the aggregated result in LocalStorage (60 s TTL) to reduce RPC calls and survive reloads.
4. On error, gracefully falls back to the cached snapshot.

---

## 11. Media Uploads (Pinata IPFS)

`src/lib/pinata.ts` exposes a single helper:

```ts
import { uploadToPinata } from '@/lib/pinata';
const { url, cid } = await uploadToPinata(file); // file: File | Blob
```

- Accepts both images and videos.
- Limit: **100 MB** per file (configurable).
- The returned `url` uses a CID‑first gateway with automatic fallback across `ipfs.io`, `cloudflare-ipfs.com`, and `gateway.pinata.cloud`.

The reusable **`<MediaUpload />`** component (`src/components/MediaUpload.tsx`) wraps this and is used everywhere users supply media (campaign creation, blog posts, How‑It‑Works manager). To add an uploader on any future page:

```tsx
import { MediaUpload } from '@/components/MediaUpload';

<MediaUpload accept="image/*,video/*" onUploaded={(url) => setUrl(url)} />
```

---

## 12. Security Model

- **No private keys** ever leave the user's wallet. The frontend only requests signatures.
- **ReentrancyGuard** on all fund‑moving contract functions.
- **SafeERC20** for all token transfers.
- **Role separation:** roles are checked on‑chain (`Ownable`); off‑chain admin password gates only UI surfaces — never trust it for authorization on data that matters.
- **Input validation:** Zod schemas on the frontend; on‑chain `require` checks for amounts, lengths, durations.
- **Brute‑force protection:** admin login locks for 15 minutes after 5 failed attempts.
- **XSS:** all user content (campaign descriptions, blog posts) is rendered through a sanitizing renderer (`src/lib/postRenderer.tsx`).

---

## 13. Troubleshooting / FAQ

**“Insufficient allowance” when donating.**
The CFD approval transaction failed or was rejected. Click **Donate** again — the app will request a fresh MaxUint256 approval.

**Image won't load on a campaign.**
Pinata may be slow on first fetch. The app retries through multiple gateways automatically. Reload after 10–30 s. Confirm the CID resolves at `https://ipfs.io/ipfs/<CID>`.

**“Wrong network” banner.**
Your wallet is not on BSC Testnet (chainId 97). Click the banner's **Switch** button or change manually in MetaMask.

**Metrics show stale numbers.**
The cache is 60 s. Hard‑refresh (Ctrl/Cmd+Shift+R) to force a fresh on‑chain read.

**My contract ABI changed.**
Update both the address and the ABI in `/settings`. The frontend picks up the new ABI on next render — no rebuild required.

**Where do I get test CFD?**
Once you've deployed the CFD token (Section 7.2), you (the deployer) hold the entire initial supply. Use `transfer()` from Remix or BscScan's **Write Contract** tab to distribute test tokens to your wallet(s).

---

### Repository Layout (quick reference)

```
contracts/
  CrowdFunding.sol         # Main crowdfunding contract
  README.md                # Contract‑specific deployment notes
src/
  components/              # UI components (Navbar, Footer, MediaUpload, MetricsCounter, ...)
  contexts/                # WalletContext, ContractContext
  hooks/                   # useCrowdfunding, useMetrics, useContractEvents
  lib/                     # pinata, mediaLibrary, postRenderer, validation, web3modal
  pages/                   # Index, Campaigns, CampaignDetail, CreateCampaign,
                           # Dashboard, Settings, Blog, BlogPost, NotFound
DOCUMENTATION.md           # ← you are here
```

— End of documentation —
