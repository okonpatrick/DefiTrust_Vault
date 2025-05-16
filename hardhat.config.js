// hardhat.config.js
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import "hardhat-gas-reporter";
import "@typechain/hardhat";

const FUJI_RPC_URL = process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
const META_PRIVATE_KEY = process.env.META_PRIVATE_KEY || "";
const REPORT_GAS = process.env.REPORT_GAS === "true";

const defineConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 43113,
    },
    fuji: {
      url: FUJI_RPC_URL,
      accounts: META_PRIVATE_KEY ? [META_PRIVATE_KEY] : [],
      chainId: 43113,
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  gasReporter: {
    enabled: REPORT_GAS,
    currency: "USD"
  },
};

export default defineConfig;