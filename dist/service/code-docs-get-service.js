"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_code_docs_by_id_1 = __importDefault(require("@/repositories/code-docs/get-code-docs-by-id"));
async function codeDocsGetService(docsId) {
    const codeDocs = await (0, get_code_docs_by_id_1.default)(docsId);
    return codeDocs;
}
exports.default = codeDocsGetService;
