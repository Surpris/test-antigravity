import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { program } from 'commander';
import { convertLogicalModelToGraphQL } from './converter';
import { LogicalModel } from './types';
import { Validator } from './validator';

async function main() {
  program
    .version('1.0.0')
    .argument('<file>', 'Path to logical model YAML file')
    .option('-o, --output <dir>', 'Output directory for GraphQL schema')
    .action(async (file, options) => {
      await processFile(file, options.output);
    });

  program.parse(process.argv);
}

async function processFile(filePath: string, outputDir?: string) {
  try {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    const fileContents = fs.readFileSync(absolutePath, 'utf8');
    const model = yaml.load(fileContents) as LogicalModel;

    // Validation
    const validator = new Validator();
    const result = validator.validate(model);

    if (!result.valid) {
      console.error('❌ Validation Failed:');
      result.errors.forEach(err => console.error(`  - ${err}`));
      process.exit(1);
    } else {
        console.log('✅ Validation Successful');
    }

    // Conversion
    const sdl = convertLogicalModelToGraphQL(model);

    // Output
    if (outputDir) {
      // Ensure dir exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const fileName = path.basename(filePath, path.extname(filePath)) + '.graphql';
      const outputPath = path.join(outputDir, fileName);
      fs.writeFileSync(outputPath, sdl);
      console.log(`✨ GraphQL Schema saved to: ${outputPath}`);
    } else {
      // Default: save to same dir as input
      // OLD behavior: print to stdout. User requirements said: "Output destination can be specified by option, default is the directory where the input file exists."
      // So if no option, write to input file dir.
      const dir = path.dirname(absolutePath);
      const fileName = path.basename(filePath, path.extname(filePath)) + '.graphql';
      const outputPath = path.join(dir, fileName);
      
      fs.writeFileSync(outputPath, sdl);
      console.log(`✨ GraphQL Schema saved to: ${outputPath}`);
    }

  } catch (e: any) {
    console.error(`Error processing file: ${e.message}`);
    process.exit(1);
  }
}

main();
