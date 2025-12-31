# .agent

## Directory Structure

```sh
.agent/
├── rules/
│   ├── global.md       # 全プロジェクト共通の基本ルール（命名規則など）
│   ├── project-rules.md  # プロジェクト固有の基本ルール
│   ├── security.md     # セキュリティガイドライン
│   └── language/
│       ├── python.md   # Python固有のルール
│       └── typescript.md
├── workflows/          # チーム共通のワークフロー
│   ├── review.md
│   └── deploy.md
├── permissions.yaml    # プロジェクト固有の権限設定
└── config.yaml         # ルールの適用設定
```
