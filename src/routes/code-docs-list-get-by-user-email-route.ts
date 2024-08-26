import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { server } from "@/server";
import accountQueryService from "@/service/account-query-service";
import codeDocsListGetByUserEmailService from "@/service/code-docs-list-get-by-user-email-service";

server.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/code-docs/list",
  schema: {
    response: {
      200: z.object({
        codeDocsList: z.any(),
      }),
    },
  },
  async handler(req, res) {
    if (!req.cookies.authorization) {
      throw new Error("No Authorization");
    }
    const account = await accountQueryService(req.cookies.authorization);
    const response = await codeDocsListGetByUserEmailService(account.email);
    res.send({
      codeDocsList: response || [],
    });
  },
});
