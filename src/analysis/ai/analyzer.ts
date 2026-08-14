import type { AnalysisInput, Finding } from "../types.js";
import { buildAiReviewPrompt } from "./prompt.js";
import {
  aiReviewResponseSchema,
  toAiFindings,
  toProjectFinding,
} from "./schema.js";

interface OpenAiResponse {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

interface OpenAiErrorResponse {
  error?: {
    message?: string;
    code?: string;
    type?: string;
  };
}

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5-nano";

export async function runAiAnalysis(input: AnalysisInput): Promise<Finding[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when AI analysis is enabled.");
  }

  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You are PR Guard, a careful code reviewer. Return only structured findings that match the requested schema.",
        },
        {
          role: "user",
          content: buildAiReviewPrompt(input),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "pr_guard_ai_review",
          strict: true,
          schema: aiReviewResponseSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await formatOpenAiError(response));
  }

  const data = (await response.json()) as OpenAiResponse;
  const jsonText = extractResponseText(data);
  const parsed = JSON.parse(jsonText) as unknown;

  return toAiFindings(parsed).map((finding) => toProjectFinding(input.file, finding));
}

async function formatOpenAiError(response: Response): Promise<string> {
  const body = await response.text();

  try {
    const parsed = JSON.parse(body) as OpenAiErrorResponse;
    const message = parsed.error?.message ?? body;
    const code = parsed.error?.code ?? parsed.error?.type ?? response.status;

    return `OpenAI API request failed (${code}): ${message}`;
  } catch {
    return `OpenAI API request failed with status ${response.status}: ${body}`;
  }
}

function extractResponseText(response: OpenAiResponse): string {
  if (response.output_text) {
    return response.output_text;
  }

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI API response did not include output text.");
}
