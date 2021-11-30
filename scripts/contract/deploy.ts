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
  let jsonHash = 'QmNuEDz56kNBYkob3Mz2tViVtcaEqKQ8fukn9SM2EBsmLa';

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
    console.log(`Item ${paddedNumber} about to be deployed`);
    contract.createWithMetadata(`logo_${paddedNumber}.json`)
      .then(() => console.log(`Item ${paddedNumber} deployed successfully`))
      .catch((error) => {
        console.log('\x1b[31m%s\x1b[0m', `Error deploying item ${paddedNumber}`);
        console.log(error);
        console.log('Contract address: \x1b[32m%s\x1b[0m', contract.address);
        process.exitCode = 1;
        process.exit(1);
      });
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
