import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { server } from "@/server";
import codeDocsGetService from "@/service/code-docs-get-service";
import codeDocsUpdateService from "@/service/code-docs-update-service";

server.withTypeProvider<ZodTypeProvider>().route({
  method: "PUT",
  url: "/code-docs/:id",
  schema: {
    params: z.object({
      id: z.string(),
    }),
    body: z.object({
      codeDocs: z.any(),
    }),
    response: {
      200: z.any(),
    },
  },
  async handler(req, res) {
    const docsId = req.params.id;
    const codeDocs = req.body.codeDocs;
    const getCodeDocs = await codeDocsGetService(docsId);
    if (!getCodeDocs) {
      res.status(404).send({ error: "Code docs not found" });
      return;
    }
    await codeDocsUpdateService(docsId, codeDocs);
    res.send({
      success: true,
    });
  },
});
