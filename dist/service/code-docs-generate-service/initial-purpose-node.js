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
const y_upsert_llm_history_1 = __importDefault(require("./y-upsert-llm-history"));
const nodeName = "initialPurpose";
const prompt = `你需要分析一段程式碼，並生成該程式碼的主要目標和功能的標題和描述。
按照以下步驟完成任務：
1. 仔細閱讀並理解提供在 CODE 標籤中的程式碼。
2. 識別該程式碼的主要目標及其主要功能。思考程式碼的設計目的及其實現方法。
3. 生成一個簡潔的標題，以概括該程式碼的整體目的。
4. 撰寫一個簡短的描述，解釋程式碼的主要功能和目標。確保描述清晰且具說明性。
5. 請使用台灣用語 繁體中文

以以下 JSON 格式輸出標題和描述：
"""
{
  "title": "<你生成的標題>",
  "description": "<你生成的描述>",
  "language": "<程式碼的語言，請盡量使用 hljs 能辨識的寫法，如 jsx、glsl、tsx>"
}
"""

確保 JSON 格式有效，並遵循所提供的結構。`;
const responseSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    language: zod_1.z.string(),
});
async function createInitialPurposeNode({ docsId, code, yDoc, }) {
    const llmHistoryId = (0, crypto_1.randomUUID)();
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
            },
        });
        // 更新 YJS 資料庫
        const title = yDoc.getText("title");
        const description = yDoc.getText("description");
        const language = yDoc.getText("language");
        title.insert(0, response.title);
        description.insert(0, response.description);
        language.insert(0, response.language);
        // 完全生成完畢後，更新 CodeDocs 資料庫
        const codeDocs = await (0, get_code_docs_by_id_1.default)(docsId);
        if (!codeDocs) {
            throw new Error("CodeDocs not found");
        }
        await (0, update_code_docs_1.default)(docsId, Object.assign(Object.assign({}, codeDocs), { title: response.title, description: response.description, language: response.language, llmHistoryList: [
                ...codeDocs.llmHistoryList,
                {
                    id: llmHistoryId,
                    nodeType: nodeName,
                    response: JSON.stringify(response),
                    prompt,
                    input: code,
                },
            ] }));
    }
    catch (error) {
        console.error(error);
    }
}
exports.default = createInitialPurposeNode;
