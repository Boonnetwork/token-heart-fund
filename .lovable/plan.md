
# ChainFunder: Categories + DAO + Staking + Referral

This is a large, multi-system build touching smart contracts and frontend. Plan first, implement in one focused pass after approval.

## Scope confirmation

Four features:
1. **Campaign Categories** — required dropdown, filter/search on Explore, badges on cards & detail.
2. **DAO Governance** — on-chain proposals + voting + dashboard.
3. **Staking** — stake / unstake / claim, dashboard with totals + history.
4. **Single-level Referral (staking-only)** — 0.1% of claimer's reward goes to referrer, on claim only.

All existing functionality (campaigns, donations, claims, refunds, blog, media, admin, profile, dashboard) preserved.

## Smart contracts (Solidity, BSC Testnet, Remix-deployable)

Three new/updated contracts in `contracts/`:

### 1. `CrowdFunding.sol` (UPDATED — additive only)
- Add `string category` to `Campaign` struct.
- `createCampaign(...)` gains a `string category` param appended at end (keep old signature path via overload is hard in Solidity; we bump to a new function and frontend uses new signature; old campaigns return empty category).
- `CampaignCreated` event gains `string category`.
- Existing donation/claim/refund logic untouched.

### 2. `CFDStaking.sol` (NEW)
- Stake CFD token, accrue rewards by time × rate (per-second emission, configurable by owner).
- `stake(uint256 amount, address referrer)` — registers referrer on first stake only; rejects self/zero/loops.
- `unstake(uint256 amount)` — withdraws principal; updates pending reward checkpoint.
- `claimRewards()` — pays user reward, pays referrer 0.1% (10 bps) of that reward from a reward pool.
- View funcs: `pendingReward(user)`, `totalStaked()`, `userStake(user)`, `referrerOf(user)`, `referralCountOf(user)`, `referralEarned(user)`, `referralClaimed(user)`.
- Events: `Staked`, `Unstaked`, `RewardsClaimed`, `ReferralRegistered`, `ReferralPaid`.
- Security: `ReentrancyGuard`, `Ownable`, SafeERC20, checks-effects-interactions, no self-referral, immutable referrer after set, referral paid only on claim.

### 3. `CFDGovernance.sol` (NEW)
- `createProposal(string title, string description, uint256 votingPeriodSecs)` — requires min stake (configurable).
- `vote(uint256 id, bool support)` — weight = current `userStake` in staking contract (or token balance if staking addr unset).
- `execute(uint256 id)` — marks Executed after deadline if passed (no on-chain action call to keep scope tight — pure signaling DAO, expandable later).
- Status enum: Draft (unused, all proposals start Active), Active, Passed, Rejected, Executed.
- Events: `ProposalCreated`, `VoteCast`, `ProposalExecuted`.

Addresses configurable via existing `/settings` runtime override pattern (extend `ContractContext`).

## Frontend

### New files
- `src/lib/categories.ts` — full 50-item list + helpers.
- `src/components/CategorySelect.tsx` — searchable Combobox (Command) for create form.
- `src/components/CategoryBadge.tsx` — colored pill, used in cards + detail.
- `src/components/CategoryFilter.tsx` — multi-select chip filter on Explore.
- `src/abis/Staking.json`, `src/abis/Governance.json` — ABIs.
- `src/hooks/useStaking.ts` — read state, stake/unstake/claim, referral info.
- `src/hooks/useGovernance.ts` — list/create/vote/execute proposals.
- `src/hooks/useReferral.ts` — read `?ref=` from URL, persist to localStorage until first stake, expose copyable link.
- `src/pages/Staking.tsx` — staking dashboard (Total staked / My stake / Pending / Claimed / History).
- `src/pages/Governance.tsx` — proposal list + create.
- `src/pages/ProposalDetail.tsx` — single proposal + vote UI.
- `src/components/ReferralPanel.tsx` — embedded in `Dashboard.tsx` (Total referrals, earned, claimed, history, copy link).

### Edits
- `src/contexts/ContractContext.tsx` — add `stakingAddress`, `governanceAddress` overrides.
- `src/pages/CreateCampaign.tsx` — add CategorySelect (required), pass to contract call.
- `src/pages/Campaigns.tsx` — add CategoryFilter + search-by-category in existing filter row.
- `src/pages/CampaignDetail.tsx` — render CategoryBadge.
- `src/components/CampaignCard.tsx` — add CategoryBadge overlay.
- `src/components/Navbar.tsx` — add Staking + Governance links.
- `src/pages/Dashboard.tsx` — mount `<ReferralPanel />`.
- `src/App.tsx` — routes `/staking`, `/governance`, `/governance/:id`.
- `src/hooks/useCrowdfunding.ts` — surface `category` from event/state.
- `src/pages/Settings.tsx` — add Staking + Governance address overrides.
- `DOCUMENTATION.md` — append deployment + usage docs for the 3 new systems.

### Referral flow
1. New visitor lands on `…?ref=0xabc…` → `useReferral` stores in `localStorage` (`cfd_ref`).
2. On first `stake()` call, frontend passes stored referrer as the `referrer` arg. Contract registers immutably.
3. Subsequent stakes ignore the param.
4. On `claimRewards()` contract auto-pays referrer 0.1%.

## Design system
Reuses existing tokens (glassmorphism cards, Sora display, Space Grotesk body, primary/accent gradients). No new colors. Mobile-first using existing responsive patterns from `Campaigns.tsx` / `Dashboard.tsx`.

## Security checklist
- ReentrancyGuard on stake/unstake/claim.
- Self-referral, zero-address, and circular (A→B→A) checks in `_setReferrer`.
- Referrer immutable after first set.
- Rewards computed from on-chain checkpoint, not user input.
- Governance vote weight read at vote time from staking; double-vote prevented via `hasVoted` mapping.
- Frontend zod validation on all new inputs.

## Deliverables
1. 3 contracts (1 updated, 2 new) + ABIs.
2. All frontend files above.
3. Deployment instructions in `DOCUMENTATION.md`:
   - Deploy updated `CrowdFunding` → set address in `/settings`.
   - Deploy `CFDStaking(token, rewardRatePerSecond)` → fund reward pool → set address.
   - Deploy `CFDGovernance(stakingAddr, minStakeToPropose)` → set address.
4. Testing instructions (manual flow: create category campaign, stake with `?ref=`, claim, verify referral payout, propose+vote).

## Out of scope (kept as-is)
- Existing campaign donation, claim, refund logic.
- Profile, blog, media manager, admin settings.
- No multi-sig / timelock on governance execution (signaling only; expandable later as noted in code comments).

After approval I will implement all files in parallel and push to the repo.
