// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IStaking {
    function stakes(address) external view returns (uint256 amount, uint256 rewardDebt, uint256 lastUpdate);
}

/**
 * @title CFDGovernance
 * @notice On-chain proposal & voting system. Vote weight = current
 *         staked balance in the CFDStaking contract at vote time.
 *         This is a signaling DAO — `execute()` records the result on
 *         chain but does not perform arbitrary calls. Designed to be
 *         extended with a Timelock + executor in a future upgrade.
 */
contract CFDGovernance is Ownable {
    enum Status { Active, Passed, Rejected, Executed }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 createdAt;
        uint256 deadline;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
    }

    IStaking public immutable staking;
    uint256 public minStakeToPropose;
    uint256 public proposalCount;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string title, uint256 deadline);
    event VoteCast(uint256 indexed id, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);

    constructor(address _staking, uint256 _minStakeToPropose) Ownable(msg.sender) {
        require(_staking != address(0), "Invalid staking");
        staking = IStaking(_staking);
        minStakeToPropose = _minStakeToPropose;
    }

    function _weight(address user) internal view returns (uint256) {
        (uint256 amount,,) = staking.stakes(user);
        return amount;
    }

    function createProposal(
        string calldata title,
        string calldata description,
        uint256 votingPeriodSecs
    ) external returns (uint256 id) {
        require(bytes(title).length > 0 && bytes(title).length <= 140, "Invalid title");
        require(bytes(description).length <= 10000, "Description too long");
        require(votingPeriodSecs >= 1 hours && votingPeriodSecs <= 30 days, "Invalid period");
        require(_weight(msg.sender) >= minStakeToPropose, "Insufficient stake");

        proposalCount++;
        id = proposalCount;
        proposals[id] = Proposal({
            id: id,
            proposer: msg.sender,
            title: title,
            description: description,
            createdAt: block.timestamp,
            deadline: block.timestamp + votingPeriodSecs,
            yesVotes: 0,
            noVotes: 0,
            executed: false
        });

        emit ProposalCreated(id, msg.sender, title, proposals[id].deadline);
    }

    function vote(uint256 id, bool support) external {
        Proposal storage p = proposals[id];
        require(p.id != 0, "Invalid proposal");
        require(block.timestamp < p.deadline, "Voting ended");
        require(!hasVoted[id][msg.sender], "Already voted");

        uint256 w = _weight(msg.sender);
        require(w > 0, "No voting power");

        hasVoted[id][msg.sender] = true;
        if (support) p.yesVotes += w;
        else p.noVotes += w;

        emit VoteCast(id, msg.sender, support, w);
    }

    function execute(uint256 id) external {
        Proposal storage p = proposals[id];
        require(p.id != 0, "Invalid proposal");
        require(block.timestamp >= p.deadline, "Voting not ended");
        require(!p.executed, "Already executed");
        require(p.yesVotes > p.noVotes, "Proposal did not pass");

        p.executed = true;
        emit ProposalExecuted(id);
    }

    function getStatus(uint256 id) external view returns (Status) {
        Proposal storage p = proposals[id];
        require(p.id != 0, "Invalid proposal");
        if (p.executed) return Status.Executed;
        if (block.timestamp < p.deadline) return Status.Active;
        if (p.yesVotes > p.noVotes) return Status.Passed;
        return Status.Rejected;
    }

    function setMinStakeToPropose(uint256 newMin) external onlyOwner {
        minStakeToPropose = newMin;
    }
}
