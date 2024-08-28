export interface CodeDocs {
  id: string;
  // 創建者
  creatorEmail: string;
  // 原始碼
  originalCode: string;
  // 原始碼語言
  language: string;
  title: string;
  description: string;
  // 預估的閱讀時間
  estimatedReadMinutes: number;
  // 文章插圖
  illustration: string | null;
  cards: (SectionCard | CodeStepCard)[];
  tags: string[];
  // LLM 對話紀錄
  llmHistoryList: LLMHistory[];
  // 該文章是否正在生成
  isGenerating: boolean;
  // 創建時間
  createdAt: Date;
}

/**
 * 單次對話歷史紀錄
 */
export interface LLMHistory {
  id: string;
  // 該歷史對話是由哪一個 node 產生的
  nodeType: string;
  // 當下使用的 prompt
  prompt: string;
  // 使用者輸入的內容
  input: string;
  // LLM 的回應
  response: string;
  // 如果該歷史紀錄是為了某張卡片的創造、修改，此會對應到卡片 id
  targetCardId?: string;
  // 如果該歷史紀錄是基於教學步驟的創造、修改，此會對應到步驟 index
  stepIndex?: number;
}

interface Card {
  type: "section" | "codeStep";
  id: string;
}

interface SectionCard extends Card {
  type: "section";
  title: string;
  description: string;
}

export interface CodeStepCard extends Card {
  type: "codeStep";
  stepIndex: number;
  description: string;
  conclusion: string | null;
  codeLines: CodeLine[];
  preview: CodePreview | null;
}

export interface CodeLine {
  text: string;
  added?: boolean;
  removed?: boolean;
}

interface CodePreview {
  type: "html";
  html: string;
}
