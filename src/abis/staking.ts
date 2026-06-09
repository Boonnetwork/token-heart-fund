// ABI for CFDStaking.sol — used by the frontend hook and admin Settings page.
// Override at runtime via /settings if you redeploy.
export const STAKING_ABI = [
  // constructor & admin
  'function stakingToken() view returns (address)',
  'function rewardRatePerSecond() view returns (uint256)',
  'function REFERRAL_BPS() view returns (uint256)',
  'function totalStaked() view returns (uint256)',

  // user state
  'function stakes(address) view returns (uint256 amount, uint256 rewardDebt, uint256 lastUpdate)',
  'function pendingReward(address user) view returns (uint256)',
  'function referrerOf(address user) view returns (address)',
  'function referralCountOf(address user) view returns (uint256)',
  'function referralEarned(address user) view returns (uint256)',
  'function referralClaimed(address user) view returns (uint256)',
  'function referredUsersOf(address user, uint256 index) view returns (address)',
  'function referredUsersLength(address user) view returns (uint256)',

  // actions
  'function stake(uint256 amount, address referrer)',
  'function unstake(uint256 amount)',
  'function claimRewards()',

  // admin
  'function setRewardRate(uint256 newRate)',
  'function fundRewards(uint256 amount)',

  // events
  'event Staked(address indexed user, uint256 amount, address indexed referrer)',
  'event Unstaked(address indexed user, uint256 amount)',
  'event RewardsClaimed(address indexed user, uint256 amount)',
  'event ReferralRegistered(address indexed user, address indexed referrer)',
  'event ReferralPaid(address indexed referrer, address indexed from, uint256 amount)',
];
