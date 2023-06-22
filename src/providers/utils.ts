import * as fs from 'fs';
import { MappedToken, Token } from '../constants';
import { createInterface } from 'readline/promises';
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

export function getMapedTokens(spec: string) {
  return JSON.parse(fs.readFileSync(`./specs/${spec}/tokens.json`, { encoding: 'utf-8' })) as Record<
    string,
    MappedToken
  >;
}

export function generateRandomData(spec: string, quantity: number) {
  const mapedTokens = getMapedTokens(spec);
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

export async function chooseSpec() {
  const availableSpecs = listAvailableSpecs();
  console.log('Choose a spec: ');
  availableSpecs.forEach((spec, index) => {
    console.log(`${index + 1}. ${spec}`);
  });
  const specIndex = +(await readOption('Enter your choice: \n'));
  return availableSpecs[specIndex - 1];
}

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

export async function readOption(msg: string) {
  return readline.question(msg);
}

export async function generateTests(spec: string, mappedTokens: Record<string, MappedToken>, quantity: number) {
  let availableToTest = true;
  Object.keys(mappedTokens).forEach((tokenName) => {
    if (mappedTokens[tokenName].availableTokens.length === 0) {
      console.log(`Token ${tokenName} has no available tokens`);
      availableToTest = false;
    }
  });

  if (!availableToTest) {
    console.log('Please generate random data before generating test cases');
    return;
  }

  const openApi = new OpenApi(`./specs/${spec}/spec.json`);
  await openApi.init();
  const testCases = openApi.generateTests(mappedTokens, quantity);

  writeFile(`./specs/${spec}/test-cases.json`, testCases);
}

export function selectRandomToken(tokens: Array<MappedToken>) {
  const randomIndex = Math.floor(Math.random() * tokens.length);
  return tokens[randomIndex];
}
