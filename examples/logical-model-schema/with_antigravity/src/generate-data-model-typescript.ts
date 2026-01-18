import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * 論理データモデルの属性定義
 */
interface Attribute {
  type: 'String' | 'Text' | 'Integer' | 'Float' | 'Date' | 'Boolean' | 'Enum';
  description: string;
  required?: boolean;
  primary_key?: boolean;
  options?: string[];
  note?: string;
}

/**
 * 論理データモデルのリレーション定義
 */
interface Relationship {
  target: string;
  description: string;
  cardinality: '1:1' | '1:N' | '0:1' | '0:N';
}

/**
 * 論理データモデルのエンティティ定義
 */
interface Entity {
  description: string;
  attributes: Record<string, Attribute>;
  relationships?: Record<string, Relationship>;
}

/**
 * 論理データモデルの全体定義
 */
interface LogicalModel {
  schema_version: string;
  model_name: string;
  description: string;
  entities: Record<string, Entity>;
}

/**
 * YAMLの型をTypeScriptの型に変換する
 */
function mapType(attr: Attribute): string {
  switch (attr.type) {
    case 'String':
    case 'Text':
    case 'Date':
      return 'string';
    case 'Integer':
    case 'Float':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'Enum':
      if (!attr.options || attr.options.length === 0) return 'string';
      return attr.options.map(opt => `'${opt}'`).join(' | ');
    default:
      return 'any';
  }
}

/**
 * カーディナリティに基づきTypeScriptの型を生成する
 */
function mapRelationshipType(rel: Relationship): string {
  switch (rel.cardinality) {
    case '1:1':
      return rel.target;
    case '0:1':
      return `${rel.target} | null`;
    case '1:N':
    case '0:N':
      return `${rel.target}[]`;
    default:
      return 'any';
  }
}

/**
 * ひとつのエンティティのTypeScriptファイルを生成する
 */
function generateEntityFile(entityName: string, entity: Entity, outputDir: string) {
  const imports: Set<string> = new Set();
  
  // 依存するエンティティ（リレーションシップ）をインポート対象に加える
  if (entity.relationships) {
    for (const rel of Object.values(entity.relationships)) {
      if (rel && rel.target && rel.target !== entityName) {
        imports.add(rel.target);
      }
    }
  }

  let code = `/**\n * ${entity.description}\n */\n`;
  
  // インポート文の生成
  if (imports.size > 0) {
    for (const imp of Array.from(imports).sort()) {
      code += `import { ${imp} } from './${imp}';\n`;
    }
    code += '\n';
  }

  code += `export interface ${entityName} {\n`;

  // 属性の生成
  for (const [name, attr] of Object.entries(entity.attributes)) {
    if (!attr || !attr.type) continue;
    const optional = attr.required ? '' : '?';
    code += `  /** ${attr.description}${attr.note ? ` (${attr.note})` : ''} */\n`;
    code += `  ${name}${optional}: ${mapType(attr)};\n`;
  }

  // リレーションシップの生成
  if (entity.relationships) {
    for (const [name, rel] of Object.entries(entity.relationships)) {
      if (!rel || !rel.target) continue;
      code += `  /** ${rel.description} */\n`;
      code += `  ${name}: ${mapRelationshipType(rel)};\n`;
    }
  }

  code += '}\n';

  const filePath = path.join(outputDir, `${entityName}.ts`);
  fs.writeFileSync(filePath, code, 'utf-8');
  console.log(`Generated: ${filePath}`);
}

/**
 * メイン処理
 */
function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: tsx generate-data-model-typescript.ts <input-yaml-path> [output-dir]');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputDir = path.resolve(args[1] || './generated');

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    let fileContent = fs.readFileSync(inputPath, 'utf-8');

    // Markdown のフェンス（```yaml ... ```）を全て抽出する
    const yamlMatches = [...fileContent.matchAll(/```yaml([\s\S]*?)```/g)];
    const yamlDocs: string[] = yamlMatches.length > 0 
      ? yamlMatches.map(m => m[1]) 
      : [fileContent];

    const model: LogicalModel = {
      schema_version: '',
      model_name: '',
      description: '',
      entities: {}
    };

    // 各ブロックをロードしてモデルにマージする
    for (const doc of yamlDocs) {
      const loaded = yaml.load(doc) as Partial<LogicalModel>;
      if (!loaded) continue;
      
      if (loaded.schema_version) model.schema_version = loaded.schema_version;
      if (loaded.model_name) model.model_name = loaded.model_name;
      if (loaded.description) model.description = loaded.description;
      if (loaded.entities) {
        model.entities = { ...model.entities, ...loaded.entities };
      }
    }

    if (Object.keys(model.entities).length === 0) {
      console.error('Error: No entities found in the logical model.');
      process.exit(1);
    }

    console.log(`Model: ${model.model_name}`);
    console.log(`Description: ${model.description}`);

    for (const [entityName, entity] of Object.entries(model.entities)) {
      generateEntityFile(entityName, entity, outputDir);
    }

    console.log('\nSuccess: All entities generated.');
  } catch (error) {
    console.error('Error during generation:', error);
    process.exit(1);
  }
}

main();
