export interface AccountApiKey {
  accountEmail: string; // 一隻帳號只存在一個 api key，所以用 email 來當作 id
  apiKey: string;
  service: string;
  createdAt: Date;
  updatedAt: Date;
}
