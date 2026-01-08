// https://github.com/LuanRT/google-this
export * from './schema';
import axios, { AxiosError } from 'axios';
import { Root } from './schema';

const emailToKeys = { 'jahew90101@keevle.com': '4947c9a7899f7ef9d035259db359262cd740c15d' };

const API_KEYS = Object.values(emailToKeys);
const availableKeys = [...API_KEYS];
let instance = createInstance(availableKeys[0]);

function createInstance(key: string) {
  return axios.create({
    baseURL: 'https://google.serper.dev',
    headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
    timeout: 10000,
  });
}

async function serperSearch(input: { q: string; page?: number }): Promise<Root> {
  for (let i = 0; i < availableKeys.length; i++) {
    try {
      const res = await instance.post('/search', input);
      return res.data;
    } catch (err) {
      const error = err as AxiosError;
      if (error.response?.status === 429 || error.response?.status === 403) {
        console.warn(`⚠️ Key ${availableKeys[0]} hết hạn — thử key khác.`);
        availableKeys.shift(); // bỏ key hết hạn
        const nextKey = availableKeys[0];
        if (!nextKey) throw new Error('Tất cả API key đều hết hạn.');
        instance = createInstance(nextKey);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Không thể gọi Serper API.');
}

export const serper = { search: serperSearch };
