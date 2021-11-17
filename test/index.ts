/* eslint-disable prettier/prettier */
/* eslint-disable no-unmodified-loop-condition */
/* eslint-disable prefer-const */
import { expect } from "chai";
import { ethers } from "hardhat";
import { AutoGen } from "../scripts/gen/autoGen";

let contractHash = '';
const BASE_URI = 'http://localhost:8080/ipfs/';
let metadata = "logo_01.json";

describe("Deploying Mochkai Logo Contract", function () {

  this.timeout(0);

  let tokenURI = "";
  let maxSupply = -1;
  let contract: any;

  before(async function () {

    const MKLContract = await ethers.getContractFactory("MochkaiLogo");
    contract = await MKLContract.deploy();
    await contract.deployed();

    contractHash = contract.address;

    maxSupply = (await contract.getMaxSupply()).toNumber();

    await contract.updateBaseURI(BASE_URI);
  });

  it("Should mint a new logo and get the correct metadata back", async function () {
    const paddedNumber = (1).toString().padStart(maxSupply.toString().length, "0");
    metadata = `logo_${paddedNumber}.json`;
    const transaction = await contract.createWithMetadata(metadata);

    const tx = await transaction.wait() // Waiting for the token to be minted

    if (tx.events && tx.events.length > 0) {
      const event = tx.events[0];
      if (event.args) {
        const value = event.args[2];
        const tokenId = value.toNumber(); // Getting the tokenID
        tokenURI = await contract.tokenURI(tokenId); // Using the tokenURI from ERC721 to retrieve de metadata
      }
    }

    expect(tokenURI).to.be.equal(BASE_URI + metadata); // Comparing and testing
  });

  it("Should not fail minting", async function () {
    expect(tokenURI).to.not.be.equal(""); // Comparing and testing
  });

  it("Should only mint up to maxSupply", async function () {
    let transactions: any = [];

    for (let i = 2; i <= maxSupply; i++) {
      const paddedNumber = i.toString().padStart(maxSupply.toString().length, "0");
      metadata = `logo_${paddedNumber}.json`;
      transactions[i] = await contract.createWithMetadata(metadata);

      const tx = await transactions[i].wait();

      if (tx.events && tx.events.length > 0) {
        const event = tx.events[0];
        if (event.args) {
          const value = event.args[2];
          const tokenId = value.toNumber(); // Getting the tokenID

          expect(tokenId).to.be.equal((await contract.totalSupply()).toNumber());
        }
      }
    }
  });

  it("Should fail mint above max Supply", async function () {
    await expect(contract.createWithMetadata(metadata)).to.be.revertedWith("Max supply reached");
  });

  it("Total Supply should be equal or less than max Supply", async function () {
    await expect((await contract.totalSupply()).toNumber()).to.be.lessThanOrEqual(maxSupply);
  });
});

describe("Checking Mochkai Logo Contract", function () {

  let tokenURI = "";
  let contract: any;
  let maxSupply = -1;

  before(async function () {
    const MKLContract = await ethers.getContractFactory("MochkaiLogo");
    contract = await MKLContract.attach(contractHash);

    await contract.deployed();

    let _owner = await contract.getOwner();

    maxSupply = (await contract.getMaxSupply()).toNumber();

    await contract.updateBaseURI(BASE_URI);
  });

  it("Check if contract is deployed", async function () {
    expect(contract.address).to.be.equal(contractHash); // Comparing and testing
  });

  it("Check if token is deployed", async function () {
    const paddedNumber = (1).toString().padStart(maxSupply.toString().length, "0");
    metadata = `logo_${paddedNumber}.json`;

    tokenURI = await contract.tokenURI(1);

    expect(tokenURI).to.be.equal(BASE_URI + metadata); // Comparing and testing
  });

  it("Update the metadata", async function () {
    metadata = "logo_new.json";
    await contract.updateTokenMetadata(1, metadata);

    tokenURI = await contract.tokenURI(1);

    expect(tokenURI).to.be.equal(BASE_URI + metadata); // Comparing and testing
  });

  it("Contract can be destroyed by owner", async function () {
    await contract.destroyContract();

    const MKLContract = await ethers.getContractFactory("MochkaiLogo");
    const noContract = await MKLContract.attach(contractHash);

    await noContract.deployed().catch((_e) => {
      expect(_e.reason).to.be.equal('contract not deployed');
    });
  });

});

describe("Testing Mint with IPFS", function () {

  this.timeout(0);

  let tokenURI = "";
  let maxSupply = -1;
  let contract: any;
  let gen = null;
  let jsonHash: any = null;

  before(async function () {
    const MKLContract = await ethers.getContractFactory("MochkaiLogo");
    contract = await MKLContract.deploy();
    await contract.deployed();

    contractHash = contract.address;

    maxSupply = (await contract.getMaxSupply()).toNumber();

    if (!jsonHash) {
      gen = new AutoGen(maxSupply, {
        name: "SVG Logo Test",
        description: "This is just for hardhat test",
        baseFolder: "/mochkai-logo-test/",
        fileNamePrefix: "test_"
      });

      await gen.initIPFS();
      gen.setBaseSVG('assets/baseSVG.svg');
      gen.generateMetadata();
      gen.generateSVG();
      await gen.sendSVGFilesToIPFS();
      gen.generateJsonFiles();
      jsonHash = await gen.sendJSONFilesToIPFS();
    }

    await contract.updateBaseURI(BASE_URI + jsonHash + "/");
  });

  it("Mint suply of logos with IPFS", async function () {

    for (let i = 1; i <= maxSupply; i++) {
      const paddedNumber = i.toString().padStart(maxSupply.toString().length, "0");
      const metadata = `logo_${paddedNumber}.json`;
      const transaction = await contract.createWithMetadata(metadata);

      const tx = await transaction.wait() // Waiting for the token to be minted

      if (tx.events && tx.events.length > 0) {
        const event = tx.events[0];
        if (event.args) {
          const value = event.args[2];
          const tokenId = value.toNumber(); // Getting the tokenID
          tokenURI = await contract.tokenURI(tokenId); // Using the tokenURI from ERC721 to retrieve de metadata
        }
      }

      //console.log(`Minting Logo#${paddedNumber}`);
      expect(tokenURI).to.be.equal(BASE_URI + jsonHash + "/" + metadata); // Comparing and testing
    }
  });

  it("Check if all suply has been minted", async function () {
    expect(maxSupply).to.be.equal((await contract.totalSupply()).toNumber());
  });
});