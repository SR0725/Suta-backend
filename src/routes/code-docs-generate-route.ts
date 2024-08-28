import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { server } from "@/server";
import accountQueryService from "@/service/account-query-service";
import codeDocsGenerateService from "@/service/code-docs-generate-service";

const MAX_CODE_DOCS_GENERATION_PER_DAY =
  Number(process.env.MAX_CODE_DOCS_GENERATION_PER_DAY) || 50;

server.withTypeProvider<ZodTypeProvider>().route({
  method: "POST",
  url: "/code-docs/generate",
  schema: {
    body: z.object({
      code: z.string().min(1).max(10000),
      locale: z.enum(["zh-TW", "en"]),
    }),
    response: {
      200: z.object({
        docsId: z.string(),
      }),
    },
  },
  async handler(req, res) {
    const code = req.body.code;
    const locale = req.body.locale;
    if (!req.cookies.authorization) {
      throw new Error("No Authorization");
    }
    const account = await accountQueryService(req.cookies.authorization);
    if (
      account?.codeDocsGenerateUsage?.lastGeneratedAt &&
      account?.codeDocsGenerateUsage?.lastGeneratedAt.toDateString() ===
        new Date().toDateString() &&
      account?.codeDocsGenerateUsage?.thisDayGeneratedCount >=
        MAX_CODE_DOCS_GENERATION_PER_DAY
    ) {
      throw new Error(
        `You have reached the limit of ${MAX_CODE_DOCS_GENERATION_PER_DAY} code docs generation per day\n每日最多只能生成 ${MAX_CODE_DOCS_GENERATION_PER_DAY} 份程式碼文件`
      );
    }
    const response = await codeDocsGenerateService(account, code, locale);
    res.send({ docsId: response });
  },
});
