// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { AutoGen } from '../gen/autoGen';

async function main() {
  const [deployer] = await ethers.getSigners();
  const ipfsGateway = 'https://infura-ipfs.io/ipfs/';
  let jsonHash = 'QmUdPpayb4uwNxgMMGkcrbnNKWcrwDn6WSDKaCUCQw3pQd';

  console.log("Deploying contracts with the account:", deployer.address);

  const MKLContract = await ethers.getContractFactory("MochkaiLogo");
  const contract = await MKLContract.deploy();

  await contract.deployed();

  console.log("MKL deployed to:", contract.address);

  const supply = (await contract.getMaxSupply()).toNumber();

  if (!jsonHash) {
    let gen = new AutoGen(supply, {
      name: "SVG Logo",
      description: "This logo has been autogenerated by Mochkai's script. If you would like to see it live chack it out on twitch!! https://www.twitch.tv/mochkai",
      baseFolder: "/mochkai-logo/",
      fileNamePrefix: "logo_"
    });

    await gen.initIPFS();
    gen.setBaseSVG('assets/baseSVG.svg');
    gen.generateMetadata();
    gen.generateSVG();
    await gen.sendSVGFilesToIPFS();
    gen.generateJsonFiles();
    jsonHash = await gen.sendJSONFilesToIPFS();
  }

  console.log(await contract.updateBaseURI(ipfsGateway + jsonHash + "/"));


  for (let i = 1; i <= supply; i++) {
    const paddedNumber = i.toString().padStart(supply.toString().length, "0");
    const transaction = await contract.createWithMetadata(`logo_${paddedNumber}.json`);

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
