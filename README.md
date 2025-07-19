# Expo Camera App with OCR

カメラで撮った写真をGoogle Cloud Vision APIを使ってOCR（光学文字認識）でテキストを抽出するアプリです。

## 機能

- 📸 カメラで写真撮影
- 🔍 Google Cloud Vision APIを使ったOCR
- 📱 リアルタイムテキスト認識
- 🎯 信頼度スコア表示
- 🔄 カメラ切り替え（前面/背面）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Google Cloud Vision APIの設定

#### 方法1: APIキーを使用（推奨）

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. Cloud Vision APIを有効化
4. **認証情報** → **認証情報を作成** → **APIキー**を選択
5. 作成されたAPIキーをコピー
6. `config/api.ts`ファイルの`GOOGLE_CLOUD_VISION_API_KEY`を実際のAPIキーに置き換え

```typescript
// config/api.ts
export const GOOGLE_CLOUD_VISION_API_KEY = 'your_actual_api_key_here';
```

#### 方法2: サービスアカウントキーを使用

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. Cloud Vision APIを有効化
4. **IAMと管理** → **サービスアカウント** → **サービスアカウントを作成**
5. サービスアカウントに「Cloud Vision API ユーザー」ロールを付与
6. **キーを作成** → **JSON**を選択してダウンロード
7. ダウンロードしたJSONファイルを`cloud-vision.json`としてプロジェクトルートに配置

### 3. アプリの起動

```bash
npm start
```

## 使用方法

1. アプリを起動
2. カメラ権限を許可
3. テキストが含まれた画像を撮影
4. OCR結果を確認

## 技術スタック

- React Native
- Expo
- TypeScript
- Google Cloud Vision API
- expo-camera

## 注意事項

- Google Cloud Vision APIの使用には料金が発生する場合があります
- APIキーやサービスアカウントキーは公開リポジトリにコミットしないでください
- 本番環境では環境変数を使用してAPIキーを管理することを推奨します

## トラブルシューティング

### 「テキストが検出されませんでした」エラー

1. APIキーが正しく設定されているか確認
2. Cloud Vision APIが有効化されているか確認
3. 画像に十分なテキストが含まれているか確認
4. ネットワーク接続を確認

## ライセンス

MIT
