// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { readFileSync } from "fs";
import { AutoGen } from '../gen/autoGen';

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const svgLogo = readFileSync("./assets/logo.svg", "utf-8").toString();
  const metadata = JSON.stringify({
    name: "Original logo",
    image_data: "data:image/svg+xml;base64," + Buffer.from(svgLogo, "binary").toString("base64"),
  });

  const MKLContract = await ethers.getContractFactory("MochkaiLogo");
  const contract = await MKLContract.deploy();

  await contract.deployed();

  console.log("MKL deployed to:", contract.address);

  let supply = 10;
  let gen = new AutoGen(supply);

  await gen.initIPFS();
  gen.setBaseSVG('assets/baseSVG.svg');
  gen.generateMetadataAttributes();
  await gen.generateMetadata();
  let jsonHash = await gen.generateJsonFiles();

  for (let i = 0; i < supply; i++) {
    const paddedNumber = i.toString().padStart(supply.toString().length, "0");
    const transaction = await contract.createWithMetadata(`${jsonHash}/logo_${paddedNumber}.json`);

    const tx = await transaction.wait() // Waiting for the token to be minted

    console.log(tx);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
