import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, network, upgrades } from "hardhat";
import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { Signer } from 'ethers';

let Sender: Signer;
if (network.name == "mainnet") {
    console.log("new ledger sender");
    Sender = new LedgerSigner(ethers.provider);
}

export async function deployURAuction(
    govAddr: string,
    tokenAddr: string,
    nftAddr: string,
    logicAddr: string,
    unsealGap: number = 3600,
) {
    const URAuction = await ethers.getContractFactory("URAuction", Sender);
    const urAuction = await upgrades.deployProxy(URAuction,
        [govAddr, tokenAddr, nftAddr, logicAddr, unsealGap],
        { initializer: 'initialize' },
    );
    await urAuction.deployed();
    return urAuction;
}

export async function upgradeURAuction(proxyAddr: string) {
    const URAuction = await ethers.getContractFactory("URAuction", Sender);
    const urAuction = await upgrades.upgradeProxy(proxyAddr, URAuction);
    await urAuction.deployed();
    return urAuction;
}

export async function deployTestToken() {
    const [owner] = await ethers.getSigners();
    const TinyToken = await ethers.getContractFactory("TinyToken", Sender);
    const supply = ethers.BigNumber.from(1e18.toString(10)).mul(100000);
    const token = await TinyToken.deploy(supply);
    await token.deployed();
    return { token, owner };
}

export async function deployEmptyAuction() {
    const { token, owner } = await deployTestToken();
    const urAuction = await deployURAuction(owner.address, token.address, token.address, token.address);
    return { urAuction, token, owner };
}

export async function deployStartAuction() {
    const { token, owner } = await deployTestToken();
    const urAuction = await deployURAuction(owner.address, token.address, token.address, token.address);
    const decimals = ethers.BigNumber.from(10).pow(await token.decimals())
    const start = await time.latest();
    await urAuction.connect(owner).addAuction(801, start - 1, start + 3600, decimals.mul(100));
    return { urAuction, token, owner, decimals };
}

export async function deployEndAuction() {
    const { urAuction, token, owner, decimals } = await deployStartAuction();

    // transfer
    const [, player] = await ethers.getSigners();
    await token.connect(owner).transfer(player.address, decimals.mul(120));
    await token.connect(player).approve(urAuction.address, decimals.mul(120));

    // bid
    await urAuction.connect(player).bid(decimals.mul(120).toString());
    return { urAuction, owner, player };
}