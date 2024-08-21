export interface CodeDocs {
  id: string;
  originalCode: string;
  language: string;
  title: string;
  description: string;
  estimatedReadMinutes: number;
  illustration: string | null;
  cards: (SectionCard | CodeStepCard)[];
  llmHistoryList: LLMHistory[];
  isGenerating: boolean;
}

export interface LLMHistory {
  id: string;
  nodeType: string;
  response: string;
  targetCardId?: string;
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
  description: string;
  conclusion: string | null;
  codeLines: CodeLine[];
  preview: CodePreview | null;
}

export interface CodeLine {
  text: string;
  isAdded?: boolean;
  isModified?: boolean;
}

interface CodePreview {
  type: "html";
  html: string;
}
