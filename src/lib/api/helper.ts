import { AppError } from '../http/errors';
import type { AxiosError } from 'axios';
import get from 'lodash/get';

const isAxiosError = (error: unknown): error is AxiosError => {
  if (typeof error !== 'object' || error === null) return false;
  if ('isAxiosError' in error) return true;
  if ('name' in error && typeof error.name === 'string' && error.name === 'AxiosError') return true;
  return false;
};

export const getErrorMsg = (
  error: unknown,
  defaultMsg = 'An unexpected error occurred',
): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    const resErr: unknown = get(data, 'error', null);
    if (AppError.isAppError(resErr)) return resErr.message;
    return error.message || defaultMsg;
  } else if (AppError.isAppError(error)) return error.message;
  else if (error instanceof Error) return error.message || defaultMsg;
  return defaultMsg;
};

export const getApiError = (
  error: unknown,
): { status: number; message: string; code?: string } | null => {
  if (isAxiosError(error)) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    const resErr: unknown = get(data, 'error', null);
    if (AppError.isAppError(resErr)) {
      return { status, message: resErr.message, code: resErr.code };
    }
    return { status, message: error.message || 'An unexpected error occurred' };
  }
  return null;
};
