#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";

// Gemini 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// MCP 서버 생성
const server = new Server(
  {
    name: "gemini-code-analyzer",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 도구 목록 정의
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "analyze_code",
        description:
          "파일을 읽고 Gemini로 분석하여 요약된 결과를 반환합니다. 보안, 성능, 패턴 분석 등을 요청할 수 있습니다.",
        inputSchema: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: "분석할 파일의 절대 경로",
            },
            analysis_type: {
              type: "string",
              description:
                "분석 유형: security(보안), performance(성능), patterns(패턴), summary(요약), custom(사용자 정의)",
              enum: ["security", "performance", "patterns", "summary", "custom"],
            },
            custom_prompt: {
              type: "string",
              description: "custom 타입일 때 사용할 분석 프롬프트",
            },
          },
          required: ["file_path", "analysis_type"],
        },
      },
      {
        name: "analyze_multiple_files",
        description:
          "여러 파일을 읽고 Gemini로 종합 분석합니다. 파일 간 관계, 아키텍처 패턴 등을 분석할 수 있습니다.",
        inputSchema: {
          type: "object",
          properties: {
            file_paths: {
              type: "array",
              items: { type: "string" },
              description: "분석할 파일들의 절대 경로 배열",
            },
            analysis_prompt: {
              type: "string",
              description: "분석 요청 프롬프트",
            },
          },
          required: ["file_paths", "analysis_prompt"],
        },
      },
      {
        name: "compare_with_docs",
        description:
          "코드 파일을 읽고 제공된 Best Practice 문서와 비교 분석합니다.",
        inputSchema: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: "분석할 파일의 절대 경로",
            },
            best_practice_docs: {
              type: "string",
              description: "비교할 Best Practice 문서 내용",
            },
            focus_areas: {
              type: "array",
              items: { type: "string" },
              description: "집중 분석할 영역들 (예: caching, error-handling)",
            },
          },
          required: ["file_path", "best_practice_docs"],
        },
      },
    ],
  };
});

// 분석 타입별 프롬프트
const analysisPrompts = {
  security: `다음 코드를 보안 관점에서 분석해주세요:
- SQL Injection, XSS, CSRF 등 OWASP Top 10 취약점
- 인증/인가 관련 이슈
- 민감 정보 노출 위험
- 입력 검증 누락

핵심 발견사항만 간결하게 bullet point로 정리해주세요.`,

  performance: `다음 코드를 성능 관점에서 분석해주세요:
- N+1 쿼리 문제
- 불필요한 리렌더링
- 메모리 누수 가능성
- 비효율적인 알고리즘
- 캐싱 미적용 영역

핵심 발견사항만 간결하게 bullet point로 정리해주세요.`,

  patterns: `다음 코드에서 사용된 디자인 패턴과 아키텍처를 분석해주세요:
- 사용된 패턴 식별
- 패턴 적용의 적절성
- 개선 가능한 패턴 제안

핵심만 간결하게 정리해주세요.`,

  summary: `다음 코드를 분석하고 핵심 내용을 요약해주세요:
- 주요 기능과 목적
- 핵심 로직 흐름
- 주요 의존성
- 특이사항

5-10줄 이내로 간결하게 요약해주세요.`,
};

// 도구 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "analyze_code") {
      const { file_path, analysis_type, custom_prompt } = args;

      // 파일 읽기
      const content = await fs.readFile(file_path, "utf-8");
      const fileName = path.basename(file_path);

      // 프롬프트 구성
      let prompt;
      if (analysis_type === "custom" && custom_prompt) {
        prompt = `${custom_prompt}\n\n파일: ${fileName}\n\`\`\`\n${content}\n\`\`\``;
      } else {
        prompt = `${analysisPrompts[analysis_type]}\n\n파일: ${fileName}\n\`\`\`\n${content}\n\`\`\``;
      }

      // Gemini 분석
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      return {
        content: [
          {
            type: "text",
            text: `## ${fileName} 분석 결과 (${analysis_type})\n\n${response}`,
          },
        ],
      };
    }

    if (name === "analyze_multiple_files") {
      const { file_paths, analysis_prompt } = args;

      // 모든 파일 읽기
      const filesContent = await Promise.all(
        file_paths.map(async (filePath) => {
          const content = await fs.readFile(filePath, "utf-8");
          const fileName = path.basename(filePath);
          return `### ${fileName}\n\`\`\`\n${content}\n\`\`\``;
        })
      );

      const prompt = `${analysis_prompt}\n\n${filesContent.join("\n\n")}`;

      // Gemini 분석
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      return {
        content: [
          {
            type: "text",
            text: `## 다중 파일 분석 결과\n\n${response}`,
          },
        ],
      };
    }

    if (name === "compare_with_docs") {
      const { file_path, best_practice_docs, focus_areas } = args;

      // 파일 읽기
      const content = await fs.readFile(file_path, "utf-8");
      const fileName = path.basename(file_path);

      const focusText = focus_areas
        ? `\n집중 분석 영역: ${focus_areas.join(", ")}`
        : "";

      const prompt = `다음 코드를 Best Practice 문서와 비교 분석해주세요.${focusText}

## Best Practice 문서
${best_practice_docs}

## 분석 대상 코드 (${fileName})
\`\`\`
${content}
\`\`\`

## 요청사항
1. Best Practice 준수 여부를 항목별로 체크 (O/X)
2. 개선이 필요한 부분 구체적으로 제시
3. 권장 수정 코드 예시 (필요시)

간결하게 핵심만 정리해주세요.`;

      // Gemini 분석
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      return {
        content: [
          {
            type: "text",
            text: `## ${fileName} Best Practice 비교 결과\n\n${response}`,
          },
        ],
      };
    }

    return {
      content: [{ type: "text", text: `알 수 없는 도구: ${name}` }],
      isError: true,
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `오류 발생: ${error.message}` }],
      isError: true,
    };
  }
});

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gemini MCP Server running on stdio");
}

main().catch(console.error);
