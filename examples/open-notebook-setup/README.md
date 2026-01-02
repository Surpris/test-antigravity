# Open Notebook セットアップガイド

このディレクトリには、[Open Notebook](https://github.com/lfnovo/open-notebook) を Docker Compose を使用してデプロイするための設定ファイルが含まれています。

## ファイル構成

- `docker-compose.yml`: Open Notebook と SurrealDB を起動するための設定。
- `.env.example`: 環境変数の設定テンプレート。

## デプロイ手順

1. **環境設定ファイルの作成**
    `.env.example` を `.env` にコピーし、必要な API キー（OpenAI など）を設定してください。

    ```bash
    cp .env.example .env
    ```

2. **コンテナの起動**
    以下のコマンドを実行して、サービスをバックグラウンドで起動します。

    ```bash
    docker-compose up -d
    ```

3. **アクセス**
    起動後、ブラウザで以下の URL にアクセスできます。
    - フロントエンド: [http://localhost:8502](http://localhost:8502)
    - API ヘルスチェック: [http://localhost:5055/health](http://localhost:5055/health)

## 注意事項

- データは `notebook_data`（アプリケーション）および `surreal_data`（データベース）ディレクトリに永続化されます。
- 初期セットアップ時に OpenAI またはその他の AI プロバイダーの API キーが正しく設定されていない場合、機能が制限される可能性があります。
