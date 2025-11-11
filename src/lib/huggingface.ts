import serverConfig from '@/configs/server';
import { InferenceClient } from '@huggingface/inference';

const hfConfig = serverConfig.hf;
export const hfClient = new InferenceClient(hfConfig.apiKey);
