// stream image from minio

import { NextResponse } from 'next/server';
import { middlewareHandler } from '@/lib/http/api-handler';
import { authenticatedV2 } from '@/lib/auth/guards';
import { getAuthFromRequest } from '@/lib/auth';
