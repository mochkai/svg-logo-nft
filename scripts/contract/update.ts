// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { readFileSync } from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Checking contracts with the account:", deployer.address);

  const svgLogo = readFileSync("./assets/logo.svg", "utf-8").toString();

  const MKLContract = await ethers.getContractFactory("MochkaiLogo");
  const contract = await MKLContract.attach("0x880e8d04eD30d88A53dc3AE99044d6C1D07461cF");

  await contract.deployed();

  console.log("Found contract with address : ", contract.address);

  await contract.updateTokenMetadata(1, "https://ipfs.infura.io/ipfs/QmTMpNk1CQ3AMyTJUgvGxoXa3Wt5Be42km79GtZiNfFAdY/metadata.json");

  setTimeout(async () => console.log(await contract.tokenURI(1)), 5000);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
