# テスト項目リストアップ報告書 (Phase 4 完了時点)

本ドキュメントは、現在の `examples/lms-to-prisma` プロジェクトのコードベースおよびテストコードを分析し、不足していると考えられるテスト項目を優先度付きでリストアップしたものです。

## 1. 現状分析

### 実装状況

- **Phase 1 (Schema Validation):** `src/core/loader.ts` に実装済み。型定義の生成 (`json-schema-to-typescript`) は未確認だが、バリデーションロジックは存在する。
- **Phase 2 (Entity Conversion):** `src/core/PrismaSchemaBuilder.ts` に実装済み。
- **Phase 3 (Relation/Enum):** 1:N リレーションおよび Enum の生成ロジックは実装済み。
- **Phase 4 (Attributed Relation):** 交差テーブル（中間テーブル）の属性を 1:N および 0:1 のターゲット側にフラット化するロジックは実装済み。

### テスト状況

- **Unit Tests:** `src/core/PrismaSchemaBuilder.test.ts` にて、モデル変換、Enum生成、リレーション解決（属性フラット化含む）の基本ケースは網羅されている。
- **E2E Tests:** `tests/e2e` ディレクトリは存在するが、中身は空である（もしくは未実装）。
- **Phase 5 (CLI/Integration):** 未実装であり、これに関連するテストも存在しない。

## 2. 不足しているテスト項目 (優先度順)

### Priority High: 統合テストとCLI (Phase 5 必須要件)

Phase 5 の実装に向けて、以下のテストを最優先で追加する必要があります。これらはシステム全体が正しく連携して動作することを保証します。

1. **UserDefinedRelationship モデルの存在確認**
   - **内容:** 生成された `schema.prisma` ファイルの末尾に、`src/templates/UserDefinedRelationship` (今後作成予定) の内容が含まれていることを確認するテスト。
   - **目的:** 固定テンプレートの結合ロジックが正常に機能しているか検証する。

2. **E2E シナリオ: YAML から Prisma Schema 生成**
   - **内容:** `sample/logical_model.yaml` (またはテスト用フィクスチャ) を入力とし、完全な `schema.prisma` 文字列が出力されることを確認するテスト。
   - **目的:** Loader, Builder, Template Injection の全工程を通した結合テスト。

3. **生成された Schema の有効性検証**
   - **内容:** 生成された `schema.prisma` に対して `npx prisma validate` コマンドを実行し、エラーが発生しないことを確認するテスト。
   - **目的:** 生成された構文が Prisma の仕様に完全に準拠していることを保証する（"最終合格ライン"）。

### Priority Medium: エッジケースと堅牢性 (Phase 3/4 補強)

現在の実装は基本的なケースを想定していますが、複雑なデータモデルに対する堅牢性を高めるために以下のテストが必要です。

1. **同一エンティティ間の複数リレーション (Multiple Relations)**
   - **内容:** `User` が `createdTasks` と `assignedTasks` という2つのリレーションを持つ場合など、同一モデル間に複数のリレーションが存在するケースのテスト。
   - **懸念:** 現在の実装ではバックリファレンスの命名 (`toCamelCase(entityName)`) が重複し、Prisma Schema 上で名前衝突を起こす可能性がある。
   - **期待値:** `relation("Name")` 属性の使用や、フィールド名にリレーション名を付与するなどして衝突が回避されること。

2. **自己参照リレーション (Self-Reference)**
   - **内容:** `Employee` が `manager` (Employee型) を持つような自己参照パターンのテスト。
   - **懸念:** バックリファレンスが自身のモデル内で適切に命名されるか確認が必要。

3. **予約語の回避**
   - **内容:** フィールド名やモデル名に Prisma の予約語（`model`, `enum`, `String` など）が使用された場合の挙動確認。
   - **期待値:** エラーになるか、適切にエスケープ/リネームされること。

4. **全データ型のマッピング検証**
   - **内容:** `Boolean`, `Float`, `Integer`, `Date` (`@db.Date`), `Text` (`@db.Text`) など、すべての対応型が正しく Prisma 型に変換されるか網羅的にテストする。
   - **現状:** `mapType` メソッドはあるが、テストケースですべての型が網羅されていない可能性がある。

### Priority Low: 保守性と品質向上

1. **エラーメッセージの人間可読性**
   - **内容:** `loader.ts` において、不正な YAML を読み込ませた際のエラーメッセージが、開発者にとって理解しやすい形式（パスや行番号の明示など）になっているか検証する。

2. **ヘルパー関数のユニットテスト**
   - **内容:** `toPascalCase`, `toCamelCase` などの文字列操作関数に対する独立したユニットテスト。
   - **目的:** 特殊文字や数字を含むケースなど、命名規則変換のコーナーケースを潰しておく。
