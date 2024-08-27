"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const update_code_docs_1 = __importDefault(require("../../repositories/code-docs/update-code-docs"));
const crypto_1 = require("crypto");
const zod_1 = require("zod");
const get_code_docs_by_id_1 = __importDefault(require("@/repositories/code-docs/get-code-docs-by-id"));
const agent_1 = __importDefault(require("./agent"));
const y_push_card_1 = __importDefault(require("./y-push-card"));
const y_upsert_llm_history_1 = __importDefault(require("./y-upsert-llm-history"));
const nodeName = "initialCodeArchitecture";
const prompt = `你是一個旨在幫助教授編程的AI助手。你的任務是為給定的代碼創建一個乾淨、最小的起始點。這個起始點將作為逐步編程教程的基礎。
你的目標是為這段代碼生成一個初始框架。這個框架應該是：
1. 可執行的（應能在沒有錯誤的情況下運行）
2. 儘可能乾淨和最小
3. 沒有任何特定功能
4. 無需特殊的導入或函數聲明
5. 只包含作為起始點所必需的基本內容

按照以下步驟創建初始框架：
1. 確定代碼的基本結構（例如，是否是函數、類還是腳本）。
2. 移除所有特定功能，只保留最基本的結構。
3. 移除所有導入，除了絕對必要的（如果有的話）。
4. 移除所有函數和變量聲明，僅保留主要入口點（如果適用）。
5. 如果有主函數或入口點，保留其聲明但刪除內容。
6. 確保生成的代碼在語法上仍然正確，並且可以在沒有錯誤的情況下執行。
7. 最後以以下 JSON 格式輸出
"""
{
  "code": "<程式碼>"
}
"""
記住，目標是提供一個最簡單的起始點，以便初學者可以在此基礎上構建，最終創建完整代碼。`;
const responseSchema = zod_1.z.object({
    code: zod_1.z.string(),
});
async function createInitialCodeArchitectureNode({ docsId, code, yDoc, }) {
    const llmHistoryId = (0, crypto_1.randomUUID)();
    const cardId = (0, crypto_1.randomUUID)();
    try {
        // 生成標題和描述
        const response = await (0, agent_1.default)({
            prompt,
            responseSchema,
            messages: [
                {
                    role: "user",
                    content: code,
                },
            ],
            handleGenerate: (newContent) => {
                (0, y_upsert_llm_history_1.default)({
                    yDoc,
                    nodeType: nodeName,
                    llmHistoryId,
                    newContent,
                    prompt,
                    input: code,
                });
                const yText = yDoc.getText(nodeName);
                yText.insert(yText.length, newContent);
            },
        });
        // 完成後，更新 ydoc 的 card
        const card = {
            type: "codeStep",
            id: cardId,
            stepIndex: 0,
            description: "初始程式碼架構",
            conclusion: "",
            codeLines: response.code.split("\n").map((line) => ({
                text: line,
            })),
            preview: null,
        };
        (0, y_push_card_1.default)({
            yDoc,
            card,
        });
        // 完全生成完畢後，更新 CodeDocs 資料庫
        const codeDocs = await (0, get_code_docs_by_id_1.default)(docsId);
        if (!codeDocs) {
            throw new Error("CodeDocs not found");
        }
        await (0, update_code_docs_1.default)(docsId, Object.assign(Object.assign({}, codeDocs), { cards: [card], llmHistoryList: [
                ...codeDocs.llmHistoryList,
                {
                    id: llmHistoryId,
                    nodeType: nodeName,
                    response: JSON.stringify(response),
                    targetCardId: cardId,
                    prompt,
                    input: code,
                },
            ] }));
        return response.code;
    }
    catch (error) {
        console.error(error);
    }
}
exports.default = createInitialCodeArchitectureNode;
