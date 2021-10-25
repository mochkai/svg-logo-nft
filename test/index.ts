import { expect } from "chai";
import { ethers } from "hardhat";
import { readFileSync } from 'fs';

describe("MockaiLogoContract", function () {

  let tokenURI = '';
  let metadata = '';

  before(async function () {
    const svgLogo = readFileSync('./assets/logo.svg', 'utf-8').toString();
    metadata = JSON.stringify({
      "name": "Original logo",
      "image": "data:image/svg+xml;base64," + Buffer.from(svgLogo, 'binary').toString('base64')
    });

    const MKLContract = await ethers.getContractFactory("MochkaiLogo");
    const contract = await MKLContract.deploy();
    await contract.deployed();

    const transaction = await contract.create(metadata);
    const tx = await transaction.wait() // Waiting for the token to be minted

    if (tx.events && tx.events.length > 0) {
      const event = tx.events[0];
      if (event.args) {
        const value = event.args[2];
        const tokenId = value.toNumber(); // Getting the tokenID
        tokenURI = await contract.tokenURI(tokenId) // Using the tokenURI from ERC721 to retrieve de metadata
      }
    }
  });

  it("Should mint a new logo and get the correct metadata back", async function () {
    expect(tokenURI).to.be.equal(metadata); // Comparing and testing
  });

  it("Should not fail minting", async function () {
    expect(tokenURI).to.not.be.equal(''); // Comparing and testing
  });
});
