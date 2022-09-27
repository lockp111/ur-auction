// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./interfaces/ITinyToken.sol";
import "./interfaces/ITinyNFT.sol";
import "./interfaces/ITinyNFTLogic.sol";

error NotBidder();
error Hashed();
error ErrPrice(uint256 current, uint256 bid);

contract URAuction is OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for ITinyToken;

    struct AuctionInfo {
        // 初始参数
        uint16 itemCode; // code
        uint64 startTime;
        uint64 endTime;
        // 竞价中参数
        uint256 offer; // 当前出价
        address bidder; // 当前竞拍者
        // uint64 timestamp; // 竞价时间，不需要了
        // 领取参数
        uint32 _seed;
        bool claimed;
    }

    ITinyToken public TinyToken;
    ITinyNFT public TinyNFT;
    ITinyNFTLogic public TinyNFTLogic;

    AuctionInfo[] private infos;

    uint32 private bidId;
    uint32 private auctionId;
    uint64 private unsealGap;

    event AuctionAdd(
        uint32 auctionId,
        uint16 itemCode,
        uint64 startTime,
        uint64 endTime,
        uint256 starting
    );

    event Bidding(
        uint32 id,
        uint32 auctionId,
        uint256 offer,
        address bidder,
        uint64 timestamp
    );

    event AuctionUnsealRequest(uint32 auctionId, address from);
    event AuctionHashed(uint32 auctionId, uint32 _seed);

    function initialize(
        address tokenAddress,
        address nftAddress,
        address logicAddress,
        uint64 _unsealGap
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();

        TinyToken = ITinyToken(tokenAddress);
        TinyNFT = ITinyNFT(nftAddress);
        TinyNFTLogic = ITinyNFTLogic(logicAddress);
        unsealGap = _unsealGap; // 3600 * 2s = 2小时
    }

    // 解封
    function unseal(uint32 _auctionId) external nonReentrant {
        AuctionInfo memory info = infos[_auctionId - 1];
        // 确认是否已经领取
        require(!info.claimed && info._seed == 0, "unsealed");

        // 确认是否最后出价者
        if (info.bidder != msg.sender) {
            revert NotBidder();
        }

        // 确认时间是否是已结束
        uint64 current = (uint64(block.timestamp) - unsealGap);
        require(info.endTime < current, "unfinished");
        emit AuctionUnsealRequest(_auctionId, msg.sender);
    }

    function setHash(uint32 _auctionId, bytes32 _hash) external onlyOwner {
        AuctionInfo storage info = infos[_auctionId - 1];
        require(info.endTime < uint64(block.timestamp), "unfinished");
        // check hashed
        if (info._seed != 0) {
            revert Hashed();
        }

        bytes32 addrBytes = bytes32(uint256(uint160(info.bidder)));

        uint32 seed1 = uint32(uint8(_hash[14])) << 16;
        uint32 seed2 = uint32(uint8(addrBytes[22])) << 8;
        uint32 seed3 = uint32(uint8(_hash[3]));

        info._seed = seed1 + seed2 + seed3;
        emit AuctionHashed(_auctionId, info._seed);
    }

    function _randHeroPower(uint32 randval) internal view returns (uint32) {
        (uint256 lowerRange, uint256 upperRange) = TinyNFTLogic
            .getBasePowerRange(6);
        uint256 randPower = lowerRange +
            (((upperRange - lowerRange) * uint256(randval)) / 2000);
        return uint32(randPower);
    }

    // 领取到自己的地址
    function claim(uint32 _auctionId) external nonReentrant {
        AuctionInfo storage info = infos[_auctionId - 1];
        require(!info.claimed && info._seed != 0, "invalid claim");
        if (info.bidder != msg.sender) {
            revert NotBidder();
        }

        uint32 power;
        uint32 val3 = uint32((uint64(info._seed) * 2001) >> 24); // 0 ~ 2000
        power = _randHeroPower(val3);

        TinyNFT.mint(
            msg.sender,
            info.itemCode,
            6,
            uint8(ITinyNFT.ItemType.ITEM_TYPE_HERO),
            1,
            0,
            power,
            power
        );
        info.claimed = true;
    }

    function addAuction(
        uint16 itemCode,
        uint64 startTime,
        uint64 endTime,
        uint256 starting
    ) external onlyOwner {
        require(itemCode > 800 && itemCode <= 812, "invalid itemCode");
        require(endTime > startTime, "invalid time");

        AuctionInfo memory info;
        if (auctionId > 0) {
            info = infos[auctionId - 1];
            require(
                info.endTime < startTime &&
                    info.endTime < uint64(block.timestamp),
                "unfinished"
            );
        }

        info.itemCode = itemCode;
        info.startTime = startTime;
        info.endTime = endTime;
        info.offer = starting;
        info.bidder = address(0);
        info._seed = 0;
        info.claimed = false;
        infos.push(info);
        auctionId++;
        emit AuctionAdd(auctionId, itemCode, startTime, endTime, starting);
    }

    function getAuctionInfo(uint32 _auctionId)
        public
        view
        returns (AuctionInfo memory)
    {
        return infos[_auctionId - 1];
    }

    function bid(uint256 price) external nonReentrant {
        AuctionInfo storage info = infos[auctionId - 1];
        uint64 currentTime = uint64(block.timestamp);
        require(
            info.endTime > currentTime && info.startTime < currentTime,
            "not auction time"
        );

        if (((info.offer * 12) / 10) > price) {
            revert ErrPrice(info.offer, price);
        }

        // transfer
        TinyToken.safeTransferFrom(msg.sender, address(this), price);
        if (info.bidder != address(0)) {
            TinyToken.safeTransfer(info.bidder, info.offer);
        }

        info.offer = price;
        info.bidder = msg.sender;
        bidId++;
        emit Bidding(bidId, auctionId, price, msg.sender, currentTime);
    }
}
