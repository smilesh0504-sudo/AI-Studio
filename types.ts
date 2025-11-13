export type Page = 'main' | 'signup' | 'explore' | 'myinfo' | 'upload' | 'result' | 'add' | 'history';

export interface User {
  id: string;
  nickname: string;
}

export type Category = '식비' | '쇼핑' | '주거' | '교통비' | '문화/여가' | '생활비' | '알 수 없음';

export interface Transaction {
  category: string;
  item: string;
  totalSpent: number;
  reclassified: Category;
}

export interface Persona {
  name: string;
  iconPrompt: string;
  color: string;
  description: string;
  comment: string;
}

export type AnalysisResult = {
  [key in Category]?: number;
};

export interface AnalysisVersion {
  id: string;
  createdAt: string;
  data: Transaction[];
  persona: string | null;
  analysis: AnalysisResult | null;
}
