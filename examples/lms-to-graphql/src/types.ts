/**
 * 論理データモデルのルート構造を表すインターフェース。
 */
export interface LogicalModel {
  /** スキーマのバージョン */
  schema_version: string;
  /** モデルの名称 */
  model_name: string;
  /** モデルの説明（任意） */
  description?: string;
  /** エンティティのマップ（キーはエンティティ名） */
  entities: { [key: string]: Entity };
}

/**
 * エンティティ（テーブルやオブジェクト）の定義を表すインターフェース。
 */
export interface Entity {
  /** エンティティの説明 */
  description: string;
  /** 属性（カラム）のマップ（キーは属性名） */
  attributes: { [key: string]: Attribute };
  /** リレーションシップのマップ（キーはリレーションシップ名、任意） */
  relationships?: { [key: string]: Relationship };
}

/**
 * 属性（フィールド）の詳細定義を表すインターフェース。
 */
export interface Attribute {
  /** データ型 */
  type: 'String' | 'Integer' | 'Float' | 'Boolean' | 'Date' | 'DateTime' | 'Text' | 'Enum';
  /** 属性の説明 */
  description: string;
  /** 必須項目かどうか（任意、デフォルトは false） */
  required?: boolean;
  /** 主キーかどうか（任意、デフォルトは false） */
  primary_key?: boolean;
  /** 補足事項（任意） */
  note?: string;
  /** Enum 型の場合の選択肢（任意） */
  options?: string[];
}

/**
 * エンティティ間のリレーションシップを定義するインターフェース。
 */
export interface Relationship {
  /** ターゲットとなるエンティティ名 */
  target: string;
  /** リレーションシップの説明（任意） */
  description?: string;
  /** カーディナリティ (1:1, 1:N, 0:1, 0:N, N:M) */
  cardinality: '1:1' | '1:N' | '0:1' | '0:N' | 'N:M';
  /** リレーションシップ自体が持つ属性（Edge properties、任意） */
  attributes?: { [key: string]: Attribute };
}

