import { createInterface } from 'readline/promises';

import { generateRandomData, listAvailableSpecs, saveSpec } from './providers/utils';

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function readOption(msg: string) {
  return readline.question(msg);
}

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
      const availableSpecs = listAvailableSpecs();
      console.log('Choose a spec: ');
      availableSpecs.forEach((spec, index) => {
        console.log(`${index + 1}. ${spec}`);
      });
      const specIndex = +(await readOption('Enter your choice: \n'));
      const quantity = +(await readOption('Enter number of random data: \n'));
      generateRandomData(availableSpecs[specIndex - 1], quantity);

      console.clear();
      console.log('Random data generated');
      break;
    case 3:
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
