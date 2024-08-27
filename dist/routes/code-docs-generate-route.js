"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const server_1 = require("@/server");
const account_query_service_1 = __importDefault(require("@/service/account-query-service"));
const code_docs_generate_service_1 = __importDefault(require("@/service/code-docs-generate-service"));
const MAX_CODE_DOCS_GENERATION_PER_DAY = Number(process.env.MAX_CODE_DOCS_GENERATION_PER_DAY) || 50;
server_1.server.withTypeProvider().route({
    method: "POST",
    url: "/code-docs/generate",
    schema: {
        body: zod_1.z.object({
            code: zod_1.z.string().min(1).max(10000),
        }),
        response: {
            200: zod_1.z.object({
                docsId: zod_1.z.string(),
            }),
        },
    },
    async handler(req, res) {
        var _a, _b, _c;
        const code = req.body.code;
        if (!req.cookies.authorization) {
            throw new Error("No Authorization");
        }
        const account = await (0, account_query_service_1.default)(req.cookies.authorization);
        if (((_a = account === null || account === void 0 ? void 0 : account.codeDocsGenerateUsage) === null || _a === void 0 ? void 0 : _a.lastGeneratedAt) &&
            ((_b = account === null || account === void 0 ? void 0 : account.codeDocsGenerateUsage) === null || _b === void 0 ? void 0 : _b.lastGeneratedAt.toDateString()) ===
                new Date().toDateString() &&
            ((_c = account === null || account === void 0 ? void 0 : account.codeDocsGenerateUsage) === null || _c === void 0 ? void 0 : _c.thisDayGeneratedCount) >=
                MAX_CODE_DOCS_GENERATION_PER_DAY) {
            throw new Error(`You have reached the limit of ${MAX_CODE_DOCS_GENERATION_PER_DAY} code docs generation per day\n每日最多只能生成 ${MAX_CODE_DOCS_GENERATION_PER_DAY} 份程式碼文件`);
        }
        const response = await (0, code_docs_generate_service_1.default)(account, code);
        res.send({ docsId: response });
    },
});
