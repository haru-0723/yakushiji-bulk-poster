# 薬師寺バルク 投稿ダッシュボード セットアップ手順

このツールは何をするか
- 毎週日曜21:00(JST)に、Anthropic APIで「薬師寺バルク」の口調に合わせた1週間分(7日 × 朝投稿/通常投稿の2本 = 14本)の下書きを自動生成し、Supabaseに保存します。
- 毎日6:30(JST)に、その日の2本の下書きをDiscordに通知します。
- ダッシュボード(Webページ)で今週分の下書きを確認・コピーできます。手動で再生成するボタンもあります。
- X(Twitter)への投稿自体は自動化していません。Discordやダッシュボードで本文を確認し、自分でXに貼り付けて投稿してください。

---

## 1. GitHubリポジトリを作る

新しいリポジトリを作成し、このフォルダの内容をpushしてください。普段Claude Codeでやっている操作と同じです。

```
git init
git add .
git commit -m "init"
git remote add origin <新しいリポジトリのURL>
git push -u origin main
```

## 2. Supabaseでテーブルを作る

今使っているMediQuiz AIのSupabaseプロジェクトに、新しいテーブルを1つ追加するだけでOKです(新しいSupabaseプロジェクトを作る必要はありません)。

Supabaseダッシュボード → SQL Editor で `supabase_schema.sql` の内容をそのまま貼り付けて実行してください。

## 3. Discord Webhookを作る(下書きの通知先)

LINE Notifyは2025年3月末で終了しているため、Discordへの通知に置き換えています。

1. Discordで通知を受け取りたいサーバー(なければ自分用に1つ作成、無料)を用意する
2. 通知を受け取りたいチャンネルを右クリック →「チャンネルを編集」
3. 「連携サービス」→「ウェブフック」→「新しいウェブフック」
4. 名前を「薬師寺バルク通知」などに変更し、「ウェブフックURLをコピー」
5. このURLを後で `DISCORD_WEBHOOK_URL` に設定します

スマホにDiscordアプリを入れて通知をONにしておけば、毎朝プッシュ通知が来ます。

## 4. Vercelに新規プロジェクトとしてデプロイ

1. Vercelダッシュボード →「Add New」→「Project」
2. 先ほどpushしたGitHubリポジトリを選択してインポート(MediQuiz AIとは別の新しいプロジェクトになります)
3. そのままDeployでOK(Framework Presetは自動でNext.jsと認識されます)

## 5. 環境変数を設定する

Vercelのプロジェクト → Settings → Environment Variables で、以下を1つずつ追加してください(Production / Previewの両方にチェック)。

| Key | 値 |
|---|---|
| `ANTHROPIC_API_KEY` | MediQuiz AIで使っているものと同じキーで構いません |
| `SUPABASE_URL` | MediQuiz AIと同じSupabaseプロジェクトのURL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role キー |
| `DISCORD_WEBHOOK_URL` | 手順3でコピーしたURL |
| `CRON_SECRET` | ランダムな文字列を自分で決める(例: パスワード生成ツールで32文字程度) |
| `DASHBOARD_PASSWORD` | ダッシュボードにログインするためのパスワードを自分で決める |

設定したら、Deployments タブから再デプロイ(Redeploy)して環境変数を反映させてください。

## 6. 動作確認

デプロイ完了後、以下を順番に試してください。

1. `https://<あなたのプロジェクト>.vercel.app/` を開き、`DASHBOARD_PASSWORD` でログインできるか確認
2. ログイン後、「今週分を再生成」ボタンを押す → 少し待ってDiscordに「✅ ...の週の投稿を14本生成しました」と通知が来て、ダッシュボードに14本の下書きが表示されればOK
3. ダッシュボードの各投稿にある「コピー」ボタンで本文をコピーできるか確認

これで毎週日曜21:00に自動生成、毎日6:30に当日分がDiscordに届くようになります。

## 7. cronを手動でテストしたい場合

`CRON_SECRET` を使って、ターミナルから直接叩いて確認できます(`xxxx`は実際に設定した値に置き換えてください)。

```
curl -X POST https://<あなたのプロジェクト>.vercel.app/api/generate-week \
  -H "Authorization: Bearer xxxx"

curl -X POST https://<あなたのプロジェクト>.vercel.app/api/deliver-today \
  -H "Authorization: Bearer xxxx"
```

## 補足

- cronのスケジュールは `vercel.json` の中にUTCで書かれています(Vercelのcronは常にUTC基準のため)。時間を変えたい場合はこのファイルの `schedule` を編集してください。
  - 現在の設定: 毎週生成 = 日曜12:00 UTC(= 日本時間21:00)、毎日配信 = 21:30 UTC(= 日本時間翌6:30)
- VercelのHobby(無料)プランでも、cronが「1日1回まで」という制限の範囲内で動くように設計しているので、有料プランへの変更は不要です。
- キャラクターの口調やルールを調整したい場合は `lib/character-prompt.js` だけを編集すれば、他のコードに触れずに反映されます。
