import * as fs from 'fs';
import { MappedToken, Token } from '../constants';
import { OpenApi } from './open-api';
import { JSONSchemaFaker } from 'json-schema-faker';

function writeFile(path: string, data: object) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), {
    encoding: 'utf-8',
    flag: 'w+',
  });
}

export async function saveSpec(url: string) {
  const spec = new OpenApi(url);
  await spec.init();
  const title = spec.getTitle();
  const tokens = spec.extractTokens();
  const path = `./specs/${title}`;
  fs.mkdirSync(path, { recursive: true });
  const tokenNames = Array.from(tokens.keys());
  const mapedTokens: Record<string, MappedToken> = {};
  tokenNames.forEach((tokenName) => {
    const token = tokens.get(tokenName) as Token;
    mapedTokens[tokenName] = {
      token,
      availableTokens: [],
    };
  });
  writeFile(`${path}/spec.json`, spec.getSpec());
  writeFile(`${path}/tokens.json`, mapedTokens);
}

export function listAvailableSpecs() {
  return fs.readdirSync('./specs');
}

export function generateRandomData(spec: string, quantity: number) {
  const mapedTokens = JSON.parse(fs.readFileSync(`./specs/${spec}/tokens.json`, { encoding: 'utf-8' })) as Record<
    string,
    MappedToken
  >;
  let error = false;
  try {
    Object.keys(mapedTokens).forEach((tokenName) => {
      mapedTokens[tokenName].availableTokens = [];
      while (mapedTokens[tokenName].availableTokens.length < quantity) {
        mapedTokens[tokenName].availableTokens.push(
          JSONSchemaFaker.generate(mapedTokens[tokenName].token.schema as any),
        );
      }
    });
  } catch {
    error = true;
  }

  if (error) {
    throw new Error('Error while generating random data');
  }

  writeFile(`./specs/${spec}/tokens.json`, mapedTokens);
}
