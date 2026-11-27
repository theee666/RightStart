import data from '@/data/knowledge-index.json';
export const articleIndex = data;
export type ArticleSummary = (typeof data)[number];
