import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { server } from "@/server";
import accountQueryService from "@/service/account-query-service";
import codeDocsDeleteService from "@/service/code-docs-delete-service";
import codeDocsGetService from "@/service/code-docs-get-service";

server.withTypeProvider<ZodTypeProvider>().route({
  method: "DELETE",
  url: "/code-docs/:id",
  schema: {
    params: z.object({
      id: z.string(),
    }),
    response: {
      200: z.any(),
    },
  },
  async handler(req, res) {
    const docsId = req.params.id;
    if (!req.cookies.authorization) {
      throw new Error("No Authorization");
    }
    const account = await accountQueryService(req.cookies.authorization);
    if (!account) {
      throw new Error("No Authorization");
    }
    const codeDocs = await codeDocsGetService(docsId);
    if (!codeDocs || codeDocs.creatorEmail !== account.email) {
      throw new Error("No Authorization");
    }
    await codeDocsDeleteService(docsId);
    res.send({
      success: true,
    });
  },
});
