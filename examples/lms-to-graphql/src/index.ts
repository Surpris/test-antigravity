import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { program } from 'commander';
import { convertLogicalModelToGraphQL } from './converter';
import { LogicalModel } from './types';
import { Validator } from './validator';

/**
 * CLI のエントリポイント。
 * commander を使用してコマンドライン引数を解析し、メイン処理を実行します。
 */
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

/**
 * YAML ファイルを読み込み、バリデーションを行い、GraphQL SDL に変換してファイル出力します。
 * @param filePath 変換対象の YAML ファイルのパス
 * @param outputDir 出力先ディレクトリ（任意）
 */
async function processFile(filePath: string, outputDir?: string) {
  try {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    const fileContents = fs.readFileSync(absolutePath, 'utf8');
    const model = yaml.load(fileContents) as LogicalModel;

    // バリデーション実行
    const validator = new Validator();
    const result = validator.validate(model);

    if (!result.valid) {
      console.error('❌ Validation Failed:');
      result.errors.forEach(err => console.error(`  - ${err}`));
      process.exit(1);
    } else {
        console.log('✅ Validation Successful');
    }

    // GraphQL SDL への変換
    const sdl = convertLogicalModelToGraphQL(model);

    // ファイル出力
    const fileName = path.basename(filePath, path.extname(filePath)) + '.graphql';
    let outputPath: string;

    if (outputDir) {
      // 出力先ディレクトリの作成
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      outputPath = path.join(outputDir, fileName);
    } else {
      // デフォルト：入力ファイルと同じディレクトリに出力
      const dir = path.dirname(absolutePath);
      outputPath = path.join(dir, fileName);
    }

    fs.writeFileSync(outputPath, sdl);
    console.log(`✨ GraphQL Schema saved to: ${outputPath}`);

  } catch (e: any) {
    console.error(`Error processing file: ${e.message}`);
    process.exit(1);
  }
}


main();
