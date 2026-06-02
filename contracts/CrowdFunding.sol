// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CrowdFunding
 * @dev A decentralized crowdfunding platform using CFD token on BSC
 * @notice This contract allows users to create and fund campaigns using the ChainFunder (CFD) token.
 *
 * Key features:
 * - Donations are capped at the remaining goal amount; excess is returned to the donor
 * - No donations accepted once the goal is reached or the deadline has passed
 * - Creators can claim funds early once the goal is met (before deadline)
 * - 2.5% platform fee (configurable, max 10%) deducted on claim
 * - Full refunds for donors if campaign fails or is cancelled
 * - ReentrancyGuard on all fund-moving functions
 */
contract CrowdFunding is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    IERC20 public immutable cfiToken;
    uint256 public platformFeePercent = 250; // 2.5% (basis points)
    uint256 public constant MAX_FEE = 1000; // 10% max fee
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public campaignCount;

    // ============ Structs ============

    struct Campaign {
        uint256 id;
        address creator;
        string title;
        string description;
        string imageUrl;
        uint256 goalAmount;
        uint256 raisedAmount;
        uint256 deadline;
        uint256 createdAt;
        bool claimed;
        bool cancelled;
        uint256 donorCount;
    }

    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
    }

    // ============ Mappings ============

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Donation[]) public campaignDonations;
    mapping(uint256 => mapping(address => uint256)) public donorContributions;
    mapping(address => uint256[]) public creatorCampaigns;
    mapping(address => uint256[]) public donorCampaigns;

    // ============ Events ============

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 goalAmount,
        uint256 deadline
    );

    event DonationMade(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount,
        uint256 totalRaised
    );

    event FundsClaimed(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount,
        uint256 platformFee
    );

    event RefundClaimed(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount
    );

    event CampaignCancelled(
        uint256 indexed campaignId,
        address indexed creator
    );

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);

    // ============ Modifiers ============

    modifier campaignExists(uint256 _campaignId) {
        require(_campaignId > 0 && _campaignId <= campaignCount, "Campaign does not exist");
        _;
    }

    modifier onlyCreator(uint256 _campaignId) {
        require(campaigns[_campaignId].creator == msg.sender, "Not campaign creator");
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the crowdfunding contract with the CFD token address
     * @param _cfiToken Address of the ChainFunder (CFD) token contract
     */
    constructor(address _cfiToken) Ownable(msg.sender) {
        require(_cfiToken != address(0), "Invalid token address");
        cfiToken = IERC20(_cfiToken);
    }

    // ============ External Functions ============

    /**
     * @notice Create a new crowdfunding campaign
     * @param _title Campaign title
     * @param _description Campaign description
     * @param _imageUrl IPFS or URL for campaign image
     * @param _goalAmount Funding goal in CFD tokens (wei)
     * @param _durationDays Campaign duration in days
     * @return campaignId The ID of the newly created campaign
     */
    function createCampaign(
        string calldata _title,
        string calldata _description,
        string calldata _imageUrl,
        uint256 _goalAmount,
        uint256 _durationDays
    ) external returns (uint256 campaignId) {
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_title).length <= 100, "Title too long");
        require(bytes(_description).length > 0, "Description required");
        require(bytes(_description).length <= 5000, "Description too long");
        require(_goalAmount > 0, "Goal must be > 0");
        require(_durationDays >= 1 && _durationDays <= 365, "Duration: 1-365 days");

        campaignCount++;
        campaignId = campaignCount;

        campaigns[campaignId] = Campaign({
            id: campaignId,
            creator: msg.sender,
            title: _title,
            description: _description,
            imageUrl: _imageUrl,
            goalAmount: _goalAmount,
            raisedAmount: 0,
            deadline: block.timestamp + (_durationDays * 1 days),
            createdAt: block.timestamp,
            claimed: false,
            cancelled: false,
            donorCount: 0
        });

        creatorCampaigns[msg.sender].push(campaignId);

        emit CampaignCreated(
            campaignId,
            msg.sender,
            _title,
            _goalAmount,
            campaigns[campaignId].deadline
        );
    }

    /**
     * @notice Donate CFD tokens to a campaign
     * @dev Requires prior token approval. Caps donation at remaining goal amount
     *      and returns any excess to the donor. Blocks donations once goal is reached
     *      or deadline has passed.
     * @param _campaignId ID of the campaign to donate to
     * @param _amount Amount of CFD tokens to donate (in wei)
     */
    function donate(uint256 _campaignId, uint256 _amount) 
        external 
        nonReentrant 
        campaignExists(_campaignId) 
    {
        require(_amount > 0, "Amount must be > 0");
        
        Campaign storage campaign = campaigns[_campaignId];

        // Block donations if cancelled, claimed, deadline passed, or goal already reached
        require(!campaign.cancelled, "Campaign cancelled");
        require(!campaign.claimed, "Funds already claimed");
        require(block.timestamp < campaign.deadline, "Campaign ended");
        require(campaign.raisedAmount < campaign.goalAmount, "Goal already reached");

        // Cap donation at remaining amount needed
        uint256 remaining = campaign.goalAmount - campaign.raisedAmount;
        uint256 actualAmount = _amount > remaining ? remaining : _amount;

        // Transfer the actual (capped) amount from donor to contract
        cfiToken.safeTransferFrom(msg.sender, address(this), actualAmount);

        // If user sent approval for more than needed, only actualAmount is transferred
        // The excess stays with the donor (not transferred at all)

        // Track if this is a new donor
        if (donorContributions[_campaignId][msg.sender] == 0) {
            campaign.donorCount++;
            donorCampaigns[msg.sender].push(_campaignId);
        }

        // Update donation records
        donorContributions[_campaignId][msg.sender] += actualAmount;
        campaign.raisedAmount += actualAmount;

        campaignDonations[_campaignId].push(Donation({
            donor: msg.sender,
            amount: actualAmount,
            timestamp: block.timestamp
        }));

        emit DonationMade(_campaignId, msg.sender, actualAmount, campaign.raisedAmount);
    }

    /**
     * @notice Claim raised funds after campaign goal is reached
     * @dev Callable by campaign creator once goal is met — no need to wait for deadline.
     *      Deducts platform fee and transfers remainder to creator.
     * @param _campaignId ID of the campaign
     */
    function claimFunds(uint256 _campaignId) 
        external 
        nonReentrant 
        campaignExists(_campaignId) 
        onlyCreator(_campaignId) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(!campaign.claimed, "Already claimed");
        require(!campaign.cancelled, "Campaign cancelled");
        // Allow early claim as soon as goal is reached (no deadline requirement)
        require(campaign.raisedAmount >= campaign.goalAmount, "Goal not reached");

        campaign.claimed = true;

        uint256 platformFee = (campaign.raisedAmount * platformFeePercent) / BASIS_POINTS;
        uint256 creatorAmount = campaign.raisedAmount - platformFee;

        // Transfer platform fee to owner
        if (platformFee > 0) {
            cfiToken.safeTransfer(owner(), platformFee);
        }

        // Transfer remaining funds to creator
        cfiToken.safeTransfer(campaign.creator, creatorAmount);

        emit FundsClaimed(_campaignId, campaign.creator, creatorAmount, platformFee);
    }

    /**
     * @notice Claim refund for failed or cancelled campaign
     * @dev Only callable by donors after deadline if goal not met, or if campaign is cancelled
     * @param _campaignId ID of the campaign
     */
    function claimRefund(uint256 _campaignId) 
        external 
        nonReentrant 
        campaignExists(_campaignId) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        uint256 contribution = donorContributions[_campaignId][msg.sender];

        require(contribution > 0, "No contribution found");
        require(!campaign.claimed, "Funds already claimed");
        require(
            campaign.cancelled || 
            (block.timestamp >= campaign.deadline && campaign.raisedAmount < campaign.goalAmount),
            "Refund not available"
        );

        // Reset donor contribution
        donorContributions[_campaignId][msg.sender] = 0;

        // Transfer tokens back to donor
        cfiToken.safeTransfer(msg.sender, contribution);

        emit RefundClaimed(_campaignId, msg.sender, contribution);
    }

    /**
     * @notice Cancel a campaign
     * @dev Only callable by creator before deadline and before funds are claimed.
     *      Cancellation allows all donors to claim refunds regardless of raised amount.
     * @param _campaignId ID of the campaign to cancel
     */
    function cancelCampaign(uint256 _campaignId) 
        external 
        campaignExists(_campaignId) 
        onlyCreator(_campaignId) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(!campaign.cancelled, "Already cancelled");
        require(!campaign.claimed, "Funds already claimed");
        require(block.timestamp < campaign.deadline, "Campaign already ended");

        campaign.cancelled = true;

        emit CampaignCancelled(_campaignId, msg.sender);
    }

    // ============ View Functions ============

    /**
     * @notice Get campaign details
     * @param _campaignId ID of the campaign
     * @return Campaign struct
     */
    function getCampaign(uint256 _campaignId) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (Campaign memory) 
    {
        return campaigns[_campaignId];
    }

    /**
     * @notice Get all active campaigns (paginated)
     * @dev Active = not cancelled, not claimed, goal not yet reached, before deadline
     * @param _offset Starting index
     * @param _limit Maximum number of campaigns to return
     * @return campaignList Array of active campaigns
     */
    function getActiveCampaigns(uint256 _offset, uint256 _limit) 
        external 
        view 
        returns (Campaign[] memory campaignList) 
    {
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i <= campaignCount; i++) {
            if (_isActive(i)) {
                activeCount++;
            }
        }

        if (_offset >= activeCount) {
            return new Campaign[](0);
        }
        
        uint256 resultCount = activeCount - _offset;
        if (resultCount > _limit) {
            resultCount = _limit;
        }

        campaignList = new Campaign[](resultCount);
        uint256 currentIndex = 0;
        uint256 addedCount = 0;

        for (uint256 i = 1; i <= campaignCount && addedCount < resultCount; i++) {
            if (_isActive(i)) {
                if (currentIndex >= _offset) {
                    campaignList[addedCount] = campaigns[i];
                    addedCount++;
                }
                currentIndex++;
            }
        }
    }

    /**
     * @notice Get campaigns created by a specific address
     * @param _creator Address of the creator
     * @return Array of campaign IDs
     */
    function getCampaignsByCreator(address _creator) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return creatorCampaigns[_creator];
    }

    /**
     * @notice Get campaigns a user has donated to
     * @param _donor Address of the donor
     * @return Array of campaign IDs
     */
    function getCampaignsByDonor(address _donor) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return donorCampaigns[_donor];
    }

    /**
     * @notice Get all donations for a campaign
     * @param _campaignId ID of the campaign
     * @return Array of Donation structs
     */
    function getCampaignDonations(uint256 _campaignId) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (Donation[] memory) 
    {
        return campaignDonations[_campaignId];
    }

    /**
     * @notice Get donor's contribution to a campaign
     * @param _campaignId ID of the campaign
     * @param _donor Address of the donor
     * @return Amount contributed
     */
    function getDonorContribution(uint256 _campaignId, address _donor) 
        external 
        view 
        returns (uint256) 
    {
        return donorContributions[_campaignId][_donor];
    }

    /**
     * @notice Check if campaign is active (accepting donations)
     * @param _campaignId ID of the campaign
     * @return True if campaign is active
     */
    function isCampaignActive(uint256 _campaignId) external view returns (bool) {
        return _isActive(_campaignId);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update platform fee percentage
     * @param _newFeePercent New fee in basis points (e.g., 250 = 2.5%)
     */
    function updatePlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= MAX_FEE, "Fee too high");
        
        emit PlatformFeeUpdated(platformFeePercent, _newFeePercent);
        platformFeePercent = _newFeePercent;
    }

    /**
     * @notice Emergency withdraw stuck tokens (not campaign funds)
     * @param _token Token address to withdraw
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(cfiToken), "Cannot withdraw CFD");
        IERC20(_token).safeTransfer(owner(), _amount);
    }

    // ============ Internal Functions ============

    /**
     * @dev Check if a campaign is still active (accepting donations)
     *      Active = not cancelled, not claimed, goal not reached, before deadline
     */
    function _isActive(uint256 _campaignId) internal view returns (bool) {
        Campaign storage campaign = campaigns[_campaignId];
        return !campaign.cancelled && 
               !campaign.claimed && 
               campaign.raisedAmount < campaign.goalAmount &&
               block.timestamp < campaign.deadline;
    }
}