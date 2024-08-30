"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpenAI = createOpenAI;
const openai_1 = __importDefault(require("openai"));
function createOpenAI(apiKey) {
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set");
    }
    const client = new openai_1.default({
        apiKey,
    });
    return client;
}
