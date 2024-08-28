"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const server_1 = require("@/server");
const code_docs_get_service_1 = __importDefault(require("@/service/code-docs-get-service"));
const code_docs_update_service_1 = __importDefault(require("@/service/code-docs-update-service"));
server_1.server.withTypeProvider().route({
    method: "PUT",
    url: "/code-docs/:id",
    schema: {
        params: zod_1.z.object({
            id: zod_1.z.string(),
        }),
        body: zod_1.z.object({
            codeDocs: zod_1.z.any(),
        }),
        response: {
            200: zod_1.z.any(),
        },
    },
    async handler(req, res) {
        const docsId = req.params.id;
        const codeDocs = req.body.codeDocs;
        const getCodeDocs = await (0, code_docs_get_service_1.default)(docsId);
        if (!getCodeDocs) {
            res.status(404).send({ error: "Code docs not found" });
            return;
        }
        await (0, code_docs_update_service_1.default)(docsId, codeDocs);
        res.send({
            success: true,
        });
    },
});
