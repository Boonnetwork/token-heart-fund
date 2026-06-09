// ABI for CFDGovernance.sol. Override at runtime via /settings if you redeploy.
export const GOVERNANCE_ABI = [
  'function proposalCount() view returns (uint256)',
  'function minStakeToPropose() view returns (uint256)',
  'function staking() view returns (address)',
  'function proposals(uint256) view returns (uint256 id, address proposer, string title, string description, uint256 createdAt, uint256 deadline, uint256 yesVotes, uint256 noVotes, bool executed)',
  'function hasVoted(uint256 id, address voter) view returns (bool)',
  'function getStatus(uint256 id) view returns (uint8)', // 0 Active, 1 Passed, 2 Rejected, 3 Executed

  'function createProposal(string title, string description, uint256 votingPeriodSecs) returns (uint256)',
  'function vote(uint256 id, bool support)',
  'function execute(uint256 id)',

  'event ProposalCreated(uint256 indexed id, address indexed proposer, string title, uint256 deadline)',
  'event VoteCast(uint256 indexed id, address indexed voter, bool support, uint256 weight)',
  'event ProposalExecuted(uint256 indexed id)',
];
