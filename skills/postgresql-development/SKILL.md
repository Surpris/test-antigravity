---
name: postgresql-development
description: PostgreSQL + Prisma を使用したパフォーマンス重視のデータベース設計・実装スキル
---

# PostgreSQL Development with Prisma Skill

このスキルは、PostgreSQL と Prisma を使用して、パフォーマンスと信頼性の高いデータベース層を設計・実装するためのベストプラクティスを提供します。

## 1. データ設計とスキーマ (Schema Design)

### 1.1 主キー (Primary Key) の選定

- **推奨**: **UUID v7** (または TSID) を使用する。
- **理由**:
  - `Serial`/`Identity` (連番) は分散システムでの衝突リスクやID推測のリスクがある。
  - 通常の `UUID v4` (ランダム) はインデックスの断片化を引き起こし、INSERT性能を劣化させる。
  - `UUID v7` は時系列順のため B-Tree インデックスと相性が良い。
- **実装方法**:
  - アプリケーション側（TypeScriptライブラリ等）で UUID v7 を生成して渡すのが一般的です。
  - PostgreSQL 17以降であれば `uuidv7()` が利用可能です。
  - Prismaスキーマ例:

    ```prisma
    model User {
      id String @id @db.Uuid // 値はアプリ側で生成するか、DB関数を利用
      // ...
    }
    ```

### 1.2 JSONB型の適切な利用

- **ルール**: JSONBは「どうしてもスキーマレスが必要な場合」にのみ使用する。
- **必須**: JSONBカラムの中身を検索条件にする場合は、必ず **GINインデックス** を作成する。
- **SQL**:

  ```sql
  CREATE INDEX idx_products_attributes ON products USING GIN (attributes);
  ```

- **Prisma**:

  ```prisma
  model Product {
    id         String @id
    attributes Json
    
    // GINインデックスの定義 (Prisma Client Extensions や raw query が必要な場合あり、
    // または @@index([attributes], type: Gin) ※要PreviewFeature確認)
    @@index([attributes], type: Gin)
  }
  ```

### 1.3 Generated Columns (生成列) の活用

- **目的**: 検索のための計算コストを削減する（例: `first_name` + `last_name` の結合検索）。
- **方法**: `GENERATED ALWAYS AS ... STORED` を使用して計算結果を物理的に保存し、そこにインデックスを貼る。
- **Prisma**:
  - Prismaスキーマでは `Unsupported` 型として扱うか、マイグレーションファイル（SQL）で手動定義する必要があります。

## 2. 同時実行性と信頼性 (Concurrency & Reliability)

### 2.1 トランザクション分離レベル

- **デフォルト**: `Read Committed` (ファントムリード等は防げない)。
- **対策**: 在庫管理や口座残高など厳密な整合性が必要な処理では、**Repeatable Read** 以上の使用を検討する。
- **注意**: `could not serialize access` エラーが発生するため、**リトライ処理**の実装が必須。

### 2.2 排他制御 (Pessimistic Locking)

- **問題**: 同時更新によるレースコンディション（在庫の二重引当など）。
- **対策**: 読み取り時に **SELECT FOR UPDATE** で行ロックを取得する。
- **Prisma**: ネイティブAPIがないため、`$queryRaw` を使用する。

  ```typescript
  await prisma.$transaction(async (tx) => {
    // ロック取得
    const items = await tx.$queryRaw`SELECT stock FROM "Item" WHERE id = ${itemId} FOR UPDATE`;
    
    // ... 在庫確認と更新処理 ...
  });
  ```

### 2.3 Transactional Outbox パターン

- **問題**: DB更新と外部API連携（メール送信など）の整合性。
- **対策**: 「処理待ちタスク」を同一トランザクション内でDB (`mail_queue` 等) に保存する。
- **処理**: ワーカープロセスで `FOR UPDATE SKIP LOCKED` を使って安全にポーリングする。

  ```sql
  SELECT * FROM mail_queue
  WHERE status = 'pending'
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1;
  ```

### 2.4 コネクションプーリング

- **必須**: Node.js / Serverless 環境からの直接接続は避ける。
- **対策**: PgBouncer, Global Concurrency Limits, または Prisma Accelerate などを使用する。

## 3. パフォーマンスと運用 (Performance & Ops)

### 3.1 タイムアウト設定

- アプリケーション側だけでなく、DB側でも `statement_timeout` を設定し、暴走クエリによる障害を防ぐ。

### 3.2 パーティショニング

- ログデータなどの「追記のみ・大量」テーブルは `PARTITION BY RANGE` で分割し、不要データを `DROP TABLE` で高速に削除できるようにする。

### 3.3 実行計画 (Explain Analyze)

- **鉄則**: パフォーマンス問題は推測せず、必ず `EXPLAIN (ANALYZE, BUFFERS)` で実測する。

  ```sql
  EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE user_id = ...;
  ```
