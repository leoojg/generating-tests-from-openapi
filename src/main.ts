import { OpenApi } from './providers/open-api';

async function bootstrap() {
  const openApi = new OpenApi(
    'https://api.apis.guru/v2/specs/apis.guru/2.2.0/openapi.json',
  );
  await openApi.init();
}
bootstrap();
