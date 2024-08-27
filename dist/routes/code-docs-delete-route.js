"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const server_1 = require("@/server");
const account_query_service_1 = __importDefault(require("@/service/account-query-service"));
const code_docs_delete_service_1 = __importDefault(require("@/service/code-docs-delete-service"));
const code_docs_get_service_1 = __importDefault(require("@/service/code-docs-get-service"));
server_1.server.withTypeProvider().route({
    method: "DELETE",
    url: "/code-docs/:id",
    schema: {
        params: zod_1.z.object({
            id: zod_1.z.string(),
        }),
        response: {
            200: zod_1.z.any(),
        },
    },
    async handler(req, res) {
        const docsId = req.params.id;
        if (!req.cookies.authorization) {
            throw new Error("No Authorization");
        }
        const account = await (0, account_query_service_1.default)(req.cookies.authorization);
        if (!account) {
            throw new Error("No Authorization");
        }
        const codeDocs = await (0, code_docs_get_service_1.default)(docsId);
        if (!codeDocs || codeDocs.creatorEmail !== account.email) {
            throw new Error("No Authorization");
        }
        await (0, code_docs_delete_service_1.default)(docsId);
        res.send({
            success: true,
        });
    },
});
