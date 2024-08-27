"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function decodeUserJWT(token) {
    const secret = process.env.JWT_SECRET || "your-secret-key";
    return jsonwebtoken_1.default.verify(token, secret);
}
exports.default = decodeUserJWT;
