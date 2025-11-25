// Đề xuất danh sách issues (task) từ mô tả
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const model = new ChatGoogleGenerativeAI({ model: 'gemini-1.5-flash', apiKey, temperature: 0 });

const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey });

const retriever = (prompt: string) => {
  // return fake data for now
  return ['Issue 1: Fix login bug', 'Issue 2: Improve UI design', 'Issue 3: Update dependencies'];
};

const generateTasks = async (prompt: string): Promise<string[]> => {
  const retrievedIssues = retriever(prompt);

  const template = '';

  const chain = RunnableSequence.from([PromptTemplate.fromTemplate(template), model]);

  return [];
};
