import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

const RINKEBY_RPC_URL = process.env.RINKEBY_URL || "";
const TESTNET_ACC = process.env.TESTNET_ACC_PRIVATEKEY !== undefined ? [process.env.TESTNET_ACC_PRIVATEKEY] : [];

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: RINKEBY_RPC_URL,
      accounts: TESTNET_ACC,
      gas: 2100000,
      gasPrice: 8000000000
    }
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: 'd694e7fd-2655-4ec1-8295-b31dd3bc7667'
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
