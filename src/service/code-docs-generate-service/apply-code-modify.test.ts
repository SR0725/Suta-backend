import applyCodeModify from "./apply-code-modify";

describe("applyCodeModify", () => {
  // 測試添加代碼
  test("應該正確添加代碼", () => {
    const code = "line1\nline2\nline3";
    const modify = {
      addCodes: [{ insertAfter: 1, code: "new line" }],
      modifyCodes: [],
    };
    const result = applyCodeModify(code, modify)
      .map((line) => line.text)
      .join("\n");
    expect(result).toBe("line1\nline2\nnew line\nline3");
  });

  // 測試修改代碼
  test("應該正確修改代碼", () => {
    const code = "line1\nline2\nline3\nline4";
    const modify = {
      addCodes: [],
      modifyCodes: [
        { modifyStartLine: 1, modifyEndLine: 2, code: "modified line" },
      ],
    };
    const result = applyCodeModify(code, modify)
      .map((line) => line.text)
      .join("\n");
    expect(result).toBe("line1\nmodified line\nline4");
  });

  // 測試同時添加和修改代碼
  test("應該正確同時添加和修改代碼", () => {
    const code = "line1\nline2\nline3\nline4";
    const modify = {
      addCodes: [{ insertAfter: 0, code: "new line" }],
      modifyCodes: [
        { modifyStartLine: 2, modifyEndLine: 3, code: "modified line" },
      ],
    };

    const result = applyCodeModify(code, modify)
      .map((line) => line.text)
      .join("\n");
    expect(result).toBe("line1\nnew line\nline2\nmodified line");
  });

  // 測試空輸入
  test("應該正確處理空輸入", () => {
    const code = "";
    const modify = {
      addCodes: [],
      modifyCodes: [],
    };

    const result = applyCodeModify(code, modify)
      .map((line) => line.text)
      .join("\n");
    expect(result).toBe("");
  });

  // 測試多行添加
  test("應該正確添加多行代碼", () => {
    const code = "line1\nline2";
    const modify = {
      addCodes: [{ insertAfter: 0, code: "new line1\nnew line2" }],
      modifyCodes: [],
    };

    const result = applyCodeModify(code, modify)
      .map((line) => line.text)
      .join("\n");
    expect(result).toBe("line1\nnew line1\nnew line2\nline2");
  });
});
