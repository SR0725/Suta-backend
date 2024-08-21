import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { server } from "@/server";
import codeDocsGenerateService from "@/service/code-docs-generate-service";

server.withTypeProvider<ZodTypeProvider>().route({
  method: "POST",
  url: "/code-docs/generate",
  schema: {
    body: z.object({
      code: z.string(),
    }),
    response: {
      200: z.object({
        docsId: z.string(),
      }),
    },
  },
  async handler(req, res) {
    const code = req.body.code;
    const response = await codeDocsGenerateService(code);
    res.send({ docsId: response });
  },
});
