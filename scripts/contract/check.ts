// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { readFileSync } from "fs";
import * as readline from "readline";

let MKLContract: any = null;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Checking contracts with the account:", deployer.address);

  const svgLogo = readFileSync("./assets/logo.svg", "utf-8").toString();
  const metadata = "data:application/json," + JSON.stringify({
    name: "Original logo",
    image_data: "data:image/svg+xml;base64," + Buffer.from(svgLogo, "binary").toString("base64"),
  });

  MKLContract = await ethers.getContractFactory("MochkaiLogo");

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question("What is the contract address you wish to destroy? ", function (answer) {
    rl.close();

    console.log("Checking contract: ", answer);

    checkContract(answer);
  });
}

async function checkContract(address: string) {
  const contract = await MKLContract.attach(address); //0x880e8d04eD30d88A53dc3AE99044d6C1D07461cF

  await contract.deployed()
    .then(async () => {
      console.log("Found contract with address : ", contract.address)

      console.log(await contract.tokenURI(1));
    })
    .catch(() => console.log("Contract not found for address : ", contract.address));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
