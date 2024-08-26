export interface Account {
  email: string;
  name: string;
  picture: string;
  lastLoginAt: Date;
  codeDocsGenerateUsage?: {
    lastGeneratedAt: Date;
    thisDayGeneratedCount: number;
  };
}
