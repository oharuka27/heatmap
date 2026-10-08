# Market Heatmap

時価総額（または取引高）をタイルの面積、騰落率をタイルの色で表すマーケットヒートマップの Web アプリです。
現在は **仮想通貨** のみ実装済みで、今後 **日本株・米国株** をタブで切り替えられるように拡張する前提で設計しています。

## ローカルでの実行方法

### 1. 必要なもの

- **Node.js 20 以上**（v24 で動作確認済み）と npm
  - 確認: `node -v` / `npm -v`
  - 未インストールの場合は [公式サイト](https://nodejs.org/) の LTS 版か、[nvm](https://github.com/nvm-sh/nvm) などのバージョン管理ツールで入れる
    ```bash
    nvm install --lts
    ```
- インターネット接続（ブラウザから CoinGecko API を直接呼ぶため）
- API キーや `.env` の設定は不要

### 2. 依存パッケージのインストール（初回のみ）

```bash
cd heatmap        # このリポジトリのディレクトリ
npm install
```

### 3. 開発サーバーを起動

```bash
npm run dev
```

ターミナルに表示される URL（通常 http://localhost:5173 ）をブラウザで開くとヒートマップが表示されます。
ソースを保存すると自動で画面に反映されます（ホットリロード）。停止はターミナルで `Ctrl + C`。

よく使うオプション:

```bash
npm run dev -- --port 3000   # ポートを変更する（5173 が使用中の場合など）
npm run dev -- --host        # 同じ LAN 内のスマホ等から確認する（表示される Network の URL を開く）
npm run dev -- --open        # 起動時にブラウザを自動で開く
```

> **WSL2 を使っている場合**: WSL 内で `npm run dev` を実行し、Windows 側のブラウザで http://localhost:5173 を開けば表示されます。
> 開けない場合は `npm run dev -- --host` で起動し、表示された Network の URL を使ってください。

### 4. 本番ビルドを確認する（任意）

```bash
npm run build     # 型チェック + dist/ に静的ファイルを出力
npm run preview   # dist/ の内容を http://localhost:4173 で配信
```

`dist/` は静的ファイルだけなので、GitHub Pages・Netlify・Vercel などにそのまま置けます。

### 5. テスト・型チェック

```bash
npm test            # 単体テスト (vitest)
npm run typecheck   # 型チェックのみ
```

### うまく動かないとき

| 症状 | 対処 |
| --- | --- |
| 「CoinGecko に接続できませんでした（レート制限の可能性があります）」と出る | 無料 API の回数制限。1 分ほど待って「再試行」を押す。件数や通貨を短時間に何度も切り替えると起きやすい |
| `Port 5173 is in use` 等で起動しない | 別のプロセスが使用中。`npm run dev -- --port 3000` のようにポートを変える |
| `npm install` が失敗する / 構文エラーが出る | Node.js が古い可能性。`node -v` で 20 以上か確認する |
| 画面が真っ白 | ブラウザの開発者ツール（F12）の Console にエラーが出ていないか確認する |

## 機能

- 時価総額上位 N 件（50 / 100 / 150 / 250）で表示を打ち切ったツリーマップ
- 色分け: **下落 = 赤系 / 上昇 = 緑系**、ほぼ横ばい（±0.02% 未満）はグレー
  - 変動幅が大きいほど濃い色。色が飽和する閾値は期間ごとに変える（1h: 1% / 24h: 5% / 7d: 10% / 30d: 20% / 1y: 50%）
- プルダウンで表示切替
  - 期間: 過去1時間 / 24時間 / 7日間 / 30日間 / 1年間
  - サイズ基準: 時価総額 / 取引高(24h)
  - 表示件数
  - 通貨: JPY / USD
- タイルの大きさに応じて表示内容を自動調整（シンボル → 騰落率 → 価格 → Dominance の順に優先）
- ホバーで詳細ツールチップ（価格・騰落率・時価総額・取引高・Dominance）
- 60 秒ごとの自動更新（タブが非表示の間は停止）と手動再読み込み
- 表示設定は URL クエリに保存（例: `?market=crypto&period=7d&currency=usd&size=marketCap&limit=50`）。URL を共有すれば同じ表示を再現できる

## 技術スタック

| 用途 | 採用 | 理由 |
| --- | --- | --- |
| 言語 | TypeScript (strict, `noUncheckedIndexedAccess`) | 要件。マーケット追加時の型崩れを防ぐ |
| UI | React 19 | タブ・プルダウン・ツールチップなど状態を持つ UI が増えていくため |
| ビルド | Vite | 設定が少なく高速 |
| テスト | Vitest | Vite と設定を共有できる |
| ツリーマップ | 自前実装 (Squarified) | 100 行程度で済み、依存を増やさずにテストしやすい |
| データ | [CoinGecko API](https://www.coingecko.com/en/api)（無料・API キー不要） | ブラウザから直接呼べる（CORS 対応） |

バックエンドは持たず、ブラウザから直接 API を呼ぶ静的サイトとして動きます。

## ディレクトリ構成

```
src/
├── App.tsx                  # 画面全体の組み立て
├── main.tsx
├── styles.css
├── markets/                 # ★ マーケット固有の処理はここに閉じ込める
│   ├── types.ts             #   共通ドメイン型 (Asset, MarketSnapshot, MarketProvider, MarketDefinition)
│   ├── registry.ts          #   マーケット一覧（タブの定義）
│   ├── labels.ts            #   期間・通貨などの表示ラベル
│   └── crypto/
│       └── coingecko.ts     #   仮想通貨: CoinGecko → Asset への変換
├── lib/                     # React に依存しない純粋関数（単体テスト対象）
│   ├── treemap.ts           #   Squarified Treemap レイアウト
│   ├── color.ts             #   騰落率 → 色
│   ├── tileLabel.ts         #   タイルサイズ → 表示する項目・フォントサイズ
│   └── format.ts            #   価格・%・金額の整形
├── hooks/
│   ├── useMarketData.ts     #   取得・キャッシュ・自動更新
│   ├── useViewSettings.ts   #   表示設定と URL クエリの同期
│   └── useElementSize.ts    #   ResizeObserver
└── components/              # 表示コンポーネント（マーケットの種類を知らない）
    ├── MarketTabs.tsx
    ├── Toolbar.tsx / Select.tsx
    ├── Heatmap.tsx          #   レイアウト計算とタイル描画
    ├── Tooltip.tsx
    └── Legend.tsx
```

## 開発方針

### 1. マーケットの違いは `markets/` に閉じ込める

仮想通貨・日本株・米国株はデータソースもフィールド名も異なるため、各 provider が取得結果を共通型 `Asset` に正規化してから UI に渡します。
`components/` 以下は「どのマーケットか」を一切知らず、`Asset` と `MarketDefinition` だけを見て描画します。

```ts
interface MarketProvider {
  fetchSnapshot(params: { currency; limit; signal }): Promise<MarketSnapshot>;
}
```

マーケットごとの差（対応期間・通貨・表示件数の選択肢・「Dominance」か「構成比」か・更新間隔）は `MarketDefinition` の設定値として宣言します。
ツールバーはこの設定から選択肢を生成するので、マーケットを追加しても UI のコード変更は不要です。

### 2. 期間の切替で API を叩かない

CoinGecko は 1 リクエストで 1h / 24h / 7d / 30d / 1y の騰落率をまとめて返すため、`Asset.changes` に期間ごとの値を全部持たせています。
期間切替は参照するキーを変えるだけで即時に反映されます。株の provider も可能な限り同じ形で返す方針です。

### 3. 描画ロジックは純粋関数に分離

ツリーマップの配置・色・ラベルの出し分けは `lib/` の純粋関数にし、テストで「面積が値に比例する」「重ならない」「マイナスは赤系」などを保証しています。
描画は絶対配置の `div` です（250 件程度なら Canvas/SVG にする必要はない）。件数を大幅に増やす場合は Canvas 化を検討します。

### 4. 不正な URL・未対応の組み合わせはデフォルトに丸める

`useViewSettings` が URL の値をマーケット定義と照合し、未対応の期間や通貨はデフォルト値に置き換えます。
マーケットを切り替えたときも同じ処理で整合性を取ります（例: 米国株に切り替えると通貨は USD に）。

## 新しいマーケット（日本株・米国株）を追加する手順

1. `src/markets/<market>/` に `MarketProvider` を実装し、取得結果を `Asset` に変換する
   - `symbol` にはタイルに大きく出したい文字列（証券コード `7203`、ティッカー `AAPL` など）を入れる
   - 取得できない期間の騰落率は `null` にする（タイルはグレーで表示される）
   - 指数全体の時価総額が取れる場合は `totalMarketCap` を返す（取れなければ表示銘柄の合計で構成比を計算）
2. `src/markets/registry.ts` の該当エントリに `provider` を設定する（未設定のタブは「準備中」で無効化される）
3. 必要に応じて `periods` や `limits` を調整する。株で `1h` が不要などはここで外す
4. 株で新しい期間（`ytd` など）が必要になったら `PeriodId`・`PERIOD_LABELS`・`SATURATION_THRESHOLD` に追加する

### 将来の拡張で考慮が必要な点

- **セクター別グルーピング**: 株のヒートマップは業種ごとにまとめて表示するのが一般的。
  `Asset` に `group?: string` を追加し、`squarify` を「グループ → 銘柄」の 2 段階で適用する形を想定（`squarify` はそのまま再利用できる）
- **API キーと CORS**: 株価 API の多くは API キーが必要で、ブラウザから直接呼べない／キーを露出できない。
  その場合は薄いプロキシ（Cloudflare Workers、Vercel Functions など）を挟み、provider はプロキシを呼ぶ形にする
- **市場時間**: 株は取引時間外に値が更新されないため、自動更新間隔（`refreshIntervalMs`）を長くする、または取引時間外は止める
- **通貨表示**: 日本株は JPY、米国株は USD 固定を想定。`currencies` を 1 つにすると通貨プルダウンは自動で非表示になる

## メモ・既知の制約

- CoinGecko の無料 API はレート制限が厳しい（目安: 数十リクエスト/分）。制限時のレスポンスには CORS ヘッダーが付かず、
  ブラウザ上では単なる通信失敗に見えるため、その旨のメッセージを表示している
  - 対策として、同じ条件（マーケット・通貨・件数）の結果を 30 秒キャッシュし、期間やサイズ基準の切替では再取得しない
  - 開発時は React StrictMode の影響で初回にリクエストが 2 回飛ぶ（1 回目は中断される）
- `/global` から取得する全体時価総額で Dominance を計算している。取得に失敗した場合は表示銘柄の合計で代替する（その場合 Dominance はやや大きめに出る）
- 1 回の取得は最大 250 件（CoinGecko の `per_page` 上限）。それ以上必要ならページングを実装する
- タイル内の文字幅は概算（フォントサイズ × 0.68）で計算しているため、フォントによってはわずかにはみ出す可能性がある

## 今後の予定

- [ ] 日本株 provider（例: J-Quants API ＋ プロキシ）
- [ ] 米国株 provider（例: S&P 500 構成銘柄 ＋ 株価 API ＋ プロキシ）
- [ ] セクター別グルーピング表示
- [ ] カテゴリ（Meme / AI / DeFi など）での絞り込み（仮想通貨）
- [ ] タイルクリックで詳細（チャート）表示
- [ ] フルスクリーン表示
