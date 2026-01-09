---
name: react-typescript-vite
description: React + TypeScript + Vite を使用したモダンな Web アプリケーション開発のためのスキル。コンポーネント設計、型定義、プロジェクト構成のベストプラクティスを提供します。ユーザーが React、TypeScript、または Vite を使用した開発、デバッグ、リファクタリングを求めている場合に使用してください。
version: 1.0
license: MIT
metadata:
  author: Antigravity
  tags: [react, typescript, vite, web-development, frontend]
---

# React + TypeScript + Vite コーディングガイド

このスキルは、React、TypeScript、Vite を使用した堅牢でスケーラブルな Web アプリケーションを構築するためのガイドラインとベストプラクティスを提供します。

## 1. プロジェクトのセットアップと構成

### 新規プロジェクトの作成

新しいプロジェクトを作成する場合、以下のコマンドを使用することを推奨します（ユーザーの指示がない限り、最新バージョンを使用）：

```bash
npm create vite@latest . -- --template react-ts
npm install
```

### ディレクトリ構造

推奨される標準的なディレクトリ構造は以下の通りです：

```plaintext
src/
  assets/        # 静的アセット（画像、フォントなど）
  components/    # 再利用可能な UI コンポーネント
    ui/          # ボタン、入力などの基本 UI パーツ
    features/    # 特定の機能に関連するコンポーネント群
  hooks/         # カスタムフック
  layouts/       # ページレイアウトコンポーネント
  pages/         # ルーティングに対応するページコンポーネント
  services/      # API クライアントや外部サービス連携
  store/         # グローバルステート管理（Zustand, Redux 等）
  types/         # 共通の型定義
  utils/         # ユーティリティ関数
  App.tsx        # アプリケーションのエントリーポイント
  main.tsx       # React DOM のレンダリング
```

## 2. コーディング規約とベストプラクティス

### コンポーネント設計

- **関数コンポーネント**: クラスコンポーネントではなく、常に関数コンポーネントと Hooks を使用してください。
- **Props の型定義**: `interface` または `type` を使用して Props の型を明示的に定義してください。`React.FC` は必要がない限り避け、通常の関数宣言として記述することを推奨します。

```tsx
// 推奨
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

- **エクスポート**: 名前付きエクスポート（`export function ...`）を使用し、`export default` はページコンポーネントや遅延ロードが必要な場合のみに限定することを推奨します。

### TypeScript の活用

- **Strict Mode**: `tsconfig.json` で `strict: true` が有効になっていることを前提とし、`any` の使用は極力避けてください。
- **推論の活用**: 明白な型は TypeScript の推論に任せ、冗長な型注釈を避けてください。

### フック (Hooks)

- **カスタムフック**: 複雑なロジックや再利用可能な状態管理はカスタムフック（`use...`）に切り出してください。
- **依存配列**: `useEffect` や `useCallback` の依存配列は正確に記述し、不必要な再レンダリングや stale closure の問題を防いでください。

### スタイリング

- **CSS Modules / Tailwind CSS**: プロジェクトの設定に従い、スコープが限定されたスタイリング手法（CSS Modules や Tailwind CSS など）を使用してください。グローバルな CSS は `index.css` に限定してください。

## 3. パフォーマンス最適化

- **再レンダリングの抑制**: 必要な場合のみ `React.memo`、`useMemo`、`useCallback` を使用してください。時期尚早な最適化は避け、実際にパフォーマンスの問題が懸念される箇所に適用します。
- **コード分割**: ルーティングレベルでの `React.lazy` と `Suspense` を使用したコード分割を検討してください。

## 4. テスト

- テストには `Vitest` と `React Testing Library` の使用を推奨します。ユーザー操作に基づいたテスト（`userEvent` の使用）を重視してください。

## 5. コマンドリファレンス

- 開発サーバー起動: `npm run dev`
- ビルド: `npm run build`
- プレビュー: `npm run preview`
- テスト実行: `npm run test` (設定されている場合)
