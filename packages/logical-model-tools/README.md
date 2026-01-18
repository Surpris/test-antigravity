# Logical Model Tools

論理データモデル（Logical Data Model）を YAML 形式で定義し、そこから TypeScript の型定義を自動生成したり、モデルの整合性を検証したりするためのツールセットです。

## 特徴

* **TypeScript 生成 (`lms-gen`)**: YAML で記述されたエンティティとリレーションシップ定義から、TypeScript の `interface` を自動生成します。Property Graph モデルを意識し、リレーションシップも独立したインターフェースとして出力します。
* **モデル検証 (`lms-val`)**: 定義されたモデルがスキーマ（JSON Schema）に適合しているか、およびリレーションシップの参照先が存在するか（参照整合性）をチェックします。

## インストール

このパッケージは npm パッケージとして構成されています。プロジェクトにインストールして使用します。

```bash
# ローカルパスからインストールする場合
npm install /path/to/packages/logical-model-tools
```

## CLI の使い方

インストールすると、以下のコマンドが利用可能になります。

### 1. コード生成 (`lms-gen`)

指定したディレクトリ内の YAML ファイル (`.yaml`, `.yml`) または指定したファイルを読み込み、同ディレクトリに `_types.ts` ファイルを生成します。

```bash
npx lms-gen <対象ディレクトリまたはファイルパス>
```

**例:**

```bash
# sample ディレクトリ内のすべての YAML を処理
npx lms-gen ./sample

# 特定のファイルのみ処理
npx lms-gen ./sample/my_model.yaml
```

### 2. バリデーション (`lms-val`)

指定したディレクトリまたはファイルの論理モデル定義を検証します。
文法エラー（スキーマ違反）だけでなく、リレーションシップの `target` が実在するエンティティを指しているかどうかの整合性もチェックします。

```bash
npx lms-val <対象ディレクトリまたはファイルパス>
```

**例:**

```bash
npx lms-val ./sample
```

## プログラムからの利用

Node.js / TypeScript スクリプトからライブラリとしてインポートして利用することも可能です。

```typescript
import { generateTypeScript, ModelValidator } from 'logical-model-tools';
import * asfs from 'fs';

// --- コード生成 ---
const yamlContent = fs.readFileSync('./model.yaml', 'utf8');
const tsCode = generateTypeScript(yamlContent);
console.log(tsCode);

// --- バリデーション ---
const validator = new ModelValidator();
const result = validator.validate(yamlContent);

if (result.valid) {
  console.log('Valid model!');
} else {
  console.error('Errors:', result.errors);
}
```

## YAML フォーマット仕様

入力となる YAML は以下の構造を持っている必要があります（詳細は `schema/logical_model_schema.json` を参照）。

```yaml
schema_version: "1.0"
model_name: "ExampleModel"
entities:
  User:
    description: "ユーザー"
    attributes:
      user_id:
        type: "String"
        primary_key: true
      name:
        type: "String"
        required: true
    relationships:
      has_posts:
        target: "Post"
        cardinality: "1:N"
  Post:
    attributes:
      post_id:
        type: "String"
        primary_key: true
      # ...
```
