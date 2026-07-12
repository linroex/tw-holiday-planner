# 2027 台灣連假規劃器

Mobile-first PWA，用來預先規劃 2027 年（民國116年）的連假：點月曆上的上班日標記請假，自動偵測連續休假區段與長度，幫連假命名、寫備註（機票、住宿、預算），並追蹤特休額度、產生分享連結給朋友。

假日資料依[行政院人事行政總處核定之 116 年辦公日曆表](https://www.dgpa.gov.tw/information?uid=82&pid=12983)（全年放假 121 日，無補班日）。

## 功能

- **年曆檢視**：12 個月垂直捲動，週末與國定假日紅字標示（台灣月曆慣例）
- **請假標記**：點上班日切換請假（琥珀色），再點取消
- **連假偵測**：週末＋假日＋請假日相連自動成段，底部色帶連通顯示，跨月跨年（12/31–2028/1/2）都正確
- **命名與備註**：每段連假可命名（如「帛琉潛水」）與寫備註，區段延伸/合併後備註不斷鏈
- **特休額度**：設定年度特休天數，即時顯示已用/剩餘，超額變紅提醒（不硬擋）
- **分享連結**：整份規劃壓縮進 URL hash（lz-string），朋友開啟為唯讀檢視，可一鍵匯入
- **PWA**：可加入主畫面、離線可用
- **資料儲存**：localStorage（`thp.plan.2027`），無後端、無追蹤

## 開發

```bash
npm install
npm run dev          # 開發伺服器（加 --host 讓手機同網段連線實測）
npm test             # Vitest 單元測試（連假偵測、分享編解碼、日期運算）
npm run build        # tsc + vite build → dist/
npm run preview      # 預覽 production build
```

## 部署

純靜態站，`npm run build` 後把 `dist/` 丟到任何靜態主機（GitHub Pages、Vercel、Cloudflare Pages）即可；`vite.config.ts` 已設 `base: './'`，子路徑部署也不用改設定。PWA 安裝需 HTTPS。

## 架構

```
src/
├── data/            # 假日資料：每年一檔（holidays-2027.ts），registry 註冊制
├── lib/
│   ├── date.ts      # epoch-day 整數日期運算（不經過 Date，無時區問題）
│   ├── dayStatus.ts # 單日分類：補班→上班；假日/補假/週末/請假→放假
│   ├── breaks.ts    # 連假區段偵測（核心演算法）＋備註錨定
│   ├── share.ts     # 分享連結編解碼
│   └── storage.ts   # localStorage 持久化
├── state/           # useReducer + Context
└── components/      # 月曆、連假清單、詳情/設定 sheet、分享唯讀檢視
```

新增年份：建 `src/data/holidays-XXXX.ts`，在 `src/data/index.ts` 的 registry 加一行。
