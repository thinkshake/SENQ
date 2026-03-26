// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SENQMarket.sol";

contract Deploy is Script {
    function run() external {
        address jpycToken = vm.envAddress("JPYC_TOKEN_ADDRESS");
        vm.startBroadcast();
        SENQMarket market = new SENQMarket(jpycToken);
        console.log("SENQMarket deployed at:", address(market));
        vm.stopBroadcast();
    }
}
