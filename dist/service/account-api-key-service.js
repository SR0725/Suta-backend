"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountApiKeyByEmailService = getAccountApiKeyByEmailService;
exports.insertAccountOpenAIApiKeyByEmailService = insertAccountOpenAIApiKeyByEmailService;
exports.deleteAccountApiKeyByEmailService = deleteAccountApiKeyByEmailService;
const delete_api_key_by_email_1 = __importDefault(require("@/repositories/account-api-key/delete-api-key-by-email"));
const get_api_key_by_email_1 = __importDefault(require("@/repositories/account-api-key/get-api-key-by-email"));
const insert_api_key_by_email_1 = __importDefault(require("@/repositories/account-api-key/insert-api-key-by-email"));
async function getAccountApiKeyByEmailService(email) {
    return (0, get_api_key_by_email_1.default)(email);
}
async function insertAccountOpenAIApiKeyByEmailService(email, apiKey) {
    return (0, insert_api_key_by_email_1.default)(email, apiKey, "open-ai");
}
async function deleteAccountApiKeyByEmailService(email) {
    return (0, delete_api_key_by_email_1.default)(email);
}
