# Scroll Position Indicator

![Icon Active](./icons/icon_active_32.png) ![Icon Inactive](./icons/icon_inactive_32.png)

ページのスクロール位置を **0〜100%** で表示する Chrome 拡張です。  
ツールバーアイコンで表示の ON/OFF を切り替えられます。

## Indicator プレビュー

| 0% | 100% |
| --- | --- |
| ![Indicator 0%](./docs/indicator-0.svg) | ![Indicator 100%](./docs/indicator-100.svg) |

## 主な機能

- ページのスクロール率を小さなインジケータで表示
- 数値表示に加えて、外周リングで進捗を可視化
- インジケータをドラッグして位置を変更
- 位置は `chrome.storage.local` に保存され、同一セッション内のタブ間で反映
- インジケータをクリックするとページ先頭へスムーズスクロール
- 拡張アイコンのクリックで全タブ一括 ON/OFF
- ON/OFF 状態に応じて拡張アイコンを切り替え

## インストール（開発版）

1. このリポジトリをローカルに配置する
2. Chrome で `chrome://extensions` を開く
3. 右上の「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」を押す
5. このフォルダ（`scroll-position-indicator`）を選択する

## 使い方

1. 任意のページを開く
2. ツールバーの拡張アイコンをクリックして有効化
3. 画面上のインジケータで現在のスクロール率を確認
4. 位置を変えたい場合はインジケータをドラッグ
5. 先頭に戻りたい場合はインジケータをクリック

## 仕様メモ

- インジケータ位置の保存キーは `indicatorPosition`
- 拡張の起動時・インストール/更新時に保存位置はクリアされるため、ブラウザ再起動後は初期位置に戻る
- `chrome://` など一部ページでは Content Script が動作しないため表示されない

## 権限

- `storage`: インジケータ位置の保存
- `activeTab`: アクティブタブ連携のため
- `scripting`: スクリプト制御のため
- `content_scripts` (`<all_urls>`): すべての通常ページでインジケータを表示

## ファイル構成

- `manifest.json`: 拡張定義（Manifest V3）
- `background.js`: ON/OFF 状態管理、アイコン更新、タブ同期
- `content.js`: インジケータ描画、スクロール率計算、ドラッグ/クリック操作
- `icons/`: ON/OFF 状態別アイコン
