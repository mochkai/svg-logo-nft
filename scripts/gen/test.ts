import { AutoGen } from './autoGen';

async function main() {
  let gen = new AutoGen(10);
  //gen = new AutoGen(1000);

  await gen.initIPFS();
  gen.setBaseSVG('assets/baseSVG.svg');
  gen.generateMetadataAttributes();
  await gen.generateMetadata();
  let jsonHash = await gen.generateJsonFiles();

  console.log(jsonHash);
  process.exit(1);
}

try {
  main()
} catch (error) {
  console.error(error);
  process.exit(1);
}