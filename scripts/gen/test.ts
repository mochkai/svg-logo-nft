import { AutoGen } from './autoGen';

async function main() {
  let gen = new AutoGen(10);
  //gen = new AutoGen(1000);

  await gen.initIPFS();
  gen.setBaseSVG('assets/baseSVG.svg');
  gen.generateMetadataAttributes();
  await gen.generateMetadata();
  await gen.generateJsonFiles();

  console.log(gen.getJsonArray());
  process.exit(1);
}

try {
  main()
} catch (error) {
  console.error(error);
  process.exit(1);
}