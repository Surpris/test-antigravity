# Figma → 実装 再現度向上ワークフロー (Gemini CLI版)

## 概要

このワークフローは、Figmaのデザインを直接本番コードにするのではなく、一度「検証用の中間生成物（React）」を経由し、ブラウザでのレンダリング結果（Computed Styles）を正解として本番コード（Vue等）を実装することで、デザインの再現度を高める手法です。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
npx playwright install
```

### 2. 作業ディレクトリの準備

このディレクトリ内で作業を行います。
中間生成物は `.figma-mcp/` ディレクトリに保存されます（自動作成されます）。

## 実行手順

`prompts/` ディレクトリにあるプロンプトファイルを順番にGeminiに入力して進めてください。

### Step 1: デザインデータの取得

Geminiに対して以下のプロンプトを使用します。

```bash
cat prompts/01_fetch_data.txt | gemini ...
```

※ `[NODE_ID]` は実際のFigma Node IDに置き換えてください。

### Step 2: 中間実装 (React) の作成

Step 1で保存されたデータを元に、Reactコードを生成します。
この段階では、`.figma-mcp/src/routes/` にファイルが生成されます。

### Step 3: 即時検証 (React)

Reactアプリを起動し（別途 `npm run dev` 等が必要）、生成されたページがエラーなく表示されるか確認します。

```bash
# アプリサーバーが 5173 ポートで動いている前提
npm run verify:react http://localhost:5173/CampaignPage
```

エラーがあれば、Geminiに修正を依頼してください（ `prompts/03_verify_react.txt` 参照）。

### Step 4: スタイルの抽出 (Computed Styles)

ブラウザが計算した最終的なスタイルをJSONとして抽出します。これが「真のデザイン定義」になります。

```bash
npm run extract:styles http://localhost:5173/CampaignPage .figma-mcp/cache/computed_styles.json
```

### Step 5: 本番実装 (Vue)

抽出された `computed_styles.json` と Reactの構造コードを元に、Vueコンポーネントを実装します。
`prompts/05_implement_vue.txt` の内容をGeminiに指示してください。

### Step 6: 最終検証 (Visual Regression)

Vue実装とReact実装（またはFigma）の見た目を比較します。

```bash
npm test
```

`scripts/visual_comparison.spec.js` が実行され、`report/` にスクリーンショット等が保存されます。

## ディレクトリ構成

```plaintext
.
├── prompts/                # Geminiへの指示プロンプト集
├── scripts/                # Playwrightによる検証・抽出スクリプト
│   ├── verify_react.js             # React検証用
│   ├── extract_computed_styles.js  # スタイル抽出用
│   └── visual_comparison.spec.js   # 最終比較テスト用
├── .figma-mcp/             # (自動生成) 中間成果物置き場
│   ├── cache/              # デザインJSON, スタイルJSON
│   └── src/                # 生成されたReactコード
└── package.json
```
