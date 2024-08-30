"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("openai/helpers/zod");
const openai_1 = require("@/utils/openai");
async function agent(props) {
    var _a, e_1, _b, _c;
    var _d, _e;
    const { prompt, messages, responseSchema, handleGenerate, model = "gpt-4o-mini", maxTokens = 4096, retryTimes = 3, temperature = 0, _alreadyRetryTimes = 0, apiKey, } = props;
    const client = (0, openai_1.createOpenAI)(apiKey);
    const stream = await client.chat.completions.create(Object.assign({ model: model, messages: [{ role: "system", content: prompt }, ...messages], max_tokens: maxTokens, temperature: temperature, stream: true }, (responseSchema
        ? {
            response_format: (0, zod_1.zodResponseFormat)(responseSchema, "response-format"),
        }
        : {})));
    let resultContent = "";
    try {
        for (var _f = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = await stream_1.next(), _a = stream_1_1.done, !_a; _f = true) {
            _c = stream_1_1.value;
            _f = false;
            const chunk = _c;
            const content = ((_e = (_d = chunk.choices[0]) === null || _d === void 0 ? void 0 : _d.delta) === null || _e === void 0 ? void 0 : _e.content) || "";
            resultContent += content;
            handleGenerate === null || handleGenerate === void 0 ? void 0 : handleGenerate(content);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_f && !_a && (_b = stream_1.return)) await _b.call(stream_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    try {
        return responseSchema
            ? responseSchema.parse(JSON.parse(resultContent))
            : resultContent;
    }
    catch (error) {
        if (_alreadyRetryTimes < retryTimes) {
            return agent(Object.assign(Object.assign({}, props), { _alreadyRetryTimes: _alreadyRetryTimes + 1 }));
        }
        throw error;
    }
}
exports.default = agent;
