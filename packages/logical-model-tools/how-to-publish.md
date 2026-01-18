# npm パッケージ公開手順

`logical-model-tools` を npm レジストリに公開するための手順です。

## 1. 事前準備

### アカウント確認

npm アカウントを持っていない場合は、[npmjs.com](https://www.npmjs.com/) で作成してください。

### パッケージ名の一意性確認

`logical-model-tools` という名前は一般的であるため、既に他の誰かに使用されている可能性があります。
公開前に [npmjs.com](https://www.npmjs.com/) で検索して確認するか、ご自身のユーザー名や組織名を使った「スコープ付きパッケージ」（例: `@your-username/logical-model-tools`）に変更することを強く推奨します。

**スコープ付きにする場合 (`package.json` の変更)**:

```json
{
  "name": "@your-username/logical-model-tools",
  ...
}
```

## 2. ログイン

ターミナルで npm にログインします。

```bash
npm login
```

コマンドを実行するとブラウザが開き、認証を求められます。

## 3. ビルドとテスト

公開する前に、必ず最新のコードがビルドされ、正常に動作することを確認します。

```bash
# 依存関係のインストール
npm install

# ビルド（dist ディレクトリの生成）
npm run build
```

※ `package.json` の `prepublishOnly` スクリプトに `npm run build` を設定してあるため、`npm publish` 実行直前に自動的にビルドが走りますが、念のため手動での確認を推奨します。

## 4. 公開 (Publish)

### 通常のパッケージとして公開する場合

```bash
npm publish
```

### スコープ付きパッケージ（`@user/pkg`）として公開する場合

スコープ付きパッケージはデフォルトで「プライベート」として公開されようとします（これには有料プランが必要な場合があります）。
無料で一般公開（パブリック）したい場合は、明示的に `--access public` オプションを付ける必要があります。

```bash
npm publish --access public
```

成功すると、ターミナルに `+ @your-username/logical-model-tools@1.0.0` のようなメッセージが表示されます。

## 5. パッケージの更新

一度公開したバージョンを上書きすることはできません。修正や機能追加を行って再公開する場合は、バージョン番号を上げる必要があります。

```bash
# パッチバージョンアップ (バグ修正など: 1.0.0 -> 1.0.1)
npm version patch

# マイナーバージョンアップ (機能追加など: 1.0.0 -> 1.1.0)
npm version minor

# メジャーバージョンアップ (破壊的変更など: 1.0.0 -> 2.0.0)
npm version major

# バージョンアップ後に公開
npm publish
# (スコープ付き公開の場合) npm publish --access public
```
