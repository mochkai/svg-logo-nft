/* eslint-disable prettier/prettier */
/* eslint-disable no-unmodified-loop-condition */
/* eslint-disable prefer-const */
import { expect } from "chai";
import { ethers } from "hardhat";
import { readFileSync } from "fs";

let contractHash = '';
let metadata = "";
const SVG_LOGO = readFileSync("./assets/logo.svg", "utf-8").toString();

describe("Deploying Mochkai Logo Contract", function () {

  let tokenURI = "";
  let maxSupply = -1;
  let contract: any;

  before(async function () {
    metadata = JSON.stringify({
      name: "Original logo",
      image: "data:image/svg+xml;base64," + Buffer.from(SVG_LOGO, "binary").toString("base64"),
    });

    const MKLContract = await ethers.getContractFactory("MochkaiLogo");
    contract = await MKLContract.deploy();
    await contract.deployed();

    contractHash = contract.address;

    maxSupply = (await contract.getMaxSupply()).toNumber();
  });

  it("Should mint a new logo and get the correct metadata back", async function () {
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

    expect(tokenURI).to.be.equal(metadata); // Comparing and testing
  });

  it("Should not fail minting", async function () {
    expect(tokenURI).to.not.be.equal(""); // Comparing and testing
  });

  it("Should only mint up to maxSupply", async function () {
    let transactions: any = [];

    for (let i = 2; i <= maxSupply; i++) {
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

  before(async function () {
    const MKLContract = await ethers.getContractFactory("MochkaiLogo");
    contract = await MKLContract.attach(contractHash);

    await contract.deployed();

    let _owner = await contract.getOwner();

    //console.log("DESTROY CONTRACT: ", await contract.destroyContract());

    //console.log("NOT SURE: ", contract.address);

    // tokenURI = await contract.setTokenURI(1, metadata);

    // console.log(tokenURI);
  });

  it("Check if contract is deployed", async function () {
    expect(contract.address).to.be.equal(contractHash); // Comparing and testing
  });

  it("Check if token is deployed", async function () {
    tokenURI = await contract.tokenURI(1);

    expect(tokenURI).to.be.equal(metadata); // Comparing and testing
  });

  it("Update the metadata", async function () {
    metadata = "data:application/json," + JSON.stringify({
      name: "Original logo",
      image: "data:image/svg+xml;base64," + Buffer.from(SVG_LOGO, "binary").toString("base64"),
    });

    await contract.updateTokenMetadata(1, metadata);

    tokenURI = await contract.tokenURI(1);

    expect(tokenURI).to.be.equal(metadata); // Comparing and testing
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
