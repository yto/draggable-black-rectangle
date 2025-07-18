# Draggable Black Rectangle Chrome 拡張機能

([English](README.md)/Japanese)

画面共有時のプライバシー保護のため、任意のページ上にサイズ変更・複製・削除可能な黒塗りボックスを配置する Chrome 拡張機能。

## 機能

* **ツールバー**: 拡張機能アイコンをクリックすると、デフォルト位置に黒い矩形を配置
* **ショートカット**: `Ctrl+Shift+Y`（Windows/Linux）または `⌘+Shift+Y`（macOS）で矩形を配置
* **ドラッグ＆リサイズ**: 矩形本体をドラッグで移動、右下ハンドルでサイズ変更
* **複製＆削除**: 📄 複製ボタンで (10px,10px) オフセット複製、✖ 削除ボタンで削除

## インストール

1. リポジトリをクローン:

   ```bash
   git clone https://github.com/yto/draggable-black-rectangle.git
   cd draggable-black-rectangle
   ```
2. Chrome を開き、`chrome://extensions/` にアクセス
3. **デベロッパーモード** を有効化（右上トグル）
4. **パッケージ化されていない拡張機能を読み込む** でプロジェクトディレクトリを選択

## 使い方

* **矩形を配置**:

  * ツールバーアイコンをクリック、または
  * ショートカットキー (`Ctrl+Shift+Y` / `⌘+Shift+Y`)
* **矩形の操作**:

  * **ドラッグ**: 本体をドラッグして移動
  * **リサイズ**: 右下ハンドルで大きさ変更
  * **複製**: 📄 ボタンで +10px オフセット複製
  * **削除**: ✖ ボタンで削除

## ショートカットの変更

1. Chrome のアドレスバーに `chrome://extensions/shortcuts` を入力して開く
2. “draggable black rectangle” を探し、
3. “Place draggable black rectangle” の欄をクリックして任意のキーを入力

## ライセンス

MIT ライセンス。詳細は [LICENSE](LICENSE) を参照
