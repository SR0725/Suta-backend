"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const get_account_by_email_1 = __importDefault(require("@/repositories/account/get-account-by-email"));
const upsert_account_1 = __importDefault(require("@/repositories/account/upsert-account"));
function generateJWT(account) {
    const secret = process.env.JWT_SECRET || "your-secret-key";
    return jsonwebtoken_1.default.sign(Object.assign({}, account), secret, {
        expiresIn: "1d",
    });
}
async function accountLoginOrRegisterService(googleProfile) {
    const _account = await (0, get_account_by_email_1.default)(googleProfile.email);
    const account = _account || {
        email: googleProfile.email,
        name: googleProfile.name,
        picture: googleProfile.picture,
        lastLoginAt: new Date(),
    };
    await (0, upsert_account_1.default)(Object.assign(Object.assign({}, account), { lastLoginAt: new Date() }));
    const token = generateJWT(account);
    return { account, token };
}
exports.default = accountLoginOrRegisterService;
