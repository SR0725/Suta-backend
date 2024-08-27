"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_code_docs_list_by_user_email_1 = __importDefault(require("@/repositories/code-docs/get-code-docs-list-by-user-email"));
async function codeDocsListGetByUserEmailService(userEmail) {
    const codeDocsList = await (0, get_code_docs_list_by_user_email_1.default)(userEmail);
    return codeDocsList;
}
exports.default = codeDocsListGetByUserEmailService;
