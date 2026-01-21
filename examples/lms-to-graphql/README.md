# Logical Model to GraphQL Converter

このツールは、YAML形式で定義された論理データモデル（Logical Data Model）を GraphQL SDL (Schema Definition Language) に変換する CLI ツールです。

## 特徴

- **論理データモデルの正規化**: YAMLで定義されたエンティティ、属性、リレーションシップを解析します。
- **GraphQL スキーマ生成**: エンティティを GraphQL の `type` に変換し、属性をフィールドに変換します。
- **リレーションシップの解決**: 1:1, 1:N, 0:1, 0:N, N:M のカーディナリティに基づき、適切な GraphQL 型（単一オブジェクトまたはリスト）を生成します。
- **リレーションシップ属性のサポート**: リレーションシップ自体が属性を持つ場合（Edge properties）、中間型を自動生成して適切にマッピングします。
- **整合性バリデーション**: Ajv を使用したスキーマチェックに加え、存在しないエンティティへの参照などの論理チェックを行います。

## インストール

```bash
cd examples/lms-to-graphql
npm install
```

## 使い方

### CLI での実行

`ts-node` を使用して直接実行する場合：

```bash
npm start -- <path/to/logical_model.yaml> [ -o <output_directory> ]
```

**引数:**

- `<path/to/logical_model.yaml>`: 変換対象の YAML ファイルのパス。

**オプション:**

- `-o, --output <dir>`: 生成された GraphQL スキーマファイルを保存するディレクトリ。指定しない場合は、入力ファイルと同じディレクトリに保存されます。

### 実行例

```bash
# サンプルモデルを変換
npm start -- ./sample/logical_model.yaml -o ./dist/output
```

## マッピングルール

| 論理モデル | GraphQL | 補足 |
| :--- | :--- | :--- |
| **Entity** | `type` | エンティティ名が型名になります。 |
| **Attribute** | Field | `primary_key: true` の場合は `ID!` 型になります。 |
| **Relationship** | Field | カーディナリティが `..:N` または `N:M` の場合はリスト型 `[...]` になります。 |
| **Relationship (w/ attributes)** | Intermediate `type` | リレーションに属性がある場合、`EntityNameRelName` という中間型が生成されます。 |

### リレーションシップ属性の例

論理モデルで以下のようなリレーションが定義されている場合：

```yaml
relationships:
  managed_by:
    target: "Contributor"
    cardinality: "0:1"
    attributes:
      assigned_at:
        type: "Date"
        description: "アサイン日"
```

以下のような GraphQL が生成されます：

```graphql
type Dataset {
  managed_by: DatasetManagedBy
}

"""
Relationship object for Dataset.managed_by
"""
type DatasetManagedBy {
  target: Contributor!
  "アサイン日"
  assigned_at: String
}
```

## 開発

### ビルド

```bash
npm run build
```

### ソースコード構成

- `src/index.ts`: CLI エントリポイント。引数解析とファイル入出力を担当。
- `src/validator.ts`: 入力 YAML のバリデーション（スキーマチェック & 参照整合性）。
- `src/converter.ts`: 論理モデルから GraphQL SDL への変換ロジック。
- `src/types.ts`: 論理モデルのインターフェース定義。
