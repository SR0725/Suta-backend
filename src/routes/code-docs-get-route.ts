import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { server } from "@/server";
import codeDocsGetService from "@/service/code-docs-get-service";

server.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
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
    const response = await codeDocsGetService(docsId);
    if (!response) {
      res.status(404).send({ error: "Code docs not found" });
      return;
    }
    const isGenerating = response.isGenerating;
    res.send({
      isGenerating,
      codeDocs: response,
    });
  },
});
