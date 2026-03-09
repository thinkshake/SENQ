// SPDX-License-Identifier: MIT
// Parimutuel prediction market — ETH only, owner-only resolution
pragma solidity ^0.8.24;

contract SENQMarket {
    // ── Types ──────────────────────────────────────────────────────

    struct Market {
        string question;
        uint256 bettingDeadline;
        uint256 totalYes;
        uint256 totalNo;
        bool resolved;
        bool outcome;
        bool cancelled;
    }

    // ── State ──────────────────────────────────────────────────────

    address public owner;
    uint256 public feePercent;
    uint256 public accumulatedFees;
    uint256 public nextMarketId;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => uint256)) public yesBets;
    mapping(uint256 => mapping(address => uint256)) public noBets;
    mapping(uint256 => mapping(address => bool)) public claimed;

    // ── Events ─────────────────────────────────────────────────────

    event MarketCreated(uint256 indexed marketId, string question, uint256 bettingDeadline);
    event BetPlaced(uint256 indexed marketId, address indexed bettor, bool yes, uint256 amount);
    event MarketResolved(uint256 indexed marketId, bool outcome);
    event PayoutClaimed(uint256 indexed marketId, address indexed claimant, uint256 amount);
    event MarketCancelled(uint256 indexed marketId);
    event RefundClaimed(uint256 indexed marketId, address indexed claimant, uint256 amount);

    // ── Modifiers ──────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ── Constructor ────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        feePercent = 2;
    }

    // ── Market lifecycle ───────────────────────────────────────────

    function createMarket(string calldata question, uint256 bettingDeadline) external returns (uint256 marketId) {
        require(bettingDeadline > block.timestamp, "Deadline must be in the future");

        marketId = nextMarketId++;
        markets[marketId] = Market({
            question: question,
            bettingDeadline: bettingDeadline,
            totalYes: 0,
            totalNo: 0,
            resolved: false,
            outcome: false,
            cancelled: false
        });

        emit MarketCreated(marketId, question, bettingDeadline);
    }

    function betYes(uint256 marketId) external payable {
        Market storage m = markets[marketId];
        require(m.bettingDeadline > 0, "Market does not exist");
        require(block.timestamp < m.bettingDeadline, "Betting closed");
        require(!m.cancelled, "Market cancelled");
        require(msg.value > 0, "Must send ETH");

        m.totalYes += msg.value;
        yesBets[marketId][msg.sender] += msg.value;

        emit BetPlaced(marketId, msg.sender, true, msg.value);
    }

    function betNo(uint256 marketId) external payable {
        Market storage m = markets[marketId];
        require(m.bettingDeadline > 0, "Market does not exist");
        require(block.timestamp < m.bettingDeadline, "Betting closed");
        require(!m.cancelled, "Market cancelled");
        require(msg.value > 0, "Must send ETH");

        m.totalNo += msg.value;
        noBets[marketId][msg.sender] += msg.value;

        emit BetPlaced(marketId, msg.sender, false, msg.value);
    }

    function resolve(uint256 marketId, bool outcome) external onlyOwner {
        Market storage m = markets[marketId];
        require(m.bettingDeadline > 0, "Market does not exist");
        require(block.timestamp >= m.bettingDeadline, "Betting still open");
        require(!m.resolved, "Already resolved");
        require(!m.cancelled, "Market cancelled");

        m.resolved = true;
        m.outcome = outcome;

        emit MarketResolved(marketId, outcome);
    }

    function claimPayout(uint256 marketId) external {
        Market storage m = markets[marketId];
        require(m.resolved, "Not resolved");
        require(!claimed[marketId][msg.sender], "Already claimed");

        uint256 userBet;
        uint256 winningPool;
        uint256 losingPool;

        if (m.outcome) {
            userBet = yesBets[marketId][msg.sender];
            winningPool = m.totalYes;
            losingPool = m.totalNo;
        } else {
            userBet = noBets[marketId][msg.sender];
            winningPool = m.totalNo;
            losingPool = m.totalYes;
        }

        require(userBet > 0, "No winning bet");

        claimed[marketId][msg.sender] = true;

        uint256 totalPool = winningPool + losingPool;
        uint256 fee = (losingPool * feePercent) / 100;
        uint256 distributable = totalPool - fee;
        uint256 payout = (distributable * userBet) / winningPool;

        accumulatedFees += fee * userBet / winningPool;

        (bool sent, ) = msg.sender.call{value: payout}("");
        require(sent, "Transfer failed");

        emit PayoutClaimed(marketId, msg.sender, payout);
    }

    // ── Cancellation ───────────────────────────────────────────────

    function cancelMarket(uint256 marketId) external onlyOwner {
        Market storage m = markets[marketId];
        require(m.bettingDeadline > 0, "Market does not exist");
        require(!m.resolved, "Already resolved");
        require(!m.cancelled, "Already cancelled");

        m.cancelled = true;

        emit MarketCancelled(marketId);
    }

    function claimRefund(uint256 marketId) external {
        Market storage m = markets[marketId];
        require(m.cancelled, "Not cancelled");
        require(!claimed[marketId][msg.sender], "Already claimed");

        uint256 refund = yesBets[marketId][msg.sender] + noBets[marketId][msg.sender];
        require(refund > 0, "Nothing to refund");

        claimed[marketId][msg.sender] = true;

        (bool sent, ) = msg.sender.call{value: refund}("");
        require(sent, "Transfer failed");

        emit RefundClaimed(marketId, msg.sender, refund);
    }

    // ── Admin ──────────────────────────────────────────────────────

    function withdrawFees() external onlyOwner {
        uint256 fees = accumulatedFees;
        require(fees > 0, "No fees");
        accumulatedFees = 0;

        (bool sent, ) = owner.call{value: fees}("");
        require(sent, "Transfer failed");
    }

    function setFeePercent(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 10, "Fee too high");
        feePercent = _feePercent;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }
}
