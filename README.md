# GENSHIN APP

> 自分の原神アカウントを知っているAIと相談できるWebアプリ
> 現在開発中です。このREADMEには、実装済みの機能に加えて完成形として目指す仕様を含みます。

GENSHIN APPは、原神の実アカウントデータとAIを接続し、**ユーザー自身のキャラクター・武器・育成状況を前提に、継続的な原神相談ができる体験**を目指したWebアプリです。

HoYoLABから取得したアカウントデータをアプリに同期し、MCP（Model Context Protocol）を通じてChatGPTなどのAIから利用できるようにします。

単にデータを閲覧するだけではなく、**アカウントデータを読む → AIと相談する → 決めた内容をアプリに保存する → 次の相談で再利用する**という循環を中心に設計しています。

---

## Why

ChatGPTに原神について相談するとき、通常は毎回、

- 所持キャラクター
- 凸数
- レベル
- 武器
- 天賦
- 聖遺物
- ステータス
- 育成状況

などを自分で説明する必要があります。

GENSHIN APPでは、それらを実際のアカウントデータから取得します。

そのため、

> 「今の手持ちなら誰を育てるべき？」
> 「このアカウントで激戦用の編成を作って」
> 「このキャラのDPSを伸ばすならどこを改善するべき？」
> 「この聖遺物は更新した方がいい？」

といった質問を、毎回アカウント状況を説明せずに行えるようにします。

---

## Core Experience

GENSHIN APPの中心となる体験は、AIとの一方向のデータ参照ではありません。

```text
原神アカウント
      ↓
HoYoLAB
      ↓
GENSHIN APP
      ↓
MCP
      ↓
AIがアカウント状況を理解
      ↓
ユーザーと相談
      ↓
編成・育成方針・TODOを決定
      ↓
GENSHIN APPへ保存
      ↓
次の会話で再利用
```

例えば、

```text
User:
「今の手持ちで高難易度用の2パーティー考えて」

AI:
アカウントデータを取得して編成を提案

User:
「その2つ保存して。必要な育成もTODOにして」

AI:
パーティーと育成TODOをGENSHIN APPへ保存
```

その後、

```text
User:
「次何育てればいい？」
```

と聞けば、AIは保存済みの育成計画や現在のアカウント状況を踏まえて回答できます。

---

## Features

### Account Sync

Chrome Extensionを利用してHoYoLABから原神アカウント情報を取得し、GENSHIN APPへ同期します。

主に以下のデータを扱います。

#### Account

- サーバー
- ニックネーム
- 冒険ランク
- 最終同期日時

#### Characters

- 所持キャラクター
- レベル
- 突破状況
- 凸数
- 好感度
- 天賦レベル

#### Weapons

- 装備武器
- 武器レベル
- 突破状況
- 精錬ランク
- 基礎攻撃力
- サブステータス

#### Character Stats

- HP
- 攻撃力
- 防御力
- 元素熟知
- 会心率
- 会心ダメージ
- 元素チャージ効率
- 元素ダメージ関連ステータス
- その他キャラクターステータス

#### Artifacts

- 装備聖遺物
- セット
- 部位
- メインステータス
- サブステータス
- 強化状況

---

## AI / MCP

GENSHIN APPはMCP Serverを提供し、AIがユーザーのデータへアクセスできるようにします。

### Read

AIは必要に応じて、

```text
get_account
list_characters
get_character
list_weapons
list_parties
list_training_tasks
```

などのToolを利用できます。

例えば、

```text
「今のアカウントで育成優先度が高いキャラクターは？」
```

という質問に対して、AIはまず所持キャラクター一覧を取得し、必要なら個別キャラクターの詳細情報を取得します。

すべてのデータを毎回コンテキストへ渡すのではなく、**質問に必要な情報のみTool経由で取得する**ことで、コンテキスト量を抑えます。

---

### Write

HoYoLABから同期されたゲームデータは基本的にread-onlyとして扱います。

一方、GENSHIN APP独自のデータについてはAIから更新できます。

例えば、

```text
create_party
update_party

create_training_task
update_training_task
complete_training_task
```

などの操作を通して、

- パーティー
- 育成TODO
- 育成計画
- ユーザーが決めた方針

をAIとの会話からアプリへ反映できます。

---

## Party Management

用途ごとにパーティーを保存できます。

例：

```text
深境螺旋
幻想シアター
幽境の激戦
探索
ボス
お気に入り
```

パーティーはユーザー自身が編集できるだけでなく、AIとの相談から作成することもできます。

---

## Training TODO

キャラクター育成をTODOとして管理します。

例：

```text
マーヴィカ
- 通常攻撃 Lv.8 → Lv.10
- 武器 Lv.90
- 聖遺物更新

シトラリ
- Lv.80 → Lv.90
- 元素スキル Lv.10
```

AIは現在の育成状況・保存済みパーティー・ユーザーの目標を参照しながら、育成優先度を提案できます。

---

## HoYoLAB Integration

GENSHIN APPはHoYoLABの代替を目的としていません。

HoYoLABから取得できるすべてのデータを複製するのではなく、**AIとの相談やアプリ独自機能に必要なデータのみを利用する**という方針を取ります。

HoYoLABの方が適している機能については、公式サービスへの導線を提供します。

例：

- Battle Chronicle
- リアルタイムノート
- 旅人手帳
- 育成計算機
- テイワットマップ

---

## Future Ideas

コア体験の完成後、必要性に応じて以下の機能を検討します。

### Battle History

深境螺旋・幻想シアター・高難易度コンテンツなどの戦績を保存し、

```text
「半年でアカウントがどれくらい強くなった？」
```

といった長期的な分析をAIと行えるようにする。

### Materials

所持育成素材を利用して、

```text
「このキャラをLv.90、天賦10まで育てるには何が足りない？」
```

といった育成計画を自動化する。

### Real-Time Data

必要に応じて、

- 天然樹脂
- デイリー状況
- 探索派遣

などの現在状態を取得し、

```text
「今ログインしたら何をやればいい？」
```

といった相談に利用する。

### Traveler's Diary

原石などの獲得履歴から、

- ガチャ計画
- 原石獲得ペース
- 将来の所持原石予測

などへ発展させる。

---

## Architecture

```text
┌──────────────────┐
│     HoYoLAB      │
└────────┬─────────┘
         │
         │ Account Data
         ▼
┌──────────────────┐
│ Chrome Extension │
│   Manifest V3    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│     Next.js      │
│   GENSHIN APP    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    PostgreSQL    │
│      Neon        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    MCP Server    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ ChatGPT / AI     │
└────────┬─────────┘
         │
         │ Party / TODO / Plan
         ▼
┌──────────────────┐
│   GENSHIN APP    │
└──────────────────┘
```

---

## Data Design

データは大きく2種類に分けます。

### Game Data

HoYoLABなど外部データソースから取得する情報。

```text
Account
Characters
Weapons
Talents
Artifacts
Stats
```

これらは実際の原神アカウント状態を表すため、基本的にread-onlyとして扱います。

### App Data

GENSHIN APP内で作成される情報。

```text
Parties
Training TODOs
Training Plans
User Goals
```

これらはユーザー自身またはAIとの会話から更新できます。

この区別によって、**ゲームの事実とAIが作った計画を混同しない**設計にしています。

---

## External API Boundary

HoYoLABなどの外部APIレスポンスを、そのままアプリ内部のデータモデルとして利用しない方針です。

```text
External API
     ↓
Validation
     ↓
Transform
     ↓
Application Data
     ↓
Database
```

Zodを利用して必要なデータを検証し、GENSHIN APPで利用する内部形式へ変換して保存します。

これにより、

- 外部API仕様への依存を局所化
- 不要なデータの保存を防止
- 型安全性の向上
- MCPへ渡すデータ量の削減

を目指します。

---

## Tech Stack

### Frontend / Web

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend / Database

- Next.js Route Handlers
- PostgreSQL
- Neon
- `pg`
- SQL
- Zod

### Authentication

- Cookie-based Session Authentication
- Argon2

### Chrome Extension

- Manifest V3
- Service Worker
- Chrome Cookies API

### AI

- Model Context Protocol
- MCP TypeScript SDK
- ChatGPT / AI clients

---

## Security

GENSHIN APPでは原神アカウントに関連するユーザーデータを扱うため、特に以下を重視します。

- ユーザーごとのデータ分離
- MCP認証・認可
- read / write Toolの権限制御
- セッショントークンの安全な管理
- 外部APIデータの検証
- AIによる書き込み範囲の制限

AIから直接変更できる対象は、原則としてGENSHIN APP独自データに限定します。

---

## Goal

GENSHIN APPの目的は、原神の情報をすべて管理することではありません。

目指しているのは、

> **ユーザー自身の原神アカウントをAIが理解し、一緒に考え、その結果を次の行動や次の会話へつなげられること。**

単なるアカウントビューアでも、単なるAIチャットでもなく、

```text
Game Data
   ×
Web Application
   ×
AI
   ×
MCP
```

を組み合わせることで、**「自分専用の原神アシスタント」**を作ることを目標としています。

---

## Disclaimer

This project is an unofficial fan-made application and is not affiliated with, endorsed by, or officially associated with HoYoverse.

Genshin Impact and related names, trademarks, and assets are the property of their respective owners.
