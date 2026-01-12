# AGENTS.md

このファイルは、本プロジェクトにおいて AI エージェント（または開発者）がクリーンアーキテクチャに基づいたソフトウェア設計・実装を行うための指針および規約をまとめたものです。

## アーキテクチャ概要

本プロジェクトでは、以下の記事で解説されている「実践的なクリーンアーキテクチャ」を採用します。
特に「依存性の逆転（Dependency Inversion）」と「関心の分離（Separation of Concerns）」を最重要視します。

### 用語解説

* **実践的なクリーンアーキテクチャ**
  * オリジナルのクリーンアーキテクチャの核心（ビジネスロジックの保護）を維持しつつ、実装コストとのバランスを取るためにレイヤー構造を現実的に整理したスタイルです。
  * 厳密な同心円のルールに縛られすぎず、Presentation, Application, Infrastructure のような馴染み深い層構造を用いて、ビジネスロジック（Application）がいかなる技術的詳細（Infrastructure）にも依存しない状態を作ります。

* **依存性の逆転（Dependency Inversion Principle: DIP）**
  * 「上位のモジュール（ビジネスロジック）は下位のモジュール（DB操作などの詳細）に依存してはならない。両者は抽象（インタフェース）に依存すべきである」という原則です。
  * 通常の実装では「Logic -> DB Class」と依存しがちですが、これを「Logic -> **Repository Interface** <- DB Class」とすることで、依存の矢印を逆転させ、ビジネスロジックを独立させます。

* **関心の分離（Separation of Concerns: SoC）**
  * プログラムを、それぞれが重複しない固有の役割（関心）を持つセクションに分割することです。
  * 「ユーザーに見せる（UI）」「計算する（Logic）」「保存する（DB）」といった関心ごとを分離することで、ある箇所の修正がシステム全体に波及するのを防ぎ、保守性を高めます。

## レイヤー定義と責務

コードベースを以下の4つの主要な概念レイヤーに分割し、外側から内側への依存ルールを厳守してください。

| レイヤー (役割) | 具体的な実装要素 | 責務と依存ルール |
| :--- | :--- | :--- |
| **Presentation** | `Controller` / `Presenter` | ユーザーまたは外部システムからの入力を受け取り、Use Case を呼び出します。<br>Use Case からの戻り値を適切な形式（JSONなど）に変換して返します。 |
| **Application** | `UseCase` (Application Service) | アプリケーション固有のビジネスロジックを実装します。<br>ドメインオブジェクトを操作し、リポジトリインタフェースを利用してデータの永続化を指示します。<br>**重要**: 具体的なDB実装（Repository Impl）には依存せず、インタフェースにのみ依存します。 |
| **Domain** | `Domain Object` / `Entity` | ビジネスルールやデータの中心的な定義です。<br>外部のフレームワークやライブラリに依存してはいけません（POJO / Pure Struct）。 |
| **Infrastructure** | `Repository Impl` / `DAO` | データベースや外部APIへの具体的なアクセスを実装します。<br>Use Case 層で定義されたリポジトリインタフェースを実装（Implements）します。<br>DB固有の `Data Access Object (DAO)` と `Domain Object` の相互変換を行う責務を持ちます。 |

## 実装ルール

### 1. 依存性の逆転 (DIP) の徹底

Application Layer (`UseCase`) は、絶対に Infrastructure Layer (`Repository Impl`) に直接依存してはいけません。
必ず Application Layer 内で `Repository Interface` を定義し、Infrastructure Layer がそれを実装する形にしてください。

* **NG**: `UseCase` imports `Infrastructure`
* **OK**: `Infrastructure` imports `UseCase` (Interface definition)

### 2. データ変換の境界

データベースの都合（ORMのアノテーションやDB固有の型）をドメイン領域に持ち込まないでください。

* `Repository Impl` は、DBからの取得結果（`DAO`）を必ず純粋な `Domain Object` に変換してから返す必要があります。
* 逆に、保存時は `Domain Object` を受け取り、内部で `DAO` に変換してからDBに保存します。

### 3. テスト容易性

ビジネスロジック（Use Case）のテストは、モックストラテジーを基本とします。
`Repository Interface` のモックを使用することで、DBの実装に依存せずに高速な単体テストを作成してください。

## ディレクトリ構成例 (推奨)

プロジェクトの言語に合わせて適宜調整が必要ですが、基本的には以下の構造を意識してください。

### Go言語の例

```text
src/
  ├── domain/          # ドメイン層 (Entities, Value Objects)
  │   └── user.go      # 純粋なUser構造体
  ├── usecase/         # アプリケーション層 (Use Cases, Repository Interfaces)
  │   ├── user_usecase.go
  │   └── user_repository.go # interface定義
  ├── interface/       # プレゼンテーション層 (Controllers)
  │   └── user_controller.go
  └── infrastructure/  # インフラ層 (DB Access, External APIs)
      ├── router.go
      └── persistence/
          └── user_repository_impl.go # usecase.UserRepositoryの実装
```

### Python言語の例

```text
src/
  ├── domain/          # ドメイン層 (Entities, Value Objects)
  │   └── user.py      # 純粋なUserクラス (dataclassなど)
  ├── usecase/         # アプリケーション層 (Use Cases, Repository Interfaces)
  │   ├── user_usecase.py
  │   └── user_repository.py # Abstract Base Class (abc.ABC)
  ├── interface/       # プレゼンテーション層 (Controllers)
  │   └── user_controller.py # FastAPI routerなど
  └── infrastructure/  # インフラ層 (DB Access, External APIs)
      ├── router.py
      └── persistence/
          └── user_repository_impl.py # usecase.UserRepositoryの実装
```

## エージェントへの指示

新しい機能を実装する際は、以下のステップに従ってください。

1. **Domain の定義**: 扱うデータとルール（Entity）を定義する。
2. **Use Case の定義**: 必要な操作（メソッド）と、データアクセスのためのインタフェース（Repository Interface）を定義する。
3. **実装**:
    * 具体的な永続化ロジック（Infrastructure）を実装し、Repository Interface を満たす。
    * Web/API ハンドラ（Controller）を実装し、Use Case を呼び出す。
4. **テスト**: Use Case に対する単体テストを作成する。

この指針に従うことで、仕様変更に強く、テストが容易なコードベースを維持してください。
