# 論理データモデル記述仕様書 (YAML形式 / モジュール分割対応)

論理データモデルを定義する際は、以下のYAMLフォーマット仕様およびJSON Schema定義（`logical_model_schema_separated.json`）を厳守してください。
本仕様は、モデルを複数のファイル（マスター定義とエンティティ断片）に分割して管理することを想定しています。

## 1. ファイル構造パターン

状況に応じて、以下の **Pattern A** または **Pattern B** のいずれかの構造を採用してください。

### Pattern A: マスター定義ファイル (Master Definition)

モデル全体のメタデータを定義する場合に使用します。

- `schema_version`: 必須 ("1.0")
- `model_name`: 必須 (英数字とアンダースコアのみ)
- `entities`: 定義を含めても良いが、空 (`{}`) でも可。

```yaml
schema_version: "1.0"
model_name: "My_Logical_Model"
description: "モデル全体の概要"
entities: {} 

```

### Pattern B: エンティティ定義ファイル (Entity Fragment)

特定のドメインや機能群（例: プロジェクト管理、ユーザー管理）のエンティティのみを定義する場合に使用します。

- `schema_version`, `model_name`: **省略可能**です。
- `entities`: **必須**です。ここに具体的なエンティティ定義を記述します。

```yaml
entities:
  EntityName: # PascalCase (例: UserProfile)
    description: "エンティティの説明"
    attributes:
      attribute_name: # snake_case (例: user_id)
        # ...属性定義
    relationships:
      relationship_name: # snake_case (例: has_orders)
        # ...リレーション定義

```

## 2. エンティティ (Entity) と属性 (Attribute) の定義

`entities` キー配下にエンティティ名を PascalCase で定義し、その配下に `attributes` を記述します。

各属性には以下のフィールドを設定してください。

- `type`: データ型。以下のいずれかを選択。
  - `String`: 文字列
  - `Text`: 長文
  - `Integer`: 整数
  - `Float`: 浮動小数点数
  - `Date` / `DateTime`: 日付・日時
  - `Boolean`: 真偽値
  - `Enum`: 列挙型（`options` リストが必須）
- `description`: 項目の意味定義。
- `required`: `true` の場合、必須項目。
- `primary_key`: `true` の場合、主キー。
- `note`: 補足事項（任意）。

## 3. リレーション (Relationship) の定義

エンティティ間の関係を `relationships` キー配下に定義します。
**プロパティグラフ対応のため、リレーション自体に属性（エッジプロパティ）を持たせることが可能です。**

- `target`: 相手方のエンティティ名。
- `description`: 関係性の説明。
- `cardinality`: 多重度 (`1:1`, `1:N`, `0:1`, `0:N`, `N:M`)。
- `attributes`: **(任意)** この関係性が持つ属性。定義方法はエンティティの属性と同じです。

## 記述例 (Pattern B: エンティティ定義ファイル)

```yaml
entities:
  Project:
    description: "研究プロジェクト"
    attributes:
      project_id:
        type: "String"
        primary_key: true
        description: "ID"
    relationships:
      has_member:
        target: "Researcher"
        cardinality: "1:N"
        description: "プロジェクト参加メンバー"
        # ▼ リレーションシップ属性 (エッジプロパティ) の例
        attributes:
          joined_date:
            type: "Date"
            description: "プロジェクト参加日"
          role:
            type: "Enum"
            description: "役割"
            options: ["Leader", "Member", "Observer"]

  Researcher:
    description: "研究者"
    attributes:
      researcher_id:
        type: "String"
        primary_key: true
        description: "研究者番号"
      name:
        type: "String"
        description: "氏名"
```
