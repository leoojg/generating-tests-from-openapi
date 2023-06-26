import * as fs from 'fs';
import axios from 'axios';

import { JSONSchemaFaker } from 'json-schema-faker';
import { MappedToken, Token, TestingOptionResponse, TestingOptionRequest } from 'src/constants';
import { OpenApi } from './open-api';
import { writeFile, chooseSpec, isValidSpec, readOption, getMapedTokens, fileExists } from './utils';

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

export async function generateRandomData() {
  const spec = await chooseSpec();

  if (!isValidSpec(spec)) return;

  const quantity = +(await readOption('Enter the quantity of random data: \n'));

  const mapedTokens = getMapedTokens(spec);
  let error = false;
  try {
    Object.keys(mapedTokens).forEach((tokenName) => {
      mapedTokens[tokenName].availableTokens = [];
      while (mapedTokens[tokenName].availableTokens.length < quantity) {
        // TODO: add new way to generate random data
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
  console.clear();
  console.log('Random data generated');
}

export async function generateTests() {
  const spec = await chooseSpec();

  if (!isValidSpec(spec)) return;

  const quantity = +(await readOption('Enter the quantity of test cases: \n'));
  const mappedTokens = getMapedTokens(spec);

  console.log(`Generating tests for ${spec}...`);

  let availableToTest = true;
  Object.keys(mappedTokens).forEach((tokenName) => {
    if (mappedTokens[tokenName].availableTokens.length === 0) {
      console.log(`Token ${tokenName} has no available tokens`);
      availableToTest = false;
    }
  });

  if (!availableToTest) {
    console.log('Please provide availableTokens in tokens.json file before generating test cases');
    return;
  }

  const openApi = new OpenApi(`./specs/${spec}/spec.json`);
  await openApi.init();
  const testCases = openApi.generateTests(mappedTokens, quantity);

  writeFile(`./specs/${spec}/test-cases.json`, testCases);
}

export async function executeTests() {
  const spec = await chooseSpec();

  if (!isValidSpec(spec)) return;
  console.log(`Running ${spec}...`);

  const path = `./specs/${spec}/test-cases.json`;

  if (!fileExists(path)) {
    console.log('Please generate test cases before executing them');
    return;
  }

  const results: Array<TestingOptionResponse> = [];
  const testCases = JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' })) as Array<TestingOptionRequest>;
  const openApi = new OpenApi(`./specs/${spec}/spec.json`);
  await openApi.init();
  await Promise.all(
    testCases.map(async (testCase) => {
      return axios
        .request(testCase)
        .then((response) => {
          results.push({ data: response.data, status: response.status, ...testCase });
        })
        .catch((err) => {
          results.push({ data: err.response?.data, status: err.response?.status, ...testCase });
        });
    }),
  );

  writeFile(`./specs/${spec}/results.json`, results);
  console.log('Results generated');
}

export async function evaluateResults() {
  const spec = await chooseSpec();

  if (!isValidSpec(spec)) return;
  console.log(`Evaluating ${spec}...`);

  const path = `./specs/${spec}/results.json`;

  if (!fileExists(path)) {
    console.log(`results.json from ${spec} not found`);
    return;
  }

  const results = JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' })) as Array<TestingOptionResponse>;

  const openApi = new OpenApi(`./specs/${spec}/spec.json`);
  await openApi.init();

  const evaluation = openApi.evaluateResponses(results);

  writeFile(`./specs/${spec}/evaluation.json`, evaluation);
}
