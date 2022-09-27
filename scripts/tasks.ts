import { task } from "hardhat/config";
import { Contracts, Sleep } from "../common/utils";

const _bidPrice = process.env.BID_PRICE;
const _accountIndex = process.env.ACCOUNT_INDEX;
const _auctionId = process.env.AUCTION_ID;

task("addAuction", "Add a auction", async (_, hre) => {
    const { TokenAddress, URAuctionAddress } = Contracts(hre.network.name);
    const urAuction = await hre.ethers.getContractAt('URAuction', URAuctionAddress);
    const tinyToken = await hre.ethers.getContractAt('TinyToken', TokenAddress);
    const decimais = hre.ethers.BigNumber.from(10).pow(await tinyToken.decimals());
    const now = Math.floor(Date.now() / 1000);

    const tx = await urAuction.addAuction(804, now, now + 60 * 3, decimais.mul(10000));
    console.log("add auction success:", tx);
});

task("bid", "Bid price to auction", async (_, hre) => {
    const price = hre.ethers.BigNumber.from(_bidPrice || '0');
    const accountId = parseInt(_accountIndex || '0');

    const { TokenAddress, URAuctionAddress } = Contracts(hre.network.name);
    const urAuction = await hre.ethers.getContractAt('URAuction', URAuctionAddress);
    const tinyToken = await hre.ethers.getContractAt('TinyToken', TokenAddress);
    const decimais = hre.ethers.BigNumber.from(10).pow(await tinyToken.decimals());
    const signers = await hre.ethers.getSigners()
    let tx = await tinyToken.connect(signers[accountId]).approve(URAuctionAddress, decimais.mul(price));
    console.log("approve success:", tx);

    let allowance = await tinyToken.allowance(signers[accountId].address, URAuctionAddress);
    while (allowance.lt(decimais.mul(price))) {
        console.log("allowance:", hre.ethers.utils.formatUnits(allowance));
        allowance = await tinyToken.allowance(signers[accountId].address, URAuctionAddress);
        Sleep(1000 * 1);
    }
    tx = await urAuction.connect(signers[accountId]).bid(decimais.mul(price))
    console.log("bid success:", tx);
});

task("info", "Print auction info", async (_, hre) => {
    const auctionId = parseInt(_accountIndex || '0');

    const { URAuctionAddress } = Contracts(hre.network.name);
    const urAuction = await hre.ethers.getContractAt('URAuction', URAuctionAddress);
    const info = await urAuction.getAuctionInfo(auctionId);
    console.log("auction info:", info);
});

task("transfer", "Transfer TINC to account", async (_, hre) => {
    const from = 0;
    const to = 1;

    const { TokenAddress } = Contracts(hre.network.name);
    const tinyToken = await hre.ethers.getContractAt('TinyToken', TokenAddress);
    const decimais = hre.ethers.BigNumber.from(10).pow(await tinyToken.decimals());

    const signers = await hre.ethers.getSigners()
    const tx = await tinyToken.connect(signers[from]).transfer(signers[to].address, decimais.mul(100000));
    console.log("transfer success:", tx);
});

task("unseal", "Unseal auction", async (_, hre) => {
    const auctionId = parseInt(_auctionId || '1');
    const accountId = parseInt(_accountIndex || '0');

    const { URAuctionAddress } = Contracts(hre.network.name);
    const urAuction = await hre.ethers.getContractAt('URAuction', URAuctionAddress);
    const signers = await hre.ethers.getSigners()

    let tx = await urAuction.connect(signers[accountId]).unseal(auctionId);
    console.log("unseal success:", tx);
    tx = await urAuction.setHash(auctionId, tx.hash);
    console.log("setHash success:", tx);
});

task("claim", "Claim auction", async (_, hre) => {
    const auctionId = parseInt(_auctionId || '1');
    const accountId = parseInt(_accountIndex || '0');
    
    const { URAuctionAddress } = Contracts(hre.network.name);
    const urAuction = await hre.ethers.getContractAt('URAuction', URAuctionAddress);
    const signers = await hre.ethers.getSigners()

    let tx = await urAuction.connect(signers[accountId]).claim(auctionId)
    console.log("claim success:", tx);
});