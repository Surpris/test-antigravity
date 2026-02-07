# 論理データモデル to Prisma Generator 実装計画書

**MUST:**

- 本プロジェクトの仕様書である [specifications.md](./specifications.md) を通読すること。
- 本プロジェクトでは @.agent/rules/testing.md を遵守し、テスト駆動開発を実施すること。
- serena MCP を用いてコードベースの管理および開発状況を把握すること。
- 必要に応じて、context7 MCP を利用してライブラリの概要や設計、使用方法を確認すること。

## 0. 事前準備・環境定義

- **Target:** `schema.prisma` (Prisma v6)
- **Test Framework:** `Vitest` (推奨) または `Jest`
  - _理由:_ 文字列比較やスナップショットテストが容易であるため。
- **Essential Test:** format check (linting with `--fix`, typecheck)
- **Validation:** `ajv` (JSON Schema Validator)

## Phase 1: スキーマ検証と型定義 (基盤構築)

**ゴール:** YAMLを読み込み、それが仕様（Schema）に適合しているかを判定できる。

- **仕様参照:** `logical_model_schema.json`
- **TDDサイクル:**

1. **Test (Red):**
   - 不正なYAML（必須項目欠落など）を読み込ませ、エラーがスローされることを確認するテストを書く。
   - 正常なYAMLを読み込ませ、TypeScriptの型 `LogicalModel` としてパースされることを確認するテストを書く。

2. **Implement (Green):**
   - `logical_model_schema.json` から TypeScript 型定義を生成（`json-schema-to-typescript` 利用推奨）。
   - YAMLローダーと `ajv` によるバリデーションロジックを実装。

3. **Refactor:**
   - エラーメッセージを人間が読みやすい形式に整形する。

## Phase 2: 単体モデル変換とシステムフィールド注入

**ゴール:** リレーションを含まない単一のエンティティが、正しい Prisma Model 構文に変換される。

- **仕様参照:** 機能要件 3.2.1（命名規則）, 3.2.2（システムフィールド）, 3.2.4（型マッピング）
- **TDDサイクル:**

1. **Test (Red):** `Project` エンティティ（属性のみ）を入力とし、以下の文字列が含まれることを期待するテストを書く。
   - `model Project {` (PascalCase変換)
   - `projectNumber String @unique` (camelCase変換 + PKのUnique化)
   - `id String @id @default(uuid())` (システムID注入)
   - `createdAt`, `updatedAt`, `deletedAt` (監査フィールド注入)

2. **Implement (Green):**
   - `PrismaSchemaBuilder` クラスの実装。
   - 属性ループ処理と文字列テンプレートの実装。

3. **Refactor:**
   - インデントやフォーマットが崩れていないか確認（最終的に `prisma format` を通すが、生成段階でも綺麗にしておく）。

## Phase 3: Enum とリレーションシップ (基本)

**ゴール:** Enumの定義と、単純な 1:N リレーションが解決される。

- **仕様参照:** 機能要件 3.2.4（Enum）, 3.3（リレーション）
- **TDDサイクル (Enum):**

1. **Test:** `AccessPolicy` Enum を含むモデルを入力し、`enum DatasetAccessPolicy { ... }` が出力されるテスト。
2. **Implement:** Enum生成ロジックの実装。

- **TDDサイクル (Relation):**

1. **Test:** `Project` (1) - (N) `Dataset` の定義を入力。
   - Project側に `datasets Dataset[]` が生成されること。
   - Dataset側に `project Project @relation(...)` と `projectId String` が生成されること。

2. **Implement:**
   - 双方向リンクの解決ロジック（`target` エンティティを探し、逆参照フィールドを決定する処理）。

## Phase 4: 属性付きリレーションの展開 (高度な変換)

**ゴール:** `managed_by` のような「属性を持つリレーション」が、適切にフラット化される。

- **仕様参照:** 機能要件 3.3（属性付きリレーションの展開）
- **TDDサイクル:**

1. **Test:** `Dataset` -(managed_by)-> `Contributor` (0:1) の定義を入力（属性 `managed_from` 付き）。
   - Datasetモデル内に `managedFrom DateTime?` カラムが生成されていることを確認。

2. **Implement:**
   - リレーション定義内の `attributes` を検知し、それをカラムとして追加するロジック。

## Phase 5: 統合と CLI 化 (E2E)

**ゴール:** コマンド一つでファイル生成まで完結する。

- **仕様参照:** 機能要件 3.4（固定定義結合）, 4.1（コマンド）
- **TDDサイクル:**

1. **Test (E2E):** `logical_model.yaml` を入力としてコマンド実行。
   - `prisma/schema.prisma` ファイルが生成されること。
   - 生成されたファイル末尾に `UserDefinedRelationship` モデルが含まれていること。
   - `npx prisma validate` コマンドがエラーなしで通ること（これが最終合格ライン）。

2. **Implement:**
   - ファイル入出力処理 (`fs`)。
   - 固定テンプレート（`UserDefinedRelationship`）の読み込みと結合。
   - CLI引数処理。

---

## 開発ディレクトリ構成案

```text
generator/
├── src/
│   ├── types/           # 生成された型定義
│   ├── core/
│   │   ├── loader.ts    # YAML読み込み & バリデーション
│   │   ├── builder.ts   # Prisma構文構築 (Builder Pattern)
│   │   └── mapper.ts    # 型変換・命名規則変換ロジック
│   └── templates/       # 固定部分 (UserDefinedRelationshipなど)
├── tests/
│   ├── fixtures/        # テスト用YAMLデータ
│   ├── unit/            # Phase 1-4 のテスト
│   └── e2e/             # Phase 5 のテスト
├── schema/
│   └── logical_model_schema.json
├── sample/
│   └── logical_model.yaml
└── package.json
```
