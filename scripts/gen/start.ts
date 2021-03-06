import { AutoGen } from './autoGen';

async function main() {
  let gen = new AutoGen(10000, {
    name: "SVG Logo",
    description: "This logo has been autogenerated by Mochkai's script. If you would like to see it live chack it out on twitch!! https://www.twitch.tv/mochkai",
    baseFolder: "/mochkai-logo/",
    fileNamePrefix: "logo_"
  });
  //gen = new AutoGen(1000);

  await gen.initIPFS();
  gen.setBaseSVG('assets/baseSVG.svg');
  gen.generateMetadata();
  gen.generateSVG();
  await gen.sendSVGFilesToIPFS();
  gen.generateJsonFiles();
  let hash = await gen.sendJSONFilesToIPFS();

  console.log(hash);
  process.exit(1);
}

try {
  main()
} catch (error) {
  console.error(error);
  process.exit(1);
}