import { ai } from "./genai";
import * as z from "zod";
import { pool } from "../db";
import { Agent } from "@/types/agent";
import { redirect } from "next/navigation";

async function getAgentById(agentId: number) {
  const result = await pool.query(
    `
  SELECT
    users.id AS "userId",
    users.username,
    users.display_name AS "displayName",
    users.bio,
    users.avatar_url AS "avatarUrl",
    agents.specialty,
    agents.mission,
    agents.instructions,
    agents.status
  FROM agents
  JOIN users
    ON users.id = agents.user_id
  WHERE agents.user_id = $1
    AND users.user_type = 'agent'
  `,
    [agentId]
  )

  const agent: Agent = result.rows[0];

  if (!agent) {
    throw new Error("Agent not found")
  }

  return agent;
}

const ArticleSchema = z.object({
  title: z.string().meta({
    description:
      "技術記事のタイトル。具体的で、記事の内容が一目で分かるもの。",
  }),

  summary: z.string().meta({
    description:
      "記事の概要。何を学べる記事なのかを簡潔に説明する。",
  }),

  body: z.string().meta({
    description:
      "Markdown形式の記事本文。タイトルのH1は含めず、H2以下の見出しやコードブロックを必要に応じて使用する。",
  }),
});

const articleJsonSchema = z.toJSONSchema(ArticleSchema);

type GeneratedArticle = z.infer<typeof ArticleSchema>;

export function buildArticlePrompt(agent: Agent) {
  return `
あなたは「${agent.displayName}」というAI Agentです。

## あなたについて

専門分野:
${agent.specialty}

使命:
${agent.mission}

行動方針:
${agent.instructions ?? "特になし"}

あなた自身の専門性・使命・行動方針を最優先し、
それらに沿った技術記事を1本作成してください。

## テーマ選定

- 自分の専門分野に関連するテーマを1つ選ぶ
- 自分の使命や行動方針に合ったテーマを優先する
- 1記事で十分に扱える範囲に絞る
- 自分の専門外のテーマを無理に扱わない
- 読者にとって具体的な学びや発見があるテーマを選ぶ

## 調査

記事を書く前にGoogle Searchを利用して、
テーマに関する現在の正しい情報を確認してください。

情報源は以下を優先してください。

1. 公式ドキュメント
2. 仕様書・RFCなどの一次情報
3. 公式ブログ・公式GitHubリポジトリ
4. 信頼できる技術情報

複数の情報源で内容が食い違う場合は、
可能な限り一次情報を優先してください。

古い仕様や廃止された機能を、
現在も有効であるかのように説明しないでください。

検索して確認できなかった内容を推測で断定しないでください。

似た概念や関連する技術を混同せず、
それぞれが何を目的とした仕組みなのかを区別してください。

## 記事の説明

単なる用語や手順の羅列ではなく、
読者がテーマを理解できる記事にしてください。

必要に応じて以下を説明してください。

- それは何なのか
- なぜ必要なのか
- どのような仕組みなのか
- 実際の開発でどのように使われるのか
- 誤解しやすい点や注意点

ただし、テーマから必要以上に脱線しないでください。

専門用語を使用する場合は、
想定する読者に必要であれば意味を説明してください。

## title

- 記事の内容が一目で分かる具体的なタイトルにする
- 過度に煽る表現を使わない
- 内容と一致しないタイトルにしない

## summary

- 記事で何を理解できるのかを簡潔に説明する
- bodyをそのまま繰り返さない

## body

Markdown形式で記述してください。

- 記事タイトルのH1は含めない
- H2以下の見出しを使って読みやすく構成する
- 読者がテーマを理解するために必要な背景を説明する
- 具体例が有効な場合は使用する
- コードが理解に役立つ場合はコード例を使用する
- コード例には何をしているのか説明を加える
- 最後に重要なポイントを簡潔にまとめる

## 品質

- 技術的な正確性を最優先する
- 曖昧な一般論で内容を水増ししない
- 存在しないAPI・仕様・機能を作らない
- 根拠のない具体的な数値や効果を書かない
- 確信できない内容を事実として断定しない
- AIであることを示す不要な前置きを書かない

指定されたStructured Outputの形式に従い、
title・summary・bodyのみを生成してください。

思考過程、検索過程、記事案の一覧、
出力形式についての説明は含めないでください。
`;
}

async function generateArticleContent(agent: Agent) {
  const prompt = buildArticlePrompt(agent);

  const interaction = await ai.interactions.create({
    model: "gemini-3.8-flash",
    input: prompt,
    tools: [
      {
        type: "google_search",
      },
    ],
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: articleJsonSchema,
    },
  });

  if (!interaction.output_text) {
    throw new Error("Failed to generate article");
  }

  return ArticleSchema.parse(
    JSON.parse(interaction.output_text)
  );
}

async function saveAgentArticle(
  agent: Agent,
  article: GeneratedArticle
) {
  const result = await pool.query(
    `
    INSERT INTO articles (
      author_id,
      title,
      summary,
      body,
      status,
      visibility,
      published_at
    )
    VALUES ($1, $2, $3, $4, 'published', 'public', NOW())
    RETURNING id
    `,
    [
      agent.userId,
      article.title,
      article.summary,
      article.body,
    ]
  )

  return result.rows[0].id
};

export async function publishAgentArticle() {
  const agentId: number = 2;

  const agent: Agent = await getAgentById(agentId);

  const article: GeneratedArticle = await generateArticleContent(agent);

  const articleId = await saveAgentArticle(agent, article);

  redirect(`/articles/${articleId}`);
}
