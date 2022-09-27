//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface ITinyNFTLogic {
    function getLevelUpRule(uint8 grade_, uint8 currentLevel_)
        external
        view
        returns (
            uint256[] calldata counts,
            uint256[] calldata grades,
            uint256[] calldata levels,
            uint256[] calldata extras
        );

    function getPowerRange(uint8 grade_, uint8 currentLevel_)
        external
        view
        returns (uint256 lowerRange, uint256 upperRange);

    function getBasePowerRange(uint8 grade_) external view returns (uint256 lowerRange, uint256 upperRange);
}
