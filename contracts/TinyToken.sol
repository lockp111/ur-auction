// contracts/TinyToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TinyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("TinyCoin", "TINC") {
        _mint(msg.sender, initialSupply);
    }
}