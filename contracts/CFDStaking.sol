// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CFDStaking
 * @notice Single-asset staking for the ChainFunder (CFD) token, with a
 *         single-level on-chain referral mechanism that pays the referrer
 *         REFERRAL_BPS / 10000 of the claimer's reward — ONLY on claim.
 *
 * Security:
 *  - ReentrancyGuard on stake / unstake / claim.
 *  - Self-referral, zero-address and circular (A->B->A) loops are rejected.
 *  - Referrer immutable once set; cannot be overwritten.
 *  - Rewards calculated from time-weighted on-chain checkpoints.
 *  - Referral payout drawn from the contract's CFD balance; if the pool
 *    is insufficient, the referral portion is skipped (the claimer still
 *    receives their full reward).
 */
contract CFDStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    uint256 public rewardRatePerSecond; // reward tokens per second per 1e18 staked
    uint256 public constant REFERRAL_BPS = 10; // 0.1%
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant PRECISION = 1e18;

    uint256 public totalStaked;

    struct StakeInfo {
        uint256 amount;
        uint256 rewardDebt; // accumulated unclaimed reward at lastUpdate
        uint256 lastUpdate;
    }

    mapping(address => StakeInfo) public stakes;

    // Referral relationships (immutable once set)
    mapping(address => address) public referrerOf;
    mapping(address => uint256) public referralCountOf;
    mapping(address => uint256) public referralEarned;
    mapping(address => uint256) public referralClaimed;
    mapping(address => address[]) private _referred;

    event Staked(address indexed user, uint256 amount, address indexed referrer);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event ReferralRegistered(address indexed user, address indexed referrer);
    event ReferralPaid(address indexed referrer, address indexed from, uint256 amount);

    constructor(address _token, uint256 _rewardRatePerSecond) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token");
        stakingToken = IERC20(_token);
        rewardRatePerSecond = _rewardRatePerSecond;
    }

    // ----------------------------- internal -----------------------------

    function _accrued(address user) internal view returns (uint256) {
        StakeInfo memory s = stakes[user];
        if (s.amount == 0) return s.rewardDebt;
        uint256 elapsed = block.timestamp - s.lastUpdate;
        uint256 reward = (s.amount * rewardRatePerSecond * elapsed) / PRECISION;
        return s.rewardDebt + reward;
    }

    function _updateRewards(address user) internal {
        stakes[user].rewardDebt = _accrued(user);
        stakes[user].lastUpdate = block.timestamp;
    }

    function _setReferrer(address user, address referrer) internal {
        if (referrer == address(0)) return;
        if (referrerOf[user] != address(0)) return; // already set, immutable
        if (referrer == user) return; // no self-ref
        // Prevent A->B and B->A loops
        if (referrerOf[referrer] == user) return;

        referrerOf[user] = referrer;
        referralCountOf[referrer] += 1;
        _referred[referrer].push(user);
        emit ReferralRegistered(user, referrer);
    }

    // ----------------------------- external -----------------------------

    function stake(uint256 amount, address referrer) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        _updateRewards(msg.sender);
        _setReferrer(msg.sender, referrer);

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        stakes[msg.sender].amount += amount;
        totalStaked += amount;

        emit Staked(msg.sender, amount, referrerOf[msg.sender]);
    }

    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage s = stakes[msg.sender];
        require(amount > 0 && amount <= s.amount, "Invalid amount");
        _updateRewards(msg.sender);

        s.amount -= amount;
        totalStaked -= amount;
        stakingToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() external nonReentrant {
        _updateRewards(msg.sender);
        uint256 reward = stakes[msg.sender].rewardDebt;
        require(reward > 0, "Nothing to claim");

        stakes[msg.sender].rewardDebt = 0;

        // Referral payout (only on claim, single-level, 0.1%)
        address ref = referrerOf[msg.sender];
        uint256 refAmount = 0;
        if (ref != address(0)) {
            refAmount = (reward * REFERRAL_BPS) / BASIS_POINTS;
            uint256 reserve = stakingToken.balanceOf(address(this)) - totalStaked;
            // Need reward + refAmount total liquidity outside of principal
            if (reserve < reward + refAmount) {
                refAmount = 0; // skip referral if pool insufficient
            }
        }

        // Pay user first (CEI)
        stakingToken.safeTransfer(msg.sender, reward);
        emit RewardsClaimed(msg.sender, reward);

        if (refAmount > 0) {
            referralEarned[ref] += refAmount;
            referralClaimed[ref] += refAmount;
            stakingToken.safeTransfer(ref, refAmount);
            emit ReferralPaid(ref, msg.sender, refAmount);
        }
    }

    // ----------------------------- views -----------------------------

    function pendingReward(address user) external view returns (uint256) {
        return _accrued(user);
    }

    function referredUsersLength(address user) external view returns (uint256) {
        return _referred[user].length;
    }

    function referredUsersOf(address user, uint256 index) external view returns (address) {
        return _referred[user][index];
    }

    // ----------------------------- admin -----------------------------

    function setRewardRate(uint256 newRate) external onlyOwner {
        rewardRatePerSecond = newRate;
    }

    /// @notice Top up the reward pool. Caller must approve first.
    function fundRewards(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
    }
}
