/* eslint-disable prettier/prettier */
/* eslint-disable no-unmodified-loop-condition */
/* eslint-disable prefer-const */
import { expect, util } from "chai";
import { ethers } from "hardhat";
import { AutoGen } from "../scripts/gen/autoGen";

let contractHash = '';
const BASE_URI = 'http://localhost:8080/ipfs/';
let metadata = "logo_01.json";
let gasReporting: any = {};

const clearLastLine = () => {
  process.stdout.moveCursor(0, -1) // up one line
  process.stdout.clearLine(1) // from cursor to end
}

const gasFee = (_gweiValue: number) => {

  const _eth = _gweiValue * 0.000000001;
  const _usd = Number((_eth * 4005.38).toFixed(2));
  const _eur = Number((_eth * 3475.39).toFixed(2));
  const _gbp = Number((_eth * 3089.33).toFixed(2));

  return {
    gwei: _gweiValue,
    eth: _eth,
    usd: _usd,
    eur: _eur,
    gbp: _gbp
  }
}

const generateReport = (_reports: any) => {
  const div = '|··························|······························|··············|··············|··············|··············|··············|··············|';
  console.log(div);
  console.log(`|  Report Type             ·  Method                      ·  Min         ·  Max         ·  Avg         ·  # calls     ·  eth (avg)   ·  usd (avg)   │`);
  console.log(div);

  let gweiTotal: any = 0;
  let callsTotal: any = 0;
  let ethTotal: any = 0;
  let usdTotal: any = 0;
  for (let report in _reports) {
    console.log(div);

    const _report = _reports[report];

    for (let method in _report) {
      let min: any = "-";
      let max: any = "-";
      let avg: any = "-";
      let calls: any = "1";
      let eth: any = "-";
      let usd: any = "-";

      if (_report[method].length > 1) {
        _report[method].reduce(function (prev: any, curr: any) {
          prev = prev || curr;
          min = (prev.gwei < curr.gwei ? prev.gwei : curr.gwei).toString();
          max = (prev.gwei > curr.gwei ? prev.gwei : curr.gwei).toString();
          avg = ((prev.gwei + curr.gwei) / 2).toString();
          eth = ((prev.eth + curr.eth) / 2).toFixed(8);
          usd = ((prev.usd + curr.usd) / 2).toString();

          gweiTotal += curr.gwei;
          ethTotal += curr.eth;
          usdTotal += curr.usd;
        });

        calls = _report[method].length.toString();

        callsTotal += _report[method].length;
      } else {
        avg = _report[method].gwei.toString();
        eth = _report[method].eth.toFixed(8);
        usd = _report[method].usd.toString();

        callsTotal++;
        gweiTotal += _report[method].gwei;
        ethTotal += _report[method].eth;
        usdTotal += _report[method].usd;
      }

      console.log(`|  ${report.padEnd(22, ' ')}  ·  ${method.padEnd(26, ' ')}  ·  ${min.padStart(10, ' ')}  ·  ${max.padStart(10, ' ')}  ·  ${avg.padStart(10, ' ')}  ·  ${calls.padStart(10, ' ')}  ·  ${eth.padStart(10, ' ')}  ·  ${usd.padStart(10, ' ')}  │`);
      console.log(div);
    }
  }

  callsTotal = callsTotal.toString();
  gweiTotal = gweiTotal.toString();
  ethTotal = ethTotal.toFixed(8);
  usdTotal = usdTotal.toFixed(2);

  console.log(`|                                                                                TOTAL  ·  ${gweiTotal.padStart(10, ' ')}  ·  ${callsTotal.padStart(10, ' ')}  ·  ${ethTotal.padStart(10, ' ')}  ·  ${usdTotal.padStart(10, ' ')}  │`);
  console.log(div);
}

describe("Deploying Mochkai Logo Contract", function () {

  this.timeout(0);

  let tokenURI = "";
  let maxSupply = -1;
  let contract: any;
  let reports: any = {};

  before(async function () {
    const MKLContract = await ethers.getContractFactory("MochkaiLogo");
    contract = await MKLContract.deploy();

    let tx = await contract.deployTransaction.wait();
    reports['Contract Creation'] = gasFee(tx.gasUsed.toNumber());

    contractHash = contract.address;

    maxSupply = (await contract.getMaxSupply()).toNumber();

    tx = await (await contract.updateBaseURI(BASE_URI)).wait();

    reports['Update Base URI'] = gasFee(tx.gasUsed.toNumber());
  });

  after(() => {
    gasReporting['Contract Deploy'] = reports;
  });

  it("Should mint a new logo and get the correct metadata back", async function () {
    const paddedNumber = (1).toString().padStart(maxSupply.toString().length, "0");
    metadata = `logo_${paddedNumber}.json`;

    const tx = await (await contract.createWithMetadata(metadata)).wait();

    reports['Create With Metadata'] = [];
    reports['Create With Metadata'].push(gasFee(tx.gasUsed.toNumber()));

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
      console.log("Mint Progress... " + (i / maxSupply * 100) + "%");
      const paddedNumber = i.toString().padStart(maxSupply.toString().length, "0");
      metadata = `logo_${paddedNumber}.json`;
      transactions[i] = await contract.createWithMetadata(metadata);

      const tx = await transactions[i].wait();

      reports['Create With Metadata'].push(gasFee(tx.gasUsed.toNumber()));

      if (tx.events && tx.events.length > 0) {
        const event = tx.events[0];
        if (event.args) {
          const value = event.args[2];
          const tokenId = value.toNumber(); // Getting the tokenID

          expect(tokenId).to.be.equal((await contract.totalSupply()).toNumber());
          clearLastLine();
        }
      }
    }
  });

  it("Should fail mint above max Supply", async function () {
    expect(contract.createWithMetadata(metadata)).to.be.revertedWith("Max supply reached");
  });

  it("Total Supply should be equal or less than max Supply", async function () {
    await expect((await contract.totalSupply()).toNumber()).to.be.lessThanOrEqual(maxSupply);
  });
});

describe("Checking Mochkai Logo Contract", function () {

  let tokenURI = "";
  let contract: any;
  let maxSupply = -1;
  let reports = gasReporting['Contract Deploy'];

  before(async function () {
    const MKLContract = await ethers.getContractFactory("MochkaiLogo");
    contract = await MKLContract.attach(contractHash);
    reports = gasReporting['Contract Deploy'];

    await contract.deployed();

    let _owner = await contract.getOwner();

    maxSupply = (await contract.getMaxSupply()).toNumber();

    let tx = await (await contract.updateBaseURI(BASE_URI)).wait();

    reports['Update Base URI'] = gasFee(tx.gasUsed.toNumber());
  });

  after(() => {
    gasReporting['Contract Deploy'] = reports;
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

    let tx = await (await contract.updateTokenMetadata(1, metadata)).wait();

    reports['Updating Token Metadata'] = gasFee(tx.gasUsed.toNumber());

    tokenURI = await contract.tokenURI(1);

    expect(tokenURI).to.be.equal(BASE_URI + metadata); // Comparing and testing
  });

  it("Contract can be destroyed by owner", async function () {
    let tx = await (await contract.destroyContract()).wait();

    reports['Destroy Contract'] = gasFee(tx.gasUsed.toNumber());

    const MKLContract = await ethers.getContractFactory("MochkaiLogo");
    const noContract = await MKLContract.attach(contractHash);

    await noContract.deployed().catch((_e) => {
      expect(_e.reason).to.be.equal('contract not deployed');
    });
  });

});

let jsonHash: any = null;

describe("Testing Mint with IPFS", function () {

  this.timeout(0);

  let tokenURI = "";
  let maxSupply = -1;
  let contract: any;
  let gen = null;
  let reports: any = {};

  before(async function () {
    const MKLContract = await ethers.getContractFactory("MochkaiLogo");
    contract = await MKLContract.deploy();
    await contract.deployed();

    let tx = await contract.deployTransaction.wait();
    reports['Contract Creation'] = gasFee(tx.gasUsed.toNumber());

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
      clearLastLine();
      gen.setBaseSVG('assets/baseSVG.svg');
      gen.generateMetadata();
      clearLastLine();
      gen.generateSVG();
      clearLastLine();
      await gen.sendSVGFilesToIPFS();
      clearLastLine();
      clearLastLine();
      gen.generateJsonFiles();
      jsonHash = await gen.sendJSONFilesToIPFS();
      clearLastLine();
    }

    tx = await (await contract.updateBaseURI(BASE_URI + jsonHash + "/")).wait();

    reports['Update Base URI'] = gasFee(tx.gasUsed.toNumber());
  });

  after(() => {
    gasReporting['Deploy with IPFS'] = reports;

    generateReport(gasReporting);
  });

  it("Mint suply of logos with IPFS", async function () {

    reports['Create With Metadata'] = [];

    for (let i = 1; i <= maxSupply; i++) {
      console.log("Mint Progress... " + (i / maxSupply * 100) + "%");
      const paddedNumber = i.toString().padStart(maxSupply.toString().length, "0");
      const metadata = `logo_${paddedNumber}.json`;
      const transaction = await contract.createWithMetadata(metadata);

      const tx = await transaction.wait() // Waiting for the token to be minted

      reports['Create With Metadata'].push(gasFee(tx.gasUsed.toNumber()));

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
      clearLastLine();
    }
  });

  it("Check if all suply has been minted", async function () {
    expect(maxSupply).to.be.equal((await contract.totalSupply()).toNumber());
  });
});


// describe("Testing Mint with IPFS in batch mode", function () {

//   this.timeout(0);

//   let tokenURI = "";
//   let maxSupply = -1;
//   let contract: any;
//   let gen = null;
//   let address: any = null;

//   before(async function () {
//     const [deployer] = await ethers.getSigners();
//     address = deployer.address;
//     const MKLContract = await ethers.getContractFactory("MochkaiLogo");
//     contract = await MKLContract.deploy();
//     await contract.deployed();

//     contractHash = contract.address;

//     maxSupply = (await contract.getMaxSupply()).toNumber();

//     if (!jsonHash) {
//       gen = new AutoGen(maxSupply, {
//         name: "SVG Logo Test",
//         description: "This is just for hardhat test",
//         baseFolder: "/mochkai-logo-test/",
//         fileNamePrefix: "test_"
//       });

//       await gen.initIPFS();
//       clearLastLine();
//       gen.setBaseSVG('assets/baseSVG.svg');
//       gen.generateMetadata();
//       clearLastLine();
//       gen.generateSVG();
//       clearLastLine();
//       await gen.sendSVGFilesToIPFS();
//       clearLastLine();
//       clearLastLine();
//       gen.generateJsonFiles();
//       jsonHash = await gen.sendJSONFilesToIPFS();
//       clearLastLine();
//     }

//     await contract.updateBaseURI(BASE_URI + jsonHash + "/");
//   });

//   it("Mint batch of logos", async function () {

//     const transaction = await contract.batchCreateTokens(address, "logo_", maxSupply);

//     const tx = await transaction.wait() // Waiting for the token to be minted
//     console.log(tx);
//     tokenURI = await contract.tokenURI(maxSupply); // Using the tokenURI from ERC721 to retrieve de metadata
//     console.log(tokenURI);

//     expect(tokenURI).to.be.equal(BASE_URI + jsonHash + "/logo_" + maxSupply + ".json"); // Comparing and testing
//   });

//   it("Check if all suply has been minted", async function () {
//     expect(maxSupply).to.be.equal((await contract.totalSupply()).toNumber());
//   });
// });