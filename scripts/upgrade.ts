import { network } from "hardhat";
import { upgradeURAuction } from "../common/init";
import { Contracts } from "../common/utils";

async function main() {
  const { URAuctionAddress } = Contracts(network.name)
  let unsealGap = 3600 * 2;
  if (process.env.UNSEAL_GAP) {
    unsealGap = parseInt(process.env.UNSEAL_GAP);
  }

  await upgradeURAuction(URAuctionAddress);
  console.log("[%s]URAuction upgrade success", network.name);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
