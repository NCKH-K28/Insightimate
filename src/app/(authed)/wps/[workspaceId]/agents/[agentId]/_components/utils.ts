import { JSONContent } from '@tiptap/core';

export const isTiptapJSONContent = (obj: any): obj is JSONContent => {
  if (typeof obj !== 'object' || obj === null) return false;
  if (!('type' in obj) || typeof obj.type !== 'string') return false;
  if ('content' in obj && !Array.isArray(obj.content)) return false;
  if ('text' in obj && typeof obj.text !== 'string') return false;
  return true;
};
