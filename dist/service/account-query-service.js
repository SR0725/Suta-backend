"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_account_by_email_1 = __importDefault(require("@/repositories/account/get-account-by-email"));
const decode_user_jwt_1 = __importDefault(require("@/utils/decode-user-jwt"));
async function accountQueryService(token) {
    const decodedToken = (0, decode_user_jwt_1.default)(token);
    if (!decodedToken) {
        throw new Error("Invalid token");
    }
    const account = await (0, get_account_by_email_1.default)(decodedToken.email);
    return account;
}
exports.default = accountQueryService;
