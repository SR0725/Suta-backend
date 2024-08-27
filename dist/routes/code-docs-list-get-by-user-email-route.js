"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const server_1 = require("@/server");
const account_query_service_1 = __importDefault(require("@/service/account-query-service"));
const code_docs_list_get_by_user_email_service_1 = __importDefault(require("@/service/code-docs-list-get-by-user-email-service"));
server_1.server.withTypeProvider().route({
    method: "GET",
    url: "/code-docs/list",
    schema: {
        response: {
            200: zod_1.z.object({
                codeDocsList: zod_1.z.any(),
            }),
        },
    },
    async handler(req, res) {
        if (!req.cookies.authorization) {
            throw new Error("No Authorization");
        }
        const account = await (0, account_query_service_1.default)(req.cookies.authorization);
        const response = await (0, code_docs_list_get_by_user_email_service_1.default)(account.email);
        res.send({
            codeDocsList: response || [],
        });
    },
});
