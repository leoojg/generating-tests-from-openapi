import { OpenApi } from './providers/open-api';
import { createInterface } from 'readline/promises';

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function bootstrap() {
  const openApi = new OpenApi(
    // 'https://api.apis.guru/v2/specs/apis.guru/2.2.0/openapi.json',
    'https://api.apis.guru/v2/specs/googleapis.com/youtube/v3/openapi.json',
  );
  await openApi.init();

  async function showMenu() {
    console.log('==== Menu ====');
    console.log('1. New Spec');
    console.log('2. Update');
    console.log('3. Delete');
    console.log('0. Exit');
    console.log('==============');

    const option = await readline.question('Enter your choice: \n');

    console.log(option);
    showMenu();
    // switch (option) {
    //   case 1:
    //     console.log('New option selected');
    //     // Add your code for the "New" functionality here
    //     break;
    //   case 2:
    //     console.log('Update option selected');
    //     // Add your code for the "Update" functionality here
    //     break;
    //   case 3:
    //     console.log('Delete option selected');
    //     // Add your code for the "Delete" functionality here
    //     break;
    //   case 0:
    //     console.log('Exiting...');
    //     break;
    //   default:
    //     console.log('Invalid option');
    //     break;
    // }
  }

  // showMenu();
}
bootstrap();
