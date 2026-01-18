import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import Ajv from 'ajv';

// --- 設定 ---
const SCHEMA_FILE = path.resolve(__dirname, '../schema/logical_model_schema.json');

// --- 型定義 ---
interface LogicalModel {
  entities: {
    [key: string]: {
      relationships?: {
        [key: string]: {
          target: string;
          attributes?: { [key: string]: any };
        };
      };
    };
  };
}

// --- メイン処理 ---
async function main() {
  // 1. 対象パスの決定 (引数がなければカレントディレクトリ '.')
  const targetPath = process.argv[2] || '.';
  
  console.log(`🚀 Starting Validation Process...`);
  console.log(`📂 Target Path: "${targetPath}"`);

  // 2. スキーマの読み込み (一度だけ実行)
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Critical Error: Schema file '${SCHEMA_FILE}' not found.`);
    process.exit(1);
  }
  const schemaJson = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8'));
  const ajv = new Ajv({ allErrors: true });
  const validateSchema = ajv.compile(schemaJson);

  // 3. 処理対象ファイルリストの生成
  let filesToValidate: string[] = [];

  try {
    const stats = fs.statSync(targetPath);

    if (stats.isDirectory()) {
      // ディレクトリの場合: 直下のYAMLファイルを収集
      const files = fs.readdirSync(targetPath);
      filesToValidate = files
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map(file => path.join(targetPath, file));
      
      if (filesToValidate.length === 0) {
        console.warn(`⚠️  No YAML files found in directory: ${targetPath}`);
        return;
      }
    } else if (stats.isFile()) {
      // ファイルの場合: そのファイルのみ
      filesToValidate = [targetPath];
    } else {
      console.error(`❌ Error: Path '${targetPath}' is valid but not a file or directory.`);
      process.exit(1);
    }
  } catch (e: any) {
    console.error(`❌ Error accessing path '${targetPath}': ${e.message}`);
    process.exit(1);
  }

  // 4. 各ファイルのバリデーション実行
  console.log(`Target Files: ${filesToValidate.length} file(s)\n`);

  let errorCount = 0;
  for (const filePath of filesToValidate) {
    const isSuccess = await validateFile(filePath, validateSchema);
    if (!isSuccess) errorCount++;
  }

  // 5. 最終結果
  console.log('---------------------------------------------------');
  if (errorCount === 0) {
    console.log('🎉 All files passed validation successfully!');
  } else {
    console.error(`💀 Process finished with errors in ${errorCount} file(s).`);
    process.exit(1); // エラーがあれば非ゼロ終了コード
  }
}

/**
 * 単一ファイルのバリデーションを行う関数
 */
async function validateFile(filePath: string, validateSchema: any): Promise<boolean> {
  console.log(`Testing: ${filePath} ...`);

  try {
    const yamlContent = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(yamlContent) as LogicalModel;

    // A. AJVによるJSON Schemaバリデーション (構造チェック)
    const valid = validateSchema(data);

    if (!valid) {
      console.error(`  ❌ Schema Validation Failed:`);
      if (validateSchema.errors) {
        validateSchema.errors.forEach((err: any) => {
          console.error(`     - Path: ${err.instancePath}`);
          console.error(`       Message: ${err.message}`);
        });
      }
      console.log(''); //改行
      return false;
    }

    // B. 参照整合性チェック (ロジックチェック)
    const integrityValid = checkReferentialIntegrity(data);
    
    if (integrityValid) {
      console.log(`  ✅ OK\n`);
      return true;
    } else {
      console.log(''); //改行
      return false;
    }

  } catch (e: any) {
    console.error(`  ❌ System Error processing file: ${e.message}\n`);
    return false;
  }
}

/**
 * Relationshipのtargetが実在するEntityを指しているか確認する
 */
function checkReferentialIntegrity(data: LogicalModel): boolean {
  const entityNames = new Set(Object.keys(data.entities || {}));
  let hasError = false;

  for (const [entityName, entityDef] of Object.entries(data.entities || {})) {
    if (!entityDef.relationships) continue;

    for (const [relName, relDef] of Object.entries(entityDef.relationships)) {
      const target = relDef.target;
      
      if (!entityNames.has(target)) {
        console.error(`     ❌ Broken Link in [${entityName}]: relationship '${relName}' -> missing '${target}'`);
        hasError = true;
      }
    }
  }

  return !hasError;
}

// 実行
main();