# TypeScript 向けディレクトリ構成案

TypeScriptプロジェクト（例えば `src/` 配下）における最終的なディレクトリ構成のイメージです。

```text
src/
└── domain/
    ├── summon/
    │   ├── models/            (Entities & Aggregates)
    │   │   ├── bahamut.ts
    │   │   ├── shiva.ts
    │   │   ├── ifrit.ts
    │   │   ├── leviathan.ts
    │   │   └── index.ts
    │   ├── value-objects/
    │   │   ├── summon-id.ts
    │   │   ├── summon-name.ts
    │   │   ├── element.ts
    │   │   └── level.ts
    │   ├── behaviors/         (Mixins / Traits)
    │   │   └── summon-animation.ts
    │   ├── summon-beast.ts     (Interface)
    │   ├── summon-factory.ts
    │   └── summon-repository.ts (Interface)
    ├── battle/
    │   └── element-compatibility-calculator.ts (Domain Service)
    └── player/
        └── player-summons.ts
└── infrastructure/
    └── persistence/
        └── file-summon-repository.ts
```

## 修正のポイント

- **小文字のケバブケース (kebab-case)**: TypeScript/Node.js の慣習に合わせ、ファイル名・ディレクトリ名を小文字に変更しました。
- **責務の細分化**: `Summon` ドメイン内でも、`models`, `value-objects`, `behaviors` と分けることで、SRP（単一責任原則）を物理的にも強調しています。
- **behaviors ディレクトリ**: PHPのトレイトに相当する Mixin を、ドメインの「振る舞い」として整理しました。
