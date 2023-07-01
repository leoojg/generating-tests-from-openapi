import { saveSpec, generateRandomData, generateTests, executeTests, evaluateResults } from './providers/menu';
import { readOption } from './providers/utils';

async function showMenu() {
  console.log('-------------- Menu --------------');
  console.log('1. Add spec');
  console.log('2. Generate random data');
  console.log('3. Generate test cases');
  console.log('4. Execute test cases');
  console.log('5. Evaluate responses');
  console.log('0. Exit');
  console.log('----------------------------------');

  const option = +(await readOption('Enter your choice: \n'));

  console.log(option);
  console.clear();

  switch (option) {
    case 1:
      const url = await readOption('Enter OpenAPI URL: \n');
      await saveSpec(url);
      break;
    case 2:
      await generateRandomData();
      break;
    case 3:
      await generateTests();
      break;
    case 4:
      await executeTests();
      break;
    case 5:
      await evaluateResults();
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
