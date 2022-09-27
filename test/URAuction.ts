import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { deployEmptyAuction, deployStartAuction, deployEndAuction } from "../common/init";

describe("URAuction", function () {
  // deploy
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { urAuction, owner } = await loadFixture(deployEmptyAuction);
      expect(await urAuction.owner()).to.equal(owner.address);
    });

    it("Should set the right token", async function () {
      const { token } = await loadFixture(deployEmptyAuction);
      expect(await token.symbol()).to.equal('TINC');
    });
  });

  // add auction
  describe("Add Auction", function () {
    it("Should add auction 801", async function () {
      const { urAuction, owner } = await loadFixture(deployEmptyAuction);
      const start = await time.latest();
      await urAuction.connect(owner).addAuction(801, start, start + 3600, 100);
      const info = await urAuction.getAuctionInfo(1);
      expect(info['itemCode']).to.equal(801);
    });

    it("Should add auction 802", async function () {
      const { urAuction, owner } = await loadFixture(deployEmptyAuction);
      const start = await time.latest();
      await urAuction.connect(owner).addAuction(801, start - 3600, start, 100);
      await urAuction.connect(owner).addAuction(802, start + 3600, start + 3600 * 2, 1000);
      const info = await urAuction.getAuctionInfo(2);
      expect(info['itemCode']).to.equal(802);
    });
  });

  // bid
  describe("Bid", function () {
    it("Should bid price 120", async function () {
      const { urAuction, token, owner, decimals } = await loadFixture(deployStartAuction);
      // transfer
      const [_, player1, player2] = await ethers.getSigners();
      await token.connect(owner).transfer(player1.address, decimals.mul(120));
      await token.connect(owner).transfer(player2.address, decimals.mul(130));
      await token.connect(player1).approve(urAuction.address, decimals.mul(120));
      await token.connect(player2).approve(urAuction.address, decimals.mul(130));

      // bid
      await urAuction.connect(player1).bid(decimals.mul(120).toString());
      await expect(urAuction.connect(player2).bid(decimals.mul(120)))
        .to.be.revertedWithCustomError(urAuction, 'ErrPrice');

      const info = await urAuction.getAuctionInfo(1);
      const balance = await token.balanceOf(player1.address);
      expect(info['offer']).to.equal(decimals.mul(120));
      expect(info['bidder']).to.equal(player1.address);
      expect(balance).to.equal(0);
    });

    it("Should return last bidder", async function () {
      const { urAuction, token, owner, decimals } = await loadFixture(deployStartAuction);
      // transfer
      const [_, player1, player2] = await ethers.getSigners();
      await token.connect(owner).transfer(player1.address, decimals.mul(120));
      await token.connect(owner).transfer(player2.address, decimals.mul(150));
      await token.connect(player1).approve(urAuction.address, decimals.mul(120));
      await token.connect(player2).approve(urAuction.address, decimals.mul(150));

      // player1 bid
      await urAuction.connect(player1).bid(decimals.mul(120));
      let balance = await token.balanceOf(player1.address);
      expect(balance).to.equal(0);

      let info = await urAuction.getAuctionInfo(1);
      expect(info['offer']).to.equal(decimals.mul(120));
      expect(info['bidder']).to.equal(player1.address);

      // player2 bid
      await urAuction.connect(player2).bid(decimals.mul(150));
      balance = await token.balanceOf(player1.address);
      expect(balance).to.equal(decimals.mul(120));
      balance = await token.balanceOf(player2.address);
      expect(balance).to.equal(0);

      info = await urAuction.getAuctionInfo(1);
      expect(info['offer']).to.equal(decimals.mul(150));
      expect(info['bidder']).to.equal(player2.address);
    });
  });

  // unseal
  describe("Unseal", function () {
    it("Should not unseal while unfinished", async function () {
      const { urAuction, player } = await loadFixture(deployEndAuction);
      await expect(urAuction.connect(player).unseal(1))
        .to.be.revertedWith('unfinished');
    });

    it("Should not setHash while unfinished", async function () {
      const { urAuction, owner } = await loadFixture(deployEndAuction);
      await expect(urAuction.connect(owner).setHash(1, ethers.utils.sha256(owner.address)))
        .to.be.revertedWith('unfinished');
    });

    it("Should not setHash while not owner", async function () {
      const { urAuction, player } = await loadFixture(deployEndAuction);
      await expect(urAuction.connect(player).setHash(1, ethers.utils.sha256(player.address)))
        .to.be.revertedWithCustomError(urAuction, 'Unauthorized');
    });

    it("Should unseal success", async function () {
      const { urAuction, owner, player } = await loadFixture(deployEndAuction);
      await network.provider.send("evm_increaseTime", [3600 * 3])
      const tx = await urAuction.connect(player).unseal(1);
      await urAuction.connect(owner).setHash(1, tx.blockHash);
      const info = await urAuction.getAuctionInfo(1);
      expect(info['_seed']).to.not.equal(0);
    });

    it("Should not repeat for unseal and setHash", async function () {
      const { urAuction, owner, player } = await loadFixture(deployEndAuction);
      await network.provider.send("evm_increaseTime", [3600 * 3])
      const tx = await urAuction.connect(player).unseal(1);
      await urAuction.connect(owner).setHash(1, tx.blockHash);

      await expect(urAuction.connect(owner).setHash(1, tx.blockHash))
        .to.be.revertedWithCustomError(urAuction, 'Hashed');
      await expect(urAuction.connect(player).unseal(1))
        .to.be.revertedWith('unsealed');
    });
  });

});