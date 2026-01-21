import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { convertLogicalModelToGraphQL } from './converter';
import { LogicalModel } from './types';

function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error('Usage: npx ts-node src/index.ts <path-to-logical-model.yaml>');
    process.exit(1);
  }

  const filePath = args[0];
  
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const model = yaml.load(fileContents) as LogicalModel;
    
    if (!model.entities) {
        console.error('Invalid Logical Model: "entities" field is missing.');
        process.exit(1);
    }

    const sdl = convertLogicalModelToGraphQL(model);
    console.log(sdl);
  } catch (e) {
    console.error(`Error reading or parsing file: ${e}`);
    process.exit(1);
  }
}

main();
