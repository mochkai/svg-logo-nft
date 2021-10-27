/* eslint-disable prettier/prettier */
/* eslint-disable no-unmodified-loop-condition */
/* eslint-disable prefer-const */
import { expect } from "chai";
import { ethers } from "hardhat";
import { readFileSync } from "fs";

describe("MockaiLogoContract", function () {

  let tokenURI = "";
  let metadata = "";
  let maxSupply = -1;
  let contract: any;

  before(async function () {
    const svgLogo = readFileSync("./assets/logo.svg", "utf-8").toString();
    metadata = JSON.stringify({
      name: "Original logo",
      image: "data:image/svg+xml;base64," + Buffer.from(svgLogo, "binary").toString("base64"),
    });

    const MKLContract = await ethers.getContractFactory("MochkaiLogo");
    contract = await MKLContract.deploy();
    await contract.deployed();

    maxSupply = (await contract.getMaxSupply()).toNumber();

    const transaction = await contract.create(metadata);

    const tx = await transaction.wait() // Waiting for the token to be minted

    if (tx.events && tx.events.length > 0) {
      const event = tx.events[0];
      if (event.args) {
        const value = event.args[2];
        const tokenId = value.toNumber(); // Getting the tokenID
        tokenURI = await contract.tokenURI(tokenId); // Using the tokenURI from ERC721 to retrieve de metadata
      }
    }
  });

  it("Should mint a new logo and get the correct metadata back", async function () {
    expect(tokenURI).to.be.equal(metadata); // Comparing and testing
  });

  it("Should not fail minting", async function () {
    expect(tokenURI).to.not.be.equal(""); // Comparing and testing
  });

  it("Should only mint up to maxSupply", async function () {
    let transactions: any = [];

    for (let i = 2; i <= maxSupply; i++) {
      transactions[i] = await contract.create(metadata);

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
    await expect(contract.create(metadata)).to.be.revertedWith("Max supply reached");
  });

  it("Total Supply should be equal or less than max Supply", async function () {
    await expect((await contract.totalSupply()).toNumber()).to.be.lessThanOrEqual(maxSupply);
  });
});
