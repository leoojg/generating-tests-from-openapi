import { chooseSpec, generateRandomData, generateTests, getMapedTokens, readOption, saveSpec } from './providers/utils';

async function showMenu() {
  console.log('-------------- Menu --------------');
  console.log('1. Add spec');
  console.log('2. Generate random data');
  console.log('3. Generate test cases');
  console.log('0. Exit');
  console.log('----------------------------------');

  const option = +(await readOption('Enter your choice: \n'));

  console.log(option);
  console.clear();

  switch (option) {
    case 1:
      let url = await readOption('Enter OpenAPI URL: \n');
      url = 'https://api.apis.guru/v2/specs/medium.com/1.0/openapi.json';
      await saveSpec(url);
      break;
    case 2:
      const specToGenerateData = await chooseSpec();
      const dataQuantity = +(await readOption('Enter the quantity of random data: \n'));
      generateRandomData(specToGenerateData, dataQuantity);

      console.clear();
      console.log('Random data generated');
      break;
    case 3:
      const specToTest = await chooseSpec();
      console.clear();
      console.log(`Loading ${specToTest}...`);
      const testQuantity = +(await readOption('Enter the quantity of test cases: \n'));
      const mappedToken = getMapedTokens(specToTest);
      await generateTests(specToTest, mappedToken, testQuantity);
      break;
    case 0:
      process.exit(0);
  }
  showMenu();
}

async function bootstrap() {
  await showMenu();
}
bootstrap();
