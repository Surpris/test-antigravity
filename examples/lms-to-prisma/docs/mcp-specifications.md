# 機能仕様書: MCP Server for Logical Model to Prisma Generator

## 1. はじめに

### 1.1. 目的

本仕様書は、「Logical Model to Prisma Generator」の機能を Model Context Protocol (MCP) 経由で公開するための機能仕様を定義します。
MCP サーバーを介してツールを公開することで、AI エージェントが論理データモデルの設計、検証、および Prisma スキーマの生成をプログラム介在なしに自律的に実行可能にすることを目的とします。

### 1.2. ターゲット会員

- AI コーディングアシスタント（Cursor, Claude Desktop, Antigravity など）
- 開発自動化エージェント
- ドメイン設計を支援するAIツール

---

## 2. MCP リソース (Resources)

AI エージェントが参照可能な、コンテキスト情報としてのリソースを定義します。

| URI | 名前 | 説明 |
| :--- | :--- | :--- |
| `logical-model://current` | 現在の論理モデル | `logical_model.yaml` の最新の内容を提供します。 |
| `prisma-schema://current` | 生成された Prisma スキーマ | 現在 `prisma/schema.prisma` に出力されている内容を提供します。 |
| `schema://logical-model-definition` | 論理モデルのメタスキーマ | `logical_model_schema.json` の内容（バリデーションルール）を提供します。 |

---

## 3. MCP ツール (Tools)

AI エージェントが呼び出し可能な特定の操作を定義します。

### 3.1. `generate_prisma_schema`

- **機能:** 論理モデルファイルから Prisma スキーマを生成し、ファイルに出力します。
- **引数:**
  - `inputPath` (string, optional): 入力 YAML のパス（デフォルトは設定ファイルに従う）。
  - `outputPath` (string, optional): 出力 Prisma ファイルのパス。
- **戻り値:** 生成成功メッセージ、またはエラー詳細。生成されたスキーマの抜粋を含む。

### 3.2. `validate_logical_model`

- **機能:** 指定された YAML 内容またはファイルが、論理モデルの規定（JSON Schema）に適合しているか検証します。
- **引数:**
  - `content` (string, optional): 検証対象の YAML 文字列。
  - `path` (string, optional): 検証対象のファイルパス。
- **戻り値:** バリデーション結果（Success/Failure）およびエラーメッセージ（行番号・原因）。

### 3.3. `get_model_summary`

- **機能:** 論理モデルの構造を俯瞰するための要約情報を提供します。
- **引数:** なし
- **戻り値:**
  - エンティティ一覧（名前、説明）
  - リレーションシップの合計数と接続マトリックス
  - Enum の定義数

### 3.4. `add_logical_entity`

- **機能:** 論理モデルに新しいエンティティ定義を追加します。
- **引数:**
  - `entityName` (string): 追加するエンティティ名。
  - `definition` (object): 属性・説明・リレーションなどの定義。
- **戻り値:** 更新後の `logical_model.yaml` のステータス。

---

## 4. MCP プロンプト (Prompts)

特定のアクティビティを支援するための対話テンプレートを定義します。

### 4.1. `design-data-model`

- **目的:** 会員の抽象的な要求から、最適な論理データモデルを提案します。
- **引数:**
  - `requirement` (string): 「TODOアプリのデータ構造を考えて」などのテキスト。
- **期待される動作:** AI が `logical_model.yaml` 形式のコードブロックを含む設計案を提示します。

### 4.2. `explain-prisma-mapping`

- **目的:** 特定の論理モデル定義がどのように Prisma モデルに変換されるか（システムフィールドの注入や物理型のマッピング）を解説します。
- **引数:**
  - `entityName` (string): 解説対象のエンティティ。

---

## 5. 実装要件

### 5.1. 使用技術

- **Library:** `@modelcontextprotocol/sdk`
- **Transport:** Stdio (Standard Input/Output)
- **Runtime:** Node.js / TypeScript

### 5.2. セキュリティ

- ファイル書き込み操作（`add_logical_entity` 等）を行う際は、プロジェクトルート配下の特定のディレクトリに対してのみ許可する。
- 設定ファイル以外のパスへのアクセスを制限するサンドボックス的な振る舞いを推奨。

---

## 6. ユースケース例

1. **会員:** 「新しいエンティティ『研究成果』を論理モデルに追加して。」
2. **AI エージェント:** `add_logical_entity` ツールを呼び出して `logical_model.yaml` を更新。
3. **AI エージェント:** `generate_prisma_schema` を呼び出して `schema.prisma` を更新。
4. **AI エージェント:** `npx prisma migrate dev` を実行し、DB スキーマを同期（MCP 外のコマンド実行）。
