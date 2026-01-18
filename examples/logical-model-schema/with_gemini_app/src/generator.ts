import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// --- 型定義 ---

// 入力YAMLのスキーマに合わせた型定義
interface YamlSchema {
  schema_version: string;
  model_name: string;
  entities: { [key: string]: EntityDef };
}

interface EntityDef {
  description?: string;
  attributes: { [key: string]: AttributeDef };
  relationships?: { [key: string]: RelationshipDef };
}

interface AttributeDef {
  type: string;
  description?: string;
  required?: boolean;
  primary_key?: boolean;
  note?: string;
  options?: string[]; // For Enum
}

interface RelationshipDef {
  target: string;
  description?: string;
  cardinality: string;
}

// データ型マッピング設定
const TYPE_MAPPING: { [key: string]: string } = {
  String: 'string',
  Text: 'string',
  Integer: 'number',
  Float: 'number',
  Boolean: 'boolean',
  Date: 'Date',
  DateTime: 'Date',
  // Enumは動的に処理
};

// --- ヘルパー関数 ---

// Entity名からPrimary Keyの型を取得する関数
function getPrimaryKeyType(entityName: string, schema: YamlSchema): string {
  const entity = schema.entities[entityName];
  if (!entity) return 'string'; // Fallback

  for (const [attrName, attr] of Object.entries(entity.attributes)) {
    if (attr.primary_key) {
      return TYPE_MAPPING[attr.type] || 'string';
    }
  }
  return 'string'; // PKが見つからない場合のFallback
}

// 文字列をPascalCaseに変換 (例: has_datasets -> HasDatasets)
function toPascalCase(str: string): string {
  return str.replace(/(^\w|_\w)/g, (match) => match.replace('_', '').toUpperCase());
}

// JSDocコメント生成
function generateJSDoc(desc?: string, note?: string): string {
  if (!desc && !note) return '';
  const lines = ['/**'];
  if (desc) lines.push(` * ${desc}`);
  if (note) lines.push(` * @note ${note}`);
  lines.push(' */');
  return lines.join('\n');
}

// --- メイン生成ロジック ---

function generateTypeScript(yamlContent: string): string {
  const schema = yaml.load(yamlContent) as YamlSchema;
  const lines: string[] = [];

  lines.push(`// Generated from Logical Model: ${schema.model_name}`);
  lines.push(`// Schema Version: ${schema.schema_version}`);
  lines.push('');

  // 1. Entities Generation
  lines.push('// ==========================================');
  lines.push('// Entities (Nodes)');
  lines.push('// ==========================================');
  lines.push('');

  for (const [entityName, entityDef] of Object.entries(schema.entities || {})) {
    lines.push(generateJSDoc(entityDef.description));
    lines.push(`export interface ${entityName} {`);

    // Attributes
    for (const [attrName, attrDef] of Object.entries(entityDef.attributes || {})) {
      const isOptional = !attrDef.required;
      const doc = generateJSDoc(attrDef.description, attrDef.note);
      
      let tsType = 'any';
      if (attrDef.type === 'Enum' && attrDef.options) {
        // String Union Typeとして生成
        tsType = attrDef.options.map(opt => `"${opt}"`).join(' | ');
      } else {
        tsType = TYPE_MAPPING[attrDef.type] || 'any';
      }

      if (doc) lines.push(`  ${doc}`);
      lines.push(`  ${attrName}${isOptional ? '?' : ''}: ${tsType};`);
    }

    lines.push('}');
    lines.push('');
  }

  // 2. Relationships Generation (Edges)
  lines.push('// ==========================================');
  lines.push('// Relationships (Edges)');
  lines.push('// Treated as independent interfaces for Property Graph capability');
  lines.push('// ==========================================');
  lines.push('');

  for (const [sourceEntityName, entityDef] of Object.entries(schema.entities || {})) {
    if (!entityDef.relationships) continue;

    for (const [relName, relDef] of Object.entries(entityDef.relationships)) {
      const targetEntityName = relDef.target;
      
      // Edge名の決定: Source_Relation_Target
      const edgeInterfaceName = `${sourceEntityName}_${toPascalCase(relName)}_${targetEntityName}`;
      
      // SourceとTargetのID型を解決
      const sourceType = getPrimaryKeyType(sourceEntityName, schema);
      const targetType = getPrimaryKeyType(targetEntityName, schema);

      lines.push(generateJSDoc(relDef.description, `Cardinality: ${relDef.cardinality}`));
      lines.push(`export interface ${edgeInterfaceName} {`);
      
      // Graph Edge Standard Properties
      lines.push(`  /** Relationship Type Identifier */`);
      lines.push(`  type: "${relName}";`);
      
      lines.push(`  /** Source Entity ID (${sourceEntityName}) */`);
      lines.push(`  source_id: ${sourceType};`);
      
      lines.push(`  /** Target Entity ID (${targetEntityName}) */`);
      lines.push(`  target_id: ${targetType};`);

      lines.push('}');
      lines.push('');
    }
  }

  return lines.join('\n');
}

// --- 実行制御部 ---

async function main() {
  const targetPath = process.argv[2] || '.';

  console.log(`🚀 Starting Generator Process...`);
  console.log(`📂 Target Path: "${targetPath}"`);

  let filesToProcess: string[] = [];

  try {
    const stats = fs.statSync(targetPath);

    if (stats.isDirectory()) {
      // ディレクトリの場合
      const files = fs.readdirSync(targetPath);
      filesToProcess = files
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map(file => path.join(targetPath, file));

      if (filesToProcess.length === 0) {
        console.warn(`⚠️  No YAML files found in directory: ${targetPath}`);
        return;
      }
    } else if (stats.isFile()) {
      // ファイルの場合
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

  // 各ファイルの処理
  for (const inputFile of filesToProcess) {
    try {
      const fileContents = fs.readFileSync(inputFile, 'utf8');
      const tsCode = generateTypeScript(fileContents);

      // 出力ファイル名の決定 (例: model.yaml -> model_types.ts)
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

// 実行
main();