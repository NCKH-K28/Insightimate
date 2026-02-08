import { hash, compare } from 'bcryptjs';

export const hashPassword = async (password: string) => hash(password, 12);
export const verifyPassword = async (password: string, hashed: string) => compare(password, hashed);
