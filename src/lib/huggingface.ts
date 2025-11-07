import { InferenceClient } from '@huggingface/inference';

export const hfClient = new InferenceClient(process.env.HF_TOKEN);
