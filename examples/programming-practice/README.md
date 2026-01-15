# バハムート駆動開発：プログラミングのプラクティス整理

Qiitaの記事「[バハムート駆動開発をやってください](https://qiita.com/RealFlair/items/f9edf19495275f36e784)」で紹介されている、オブジェクト指向設計およびDDD（ドメイン駆動設計）の変遷とプラクティスを以下に整理します。

## 概要

一人の新人が召喚石（クラス）を設計し、バハムート（オブジェクト）を召喚（new）し、メガフレア（メソッド）を放つまでの過程を通じて、コードが抱える問題とそれを解決するための設計手法を学んでいくストーリー仕立ての解説です。

## 導入されたプラクティス一覧

| 章 | 課題 | 解決策（プラクティス） | 効果 |
| :--- | :--- | :--- | :--- |
| 1章 | 最初の設計 | **TDD (テスト駆動開発)** | 動作を保証しつつ最小限のクラスを作る。 |
| 2章 | メソッド名の不一致 | **インターフェース導入** | 攻撃メソッド（castSummonなど）の名前を統一する。 |
| 3章 | コピペコードの氾濫 | **継承 (Inheritance)** | 基本的なステータスや振る舞いを親クラスに集約する。 |
| 4章 | 横断的な共通機能 | **トレイト (Trait)** | 登場アニメーションなど、継承関係とは別の共通機能を合成する。 |
| 5章 | 巨大なクラス (God Class) | **SRP (単一責任原則)** | アニメーションやステータス計算など、責務ごとにクラスを分ける。 |
| 6章 | 生成ロジックの散在 | **Factoryパターン** | オブジェクトの生成手順（new）をカプセル化し、呼び出し側を簡素化する。 |
| 7章 | プリミティブな値の不安 | **Value Object** | 属性や名前などを独自の型として定義し、不正な値を防ぐ。 |
| 8章 | 同一性の欠如 | **Entity化** | 識別子（ID）を導入し、同じ内容でも別の個体であることを識別可能にする。 |
| 9章 | 置き場のないロジック | **Domain Service** | 属性相性計算など、複数のオブジェクトにまたがる計算を整理する。 |
| 10章 | 保存方法への依存 | **Repositoryパターン** | データの保存・取得を抽象化し、ビジネスロジックと外部実装を切り離す。 |
| 11章 | モデルの混濁 | **境界づけられたコンテキスト** | 召喚獣の世界と宿屋の世界など、コンテキストごとにモデルを分離する。 |
| 12章 | 意思疎通の齟齬 | **ユビキタス言語** | チーム全員が同じ言葉（SummonBeast等）を設計とコードで使い合う。 |

## 本ディレクトリの構成

- [README.md](file:///home/surpris/repos/test-antigravity/examples/programming-practice/README.md): このファイル（プラクティスのまとめ）
- [class-diagram.md](file:///home/surpris/repos/test-antigravity/examples/programming-practice/class-diagram.md): 第12章のクラス図をMermaid形式で出力
- [codebase.ts](file:///home/surpris/repos/test-antigravity/examples/programming-practice/codebase.ts): PHPコード例をTypeScriptに変換した最終形態
- [directory-structure.md](file:///home/surpris/repos/test-antigravity/examples/programming-practice/directory-structure.md): TypeScript向けのディレクトリ構成案
