import { AutoGen } from './autoGen';

function main() {
  let gen = new AutoGen(10);

  gen.setBaseSVG('assets/baseSVG.svg');
  gen.generateMetadataAttributes();
  gen.generateMetadata();


}

try {
  main()
} catch (error) {
  console.error(error);
  process.exit(1);
}