import { LogicalModel, Entity, Attribute, Relationship } from './types';

/**
 * 論理モデルを GraphQL SDL 文字列に変換します。
 * @param model 変換対象の論理データモデル
 * @returns 生成された GraphQL SDL
 */
export function convertLogicalModelToGraphQL(model: LogicalModel): string {
  const parts: string[] = [];

  // ヘッダーの追加
  parts.push(`# GraphQL Schema for ${model.model_name}`);
  if (model.description) {
    parts.push(`"""\n${model.description}\n"""`);
  }

  // 各エンティティの変換
  const typeDefinitions: string[] = [];
  const queryFields: string[] = [];

  for (const [entityName, entity] of Object.entries(model.entities)) {
    typeDefinitions.push(convertEntity(entityName, entity));
    
    // 属性を持つリレーションシップの中間型を生成
    if (entity.relationships) {
      for (const [relName, rel] of Object.entries(entity.relationships)) {
        if (rel.attributes) {
          typeDefinitions.push(convertRelationshipType(entityName, relName, rel));
        }
      }
    }

    // Queryのフィールドを収集（主キーがある場合）
    for (const [attrName, attr] of Object.entries(entity.attributes)) {
      if (attr.primary_key) {
        // エンティティ名の先頭を小文字にしてクエリフィールド名とする
        const queryName = decapitalize(entityName);
        // 戻り値は単一のエンティティ（nullable）とする
        queryFields.push(`  ${queryName}(${attrName}: ID!): ${entityName}`);
        break; // 主キーは1つと想定
      }
    }
  }

  // Query型の生成（先頭に追加）
  if (queryFields.length > 0) {
    const queryLines = ['type Query {', ...queryFields, '}'];
    parts.push(queryLines.join('\n'));
  }

  // 他の型定義を追加
  parts.push(...typeDefinitions);

  return parts.join('\n\n');
}

/**
 * 単一のエンティティを GraphQL type に変換します。
 * @param name エンティティ名
 * @param entity エンティティ定義
 * @returns エンティティの GraphQL type 定義
 */
function convertEntity(name: string, entity: Entity): string {
  const lines: string[] = [];
  if (entity.description) {
    lines.push(`"""\n${entity.description}\n"""`);
  }
  lines.push(`type ${name} {`);

  // 属性の変換
  for (const [attrName, attr] of Object.entries(entity.attributes)) {
    lines.push(`  ${convertfield(attrName, attr)}`);
  }

  // リレーションシップの変換
  if (entity.relationships) {
    for (const [relName, rel] of Object.entries(entity.relationships)) {
      lines.push(`  ${convertRelationshipField(name, relName, rel)}`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * 属性を GraphQL フィールドに変換します。
 * @param name フィールド名
 * @param attr 属性定義
 * @param isEdgeProperty リレーションシップ属性（エッジプロパティ）かどうか
 * @returns GraphQL フィールド定義
 */
function convertfield(name: string, attr: Attribute, isEdgeProperty: boolean = false): string {
  let type = mapType(attr.type);
  
  // 主キーの場合は ID 型にする
  if (attr.primary_key) {
    type = 'ID';
  }

  // 必須チェック（主キーは常に必須）
  if (attr.required || attr.primary_key) {
    type += '!';
  }

  const desc = attr.description ? `  "${attr.description}"\n  ` : '';
  return `${desc}${name}: ${type}`;
}

/**
 * 論理モデルの型を GraphQL のスカラ型にマッピングします。
 * @param type 論理モデルの型
 * @returns GraphQL の型名
 */
function mapType(type: Attribute['type']): string {
  switch (type) {
    case 'String': return 'String';
    case 'Integer': return 'Int';
    case 'Float': return 'Float';
    case 'Boolean': return 'Boolean';
    case 'Date': return 'String';
    case 'DateTime': return 'String';
    case 'Text': return 'String';
    case 'Enum': return 'String'; 
    default: return 'String';
  }
}

/**
 * リレーションシップを GraphQL フィールドに変換します。
 * @param entityName 元のエンティティ名
 * @param relName リレーションシップ名
 * @param rel リレーションシップ定義
 * @returns GraphQL フィールド定義
 */
function convertRelationshipField(entityName: string, relName: string, rel: Relationship): string {
  let type = rel.target;

  // 属性がある場合は中間型を指すようにする
  if (rel.attributes) {
    type = getIntermediateTypeName(entityName, relName);
  }

  // カーディナリティに基づきリスト型にするかどうかを判定
  const isList = rel.cardinality === '1:N' || rel.cardinality === '0:N' || rel.cardinality === 'N:M';
  if (isList) {
    type = `[${type}]`;
  }

  // カーディナリティが '1:...' の場合は必須とする
  const isRequired = rel.cardinality.startsWith('1');
  if (isRequired) {
    type += '!';
  }

  const desc = rel.description ? `  "${rel.description}"\n  ` : '';
  return `${desc}${relName}: ${type}`;
}

/**
 * 属性を持つリレーションシップのための中間型を生成します。
 * @param entityName エンティティ名
 * @param relName リレーションシップ名
 * @param rel リレーションシップ定義
 * @returns 中間型の GraphQL type 定義
 */
function convertRelationshipType(entityName: string, relName: string, rel: Relationship): string {
    const typeName = getIntermediateTypeName(entityName, relName);
    const lines: string[] = [];
    
    lines.push(`"""\nRelationship object for ${entityName}.${relName}\n"""`);
    lines.push(`type ${typeName} {`);
    
    // ターゲットフィールド
    lines.push(`  target: ${rel.target}!`);
    
    // リレーション自体の属性
    if (rel.attributes) {
      for (const [attrName, attr] of Object.entries(rel.attributes)) {
        lines.push(`  ${convertfield(attrName, attr, true)}`);
      }
    }
    
    lines.push('}');
    return lines.join('\n');
}

/**
 * 中間型の型名を生成します（例: DatasetManagedBy）。
 * @param entityName エンティティ名
 * @param relName リレーションシップ名
 * @returns 生成された型名
 */
function getIntermediateTypeName(entityName: string, relName: string): string {
  return `${entityName}${capitalize(relName)}`;
}

/**
 * 文字列の先頭を大文字にします。
 * @param s 文字列
 * @returns 先頭が大文字の文字列
 */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * 文字列の先頭を小文字にします。
 * @param s 文字列
 * @returns 先頭が小文字の文字列
 */
function decapitalize(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

