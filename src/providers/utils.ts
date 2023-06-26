import * as fs from 'fs';
import { MappedToken } from '../constants';
import { createInterface } from 'readline/promises';

export function writeFile(path: string, data: object) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), {
    encoding: 'utf-8',
    flag: 'w+',
  });
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

export async function chooseSpec(): Promise<string | undefined> {
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

export function selectRandomToken(tokens: Array<MappedToken>) {
  const randomIndex = Math.floor(Math.random() * tokens.length);
  return tokens[randomIndex];
}

export function isValidSpec(spec: string | null) {
  console.clear();
  if (!spec) {
    console.log(`Invalid spec`);
    return false;
  }
  return true;
}

export function fileExists(path: string) {
  return fs.existsSync(path);
}
