"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const update_code_docs_1 = __importDefault(require("@/repositories/code-docs/update-code-docs"));
async function codeDocsUpdateService(docsId, codeDocs) {
    await (0, update_code_docs_1.default)(docsId, codeDocs);
    return true;
}
exports.default = codeDocsUpdateService;
