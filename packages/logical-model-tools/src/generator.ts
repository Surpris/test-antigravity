import * as yaml from 'js-yaml';
import { YamlSchema, EntityDef, AttributeDef, RelationshipDef } from './types';

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

export function generateTypeScript(yamlContent: string): string {
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

      // Relationship Attributes
      if (relDef.attributes) {
        for (const [attrName, attrDef] of Object.entries(relDef.attributes || {})) {
          const isOptional = !attrDef.required;
          const doc = generateJSDoc(attrDef.description, attrDef.note);
          
          let tsType = 'any';
          if (attrDef.type === 'Enum' && attrDef.options) {
            tsType = attrDef.options.map(opt => `"${opt}"`).join(' | ');
          } else {
            tsType = TYPE_MAPPING[attrDef.type] || 'any';
          }

          if (doc) lines.push(`  ${doc}`);
          lines.push(`  ${attrName}${isOptional ? '?' : ''}: ${tsType};`);
        }
      }

      lines.push('}');
      lines.push('');
    }
  }

  return lines.join('\n');
}
