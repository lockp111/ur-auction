import "dotenv/config";
import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "./scripts/tasks";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100000
      },
    },
  },
  gasReporter: {
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP,
    token: "BNB",
    gasPriceApi: "https://api.bscscan.com/api?module=proxy&action=eth_gasPrice",
    enabled: (process.env.GAS_REPORT) ? true : false,
  },
  networks: {
    testnet: {
      url: "https://data-seed-prebsc-1-s3.binance.org:8545/",
      chainId: 97,
      from: process.env.TESTNET_ADDRESS,
      accounts: process.env.TESTNET_PRIVATE_KEY?.split(","),
    },
    mainnet: {
      url: "https://bsc-dataseed1.binance.org/",
      chainId: 56,
      accounts: 'remote'
    },
  },
};

export default config;

task("accounts", "Prints account list", async (_, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const acc of accounts) {
    console.log(acc.address);
  }
})

task("genPrivateKey", "Generate private key", async (_, hre) => {
  const wallet = hre.ethers.Wallet.createRandom();
  console.log("adddress: ", wallet.address);
  console.log("publicKey:", wallet._signingKey().publicKey);
  console.log("privateKey", wallet._signingKey().privateKey);
})