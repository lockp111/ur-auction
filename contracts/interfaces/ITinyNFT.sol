//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

interface ITinyNFT is IERC1155Upgradeable {
    enum ItemType {
        ITEM_TYPE_NONE,
        ITEM_TYPE_HERO, // 1
        ITEM_TYPE_ITEM  // 2
    }

    function itemCodeNumMap(uint16) external view returns (uint64);

    function getItem(uint256 _id)
        external
        view
        returns (
            uint256 tokenId,
            uint16 itemCode,
            uint8 itemGrade,
            uint8 itemType,
            uint8 itemLevel,
            uint256 gene,
            uint32 power,
            uint32 initPower
        );

    function mint(
        address to,
        uint16 itemCode,
        uint8 itemGrade,
        uint8 itemType,
        uint8 itemLevel,
        uint256 gene,
        uint32 power,
        uint32 initPower
    ) external returns (uint256 tokenId);

    function isOwnerOf(address _account, uint256 _id)
        external
        view
        returns (bool);

    function itemOwner(uint256 _id) external view returns (address);
}
