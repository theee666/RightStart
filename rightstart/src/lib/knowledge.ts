import data from '@/data/knowledge.json';
export type Article = (typeof data)[number];
export const articles = data;
