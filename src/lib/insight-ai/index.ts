import * as axios from 'axios';

type Config = {
  baseURL: string;
  timeout: number;
};

// https://nhathuyyne-requirement-analyzer-api.hf.space/
const instance = axios.default.create({
  baseURL: 'https://nhathuyyne-requirement-analyzer-api.hf.space/api',
});

const textEstimate = async (text: string) => {
  const response = await instance.post('/estimate', { text });
  return response.data;
};

const fileEstimate = async (file: File | FormData) => {
  const formData = file instanceof FormData ? file : new FormData();
  if (file instanceof File) formData.append('file', file);
  const response = await instance.post('/upload-requirements', formData);
  return response.data;
};

export const insightAI = {
  textEstimate,
  fileEstimate,
};
