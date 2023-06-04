import { Swagger } from './providers/swagger';

async function bootstrap() {
  const spec = new Swagger(
    'https://api.apis.guru/v2/specs/apis.guru/2.2.0/openapi.json',
  );
  await spec.init();
}
bootstrap();
