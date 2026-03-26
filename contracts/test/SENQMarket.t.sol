// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SENQMarket.sol";

contract MockJPYC {
    string public name = "Mock JPYC";
    string public symbol = "JPYC";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        return true;
    }
}

contract SENQMarketTest is Test {
    SENQMarket market;
    MockJPYC jpyc;
    address owner = address(this);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        jpyc = new MockJPYC();
        market = new SENQMarket(address(jpyc));

        jpyc.mint(alice, 100000 ether);
        jpyc.mint(bob, 100000 ether);

        vm.prank(alice);
        jpyc.approve(address(market), type(uint256).max);
        vm.prank(bob);
        jpyc.approve(address(market), type(uint256).max);
    }

    // ── Helpers ────────────────────────────────────────────────────

    function _createMarket() internal returns (uint256) {
        return market.createMarket("Will ETH hit 10k?", block.timestamp + 1 days);
    }

    function _placeBets(uint256 marketId) internal {
        vm.prank(alice);
        market.betYes(marketId, 3000 ether);

        vm.prank(bob);
        market.betNo(marketId, 1000 ether);
    }

    // ── Happy path: YES wins ───────────────────────────────────────

    function test_happyPath_yesWins() public {
        uint256 id = _createMarket();
        _placeBets(id);

        // Warp past deadline and resolve YES
        vm.warp(block.timestamp + 1 days);
        market.resolve(id, true);

        // Alice (YES bettor) claims
        uint256 balBefore = jpyc.balanceOf(alice);
        vm.prank(alice);
        market.claimPayout(id);
        uint256 balAfter = jpyc.balanceOf(alice);

        // Total pool = 4000 JPYC, fee = 2% of losing pool (1000) = 20 JPYC
        // Distributable = 4000 - 20 = 3980 JPYC
        // Alice gets all of it (only YES bettor)
        uint256 expectedPayout = 3980 ether;
        assertEq(balAfter - balBefore, expectedPayout);
    }

    // ── Happy path: NO wins ────────────────────────────────────────

    function test_happyPath_noWins() public {
        uint256 id = _createMarket();
        _placeBets(id);

        vm.warp(block.timestamp + 1 days);
        market.resolve(id, false);

        uint256 balBefore = jpyc.balanceOf(bob);
        vm.prank(bob);
        market.claimPayout(id);
        uint256 balAfter = jpyc.balanceOf(bob);

        // Total pool = 4000 JPYC, fee = 2% of losing pool (3000) = 60 JPYC
        // Distributable = 4000 - 60 = 3940 JPYC
        uint256 expectedPayout = 3940 ether;
        assertEq(balAfter - balBefore, expectedPayout);
    }

    // ── Cannot bet after deadline ──────────────────────────────────

    function test_cannotBetAfterDeadline() public {
        uint256 id = _createMarket();

        vm.warp(block.timestamp + 1 days);

        vm.prank(alice);
        vm.expectRevert("Betting closed");
        market.betYes(id, 1000 ether);
    }

    // ── Cannot resolve before deadline ─────────────────────────────

    function test_cannotResolveBeforeDeadline() public {
        uint256 id = _createMarket();

        vm.expectRevert("Betting still open");
        market.resolve(id, true);
    }

    // ── Cannot claim twice ─────────────────────────────────────────

    function test_cannotClaimTwice() public {
        uint256 id = _createMarket();
        _placeBets(id);

        vm.warp(block.timestamp + 1 days);
        market.resolve(id, true);

        vm.prank(alice);
        market.claimPayout(id);

        vm.prank(alice);
        vm.expectRevert("Already claimed");
        market.claimPayout(id);
    }

    // ── Cancel and refund flow ─────────────────────────────────────

    function test_cancelAndRefund() public {
        uint256 id = _createMarket();
        _placeBets(id);

        market.cancelMarket(id);

        uint256 aliceBefore = jpyc.balanceOf(alice);
        vm.prank(alice);
        market.claimRefund(id);
        assertEq(jpyc.balanceOf(alice) - aliceBefore, 3000 ether);

        uint256 bobBefore = jpyc.balanceOf(bob);
        vm.prank(bob);
        market.claimRefund(id);
        assertEq(jpyc.balanceOf(bob) - bobBefore, 1000 ether);
    }

    // ── Cannot refund twice ────────────────────────────────────────

    function test_cannotRefundTwice() public {
        uint256 id = _createMarket();
        _placeBets(id);
        market.cancelMarket(id);

        vm.prank(alice);
        market.claimRefund(id);

        vm.prank(alice);
        vm.expectRevert("Already claimed");
        market.claimRefund(id);
    }

    // ── Fee calculation and withdrawal ─────────────────────────────

    function test_feeCalculationAndWithdraw() public {
        uint256 id = _createMarket();
        _placeBets(id);

        vm.warp(block.timestamp + 1 days);
        market.resolve(id, true);

        vm.prank(alice);
        market.claimPayout(id);

        // Fee = 2% of losing pool (1000 JPYC) = 20 JPYC
        assertEq(market.accumulatedFees(), 20 ether);

        uint256 ownerBefore = jpyc.balanceOf(owner);
        market.withdrawFees();
        assertEq(jpyc.balanceOf(owner) - ownerBefore, 20 ether);
        assertEq(market.accumulatedFees(), 0);
    }

    // ── Only owner can resolve ─────────────────────────────────────

    function test_onlyOwnerCanResolve() public {
        uint256 id = _createMarket();

        vm.warp(block.timestamp + 1 days);

        vm.prank(alice);
        vm.expectRevert("Not owner");
        market.resolve(id, true);
    }

    // ── Only owner can cancel ──────────────────────────────────────

    function test_onlyOwnerCanCancel() public {
        uint256 id = _createMarket();

        vm.prank(alice);
        vm.expectRevert("Not owner");
        market.cancelMarket(id);
    }

    // ── Must send JPYC to bet ──────────────────────────────────────

    function test_mustSendJpycToBet() public {
        uint256 id = _createMarket();

        vm.prank(alice);
        vm.expectRevert("Must send JPYC");
        market.betYes(id, 0);
    }

    // ── Must approve before bet ────────────────────────────────────

    function test_mustApproveBeforeBet() public {
        uint256 id = _createMarket();

        address carol = address(0xCA201);
        jpyc.mint(carol, 100000 ether);

        // Carol has not approved the market contract
        vm.prank(carol);
        vm.expectRevert("Insufficient allowance");
        market.betYes(id, 1000 ether);
    }

    // ── Transfer ownership ─────────────────────────────────────────

    function test_transferOwnership() public {
        market.transferOwnership(alice);
        assertEq(market.owner(), alice);

        // Old owner can no longer act
        uint256 id = _createMarket();
        vm.warp(block.timestamp + 1 days);

        vm.expectRevert("Not owner");
        market.resolve(id, true);
    }

    // ── Multiple bettors on winning side ───────────────────────────

    function test_multipleBettorsProportionalPayout() public {
        uint256 id = _createMarket();

        // Alice bets 3000 YES, Bob bets 1000 YES
        vm.prank(alice);
        market.betYes(id, 3000 ether);
        vm.prank(bob);
        market.betYes(id, 1000 ether);

        // carol bets 4000 NO
        address carol = address(0xCA201);
        jpyc.mint(carol, 100000 ether);
        vm.prank(carol);
        jpyc.approve(address(market), type(uint256).max);
        vm.prank(carol);
        market.betNo(id, 4000 ether);

        vm.warp(block.timestamp + 1 days);
        market.resolve(id, true);

        // Total pool = 8000 JPYC, fee = 2% of 4000 = 80 JPYC, distributable = 7920
        // Alice: 7920 * 3000/4000 = 5940, Bob: 7920 * 1000/4000 = 1980
        uint256 aliceBefore = jpyc.balanceOf(alice);
        vm.prank(alice);
        market.claimPayout(id);
        assertEq(jpyc.balanceOf(alice) - aliceBefore, 5940 ether);

        uint256 bobBefore = jpyc.balanceOf(bob);
        vm.prank(bob);
        market.claimPayout(id);
        assertEq(jpyc.balanceOf(bob) - bobBefore, 1980 ether);
    }
}
