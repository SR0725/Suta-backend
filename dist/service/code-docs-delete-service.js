"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const delete_code_docs_by_id_1 = __importDefault(require("@/repositories/code-docs/delete-code-docs-by-id"));
async function codeDocsDeleteService(docsId) {
    return await (0, delete_code_docs_by_id_1.default)(docsId);
}
exports.default = codeDocsDeleteService;
