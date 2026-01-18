#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { generateTypeScript } from '../generator';

async function main() {
  const targetPath = process.argv[2] || '.';
  
  console.log(`🚀 Starting Generator Process...`);
  console.log(`📂 Target Path: "${targetPath}"`);

  let filesToProcess: string[] = [];

  try {
    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(targetPath);
      filesToProcess = files
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map(file => path.join(targetPath, file));
        
      if (filesToProcess.length === 0) {
        console.warn(`⚠️  No YAML files found in directory: ${targetPath}`);
      }
    } else if (stats.isFile()) {
       filesToProcess = [targetPath];
    } else {
       console.error(`❌ Error: Path '${targetPath}' is valid but not a file or directory.`);
       process.exit(1);
    }
  } catch (e: any) {
    console.error(`❌ Error accessing path '${targetPath}': ${e.message}`);
    process.exit(1);
  }

  console.log(`Target Files: ${filesToProcess.length} file(s)\n`);

  for (const inputFile of filesToProcess) {
    try {
      const fileContents = fs.readFileSync(inputFile, 'utf8');
      const tsCode = generateTypeScript(fileContents);

      const dir = path.dirname(inputFile);
      const ext = path.extname(inputFile);
      const baseName = path.basename(inputFile, ext);
      const outputFile = path.join(dir, `${baseName}_types.ts`);

      fs.writeFileSync(outputFile, tsCode);
      console.log(`✅ Generated: ${outputFile}`);
    } catch (e: any) {
      console.error(`❌ Error processing ${inputFile}:`, e.message);
    }
  }
  console.log('\n🎉 Generation process completed.');
}

main();
