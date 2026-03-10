// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SENQMarket.sol";

contract SENQMarketTest is Test {
    SENQMarket market;
    address owner = address(this);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        market = new SENQMarket();
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    // ── Helpers ────────────────────────────────────────────────────

    function _createMarket() internal returns (uint256) {
        return market.createMarket("Will ETH hit 10k?", block.timestamp + 1 days);
    }

    function _placeBets(uint256 marketId) internal {
        vm.prank(alice);
        market.betYes{value: 3 ether}(marketId);

        vm.prank(bob);
        market.betNo{value: 1 ether}(marketId);
    }

    // ── Happy path: YES wins ───────────────────────────────────────

    function test_happyPath_yesWins() public {
        uint256 id = _createMarket();
        _placeBets(id);

        // Warp past deadline and resolve YES
        vm.warp(block.timestamp + 1 days);
        market.resolve(id, true);

        // Alice (YES bettor) claims
        uint256 balBefore = alice.balance;
        vm.prank(alice);
        market.claimPayout(id);
        uint256 balAfter = alice.balance;

        // Total pool = 4 ETH, fee = 2% of losing pool (1 ETH) = 0.02 ETH
        // Distributable = 4 - 0.02 = 3.98 ETH
        // Alice gets all of it (only YES bettor)
        uint256 expectedPayout = 3.98 ether;
        assertEq(balAfter - balBefore, expectedPayout);
    }

    // ── Happy path: NO wins ────────────────────────────────────────

    function test_happyPath_noWins() public {
        uint256 id = _createMarket();
        _placeBets(id);

        vm.warp(block.timestamp + 1 days);
        market.resolve(id, false);

        uint256 balBefore = bob.balance;
        vm.prank(bob);
        market.claimPayout(id);
        uint256 balAfter = bob.balance;

        // Total pool = 4 ETH, fee = 2% of losing pool (3 ETH) = 0.06 ETH
        // Distributable = 4 - 0.06 = 3.94 ETH
        uint256 expectedPayout = 3.94 ether;
        assertEq(balAfter - balBefore, expectedPayout);
    }

    // ── Cannot bet after deadline ──────────────────────────────────

    function test_cannotBetAfterDeadline() public {
        uint256 id = _createMarket();

        vm.warp(block.timestamp + 1 days);

        vm.prank(alice);
        vm.expectRevert("Betting closed");
        market.betYes{value: 1 ether}(id);
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

        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        market.claimRefund(id);
        assertEq(alice.balance - aliceBefore, 3 ether);

        uint256 bobBefore = bob.balance;
        vm.prank(bob);
        market.claimRefund(id);
        assertEq(bob.balance - bobBefore, 1 ether);
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

        // Fee = 2% of losing pool (1 ETH) = 0.02 ETH
        assertEq(market.accumulatedFees(), 0.02 ether);

        uint256 ownerBefore = owner.balance;
        market.withdrawFees();
        assertEq(owner.balance - ownerBefore, 0.02 ether);
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

    // ── Must send ETH to bet ───────────────────────────────────────

    function test_mustSendEthToBet() public {
        uint256 id = _createMarket();

        vm.prank(alice);
        vm.expectRevert("Must send ETH");
        market.betYes{value: 0}(id);
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

        // Alice bets 3 YES, Bob bets 1 YES
        vm.prank(alice);
        market.betYes{value: 3 ether}(id);
        vm.prank(bob);
        market.betYes{value: 1 ether}(id);

        // carol bets 4 NO
        address carol = address(0xCA201);
        vm.deal(carol, 100 ether);
        vm.prank(carol);
        market.betNo{value: 4 ether}(id);

        vm.warp(block.timestamp + 1 days);
        market.resolve(id, true);

        // Total pool = 8 ETH, fee = 2% of 4 = 0.08 ETH, distributable = 7.92
        // Alice: 7.92 * 3/4 = 5.94, Bob: 7.92 * 1/4 = 1.98
        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        market.claimPayout(id);
        assertEq(alice.balance - aliceBefore, 5.94 ether);

        uint256 bobBefore = bob.balance;
        vm.prank(bob);
        market.claimPayout(id);
        assertEq(bob.balance - bobBefore, 1.98 ether);
    }

    // Allow contract to receive ETH (for fee withdrawal)
    receive() external payable {}
}
