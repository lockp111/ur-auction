import { network } from "hardhat";
import { deployURAuction } from "../common/init";
import { Contracts } from "../common/utils";

async function main() {
  const { TokenAddress, NFTAddress, LogicAddress } = Contracts(network.name)
  let unsealGap = 3600 * 2;
  if (process.env.UNSEAL_GAP) {
    unsealGap = parseInt(process.env.UNSEAL_GAP);
  }

  const urAuction = await deployURAuction(network.config.from!, TokenAddress, NFTAddress, LogicAddress, unsealGap);
  console.log("[%s]URAuction deployed to: %s", network.name, urAuction.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
