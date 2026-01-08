import { format } from 'date-fns';
import { z } from 'zod';

export const isoString = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString() : v),
  z.iso.datetime({ offset: true }),
);

export const isoDateString = z.preprocess(
  (v) => (v instanceof Date ? format(v, 'yyyy-MM-dd') : v),
  z.iso.date(),
);

// ===== Common Query Params =====
