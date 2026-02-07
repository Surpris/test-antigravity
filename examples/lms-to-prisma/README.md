# lms-to-prisma (Logical Model to Prisma Generator)

論理データモデル（YAML）を Prisma スキーマに変換・拡張するジェネレーターです。

## 概要

このプロジェクトは、ビジネス視点での**論理データモデル (YAML)** を、システム実装用の **Prisma Schema** へ自動変換することを目的としています。
ドメインの定義とシステムの実装詳細（UUID、監査ログ、論理削除など）を分離し、YAML ファイルを「正（Single Source of Truth）」として管理することを可能にします。

## 特徴

- **論理モデルからの自動変換**: YAML で定義したエンティティ、属性、リレーションシップを Prisma モデルに変換します。
- **システムフィールドの自動注入**: すべてのモデルに `id` (UUID), `createdAt`, `updatedAt`, `deletedAt`（論理削除用）を自動的に追加します。
- **命名規則の自動調整**: YAML 内のスネークケース（snake_case）を、Prisma 推奨のパスカルケース（PascalCase: モデル名）やキャメルケース（camelCase: フィールド名）に変換します。
- **リレーションシップの解決**: YAML で定義された一方向のリレーションから、Prisma に必要な双方向リレーションを推論・生成します。
- **システムモデルの結合**: グラフ構造を扱うための `UserDefinedRelationship` など、共通のシステムモデルを生成されたスキーマの末尾に自動結合します。

## 技術スタック

- **言語**: TypeScript (Node.js)
- **データ形式**: YAML (`yaml` パッケージ)
- **バリデーション**: AJV (JSON Schema)
- **テスト**: Vitest
- **ORM**: Prisma

## ディレクトリ構成

- `src/index.ts`: CLI エントリーポイント
- `src/core/`: 変換ロジックのコア（`PrismaSchemaBuilder` 等）
- `src/templates/`: スキーマに結合される静的な Prisma モデル
- `sample/`: 論理データモデル（YAML）のサンプル
- `schema/`: YAML バリデーション用の JSON Schema
- `docs/`: 仕様書および実装計画
- `prisma/`: 生成された Prisma スキーマの出力先

## 使い方

### インストール

```bash
npm install
```

### スキーマ生成

デフォルトではカレントディレクトリの `logical_model.yaml` を読み込み、`prisma/schema.prisma` を出力します。
サンプルを使用して実行する場合は、以下のように入力を指定して実行してください。

```bash
npm run generate:schema -- --input sample/logical_model.yaml
```

### テストの実行

```bash
npm test
```

### 型チェックとリンター

```bash
npm run typecheck
```

## 開発フロー

1. `sample/logical_model.yaml` などを編集し、ドメインモデルを定義します。
2. `npm run generate:schema` を実行して Prisma スキーマを更新します。
3. `prisma/schema.prisma` の差分を確認し、必要に応じてマイグレーションを実行します。
