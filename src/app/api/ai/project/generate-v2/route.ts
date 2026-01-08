// import { NextResponse } from 'next/server';
// import { ZGenTasksInput, DEFAULT_TYPES } from '@/lib/pm/schemas';
// import { getPMGraph } from '@/lib/pm/graph';
// import { getCache, setCache } from '@/lib/pm/cache';
// import { isGemini429, retryAfterSecondsFromError } from '@/lib/pm/retry';

// export const runtime = 'nodejs';

// function cacheKey(input: any) {
//   // đủ tốt cho dev/prod basic; nếu muốn mạnh hơn: hash sha256
//   return JSON.stringify(input);
// }

// export async function POST(req: Request) {
//   const runId = crypto.randomUUID();

//   try {
//     const body = await req.json().catch(() => ({}));
//     const input = ZGenTasksInput.parse(body);
//     const types = input.types?.length ? input.types : DEFAULT_TYPES;

//     const key = cacheKey({ ...input, types });
//     const cached = getCache<any>(key);
//     if (cached) {
//       return NextResponse.json({ ...cached, meta: { ...cached.meta, cached: true } });
//     }

//     const graph = getPMGraph();

//     const finalState = await graph.invoke({
//       runId,
//       lastNode: 'START',
//       trace: [],

//       prompt: input.prompt,
//       types,
//       maxTasks: input.maxTasks,
//       maxSubTasks: input.maxSubTasks,
//       maxDepth: input.maxDepth,
//       maxFixAttempts: input.maxFixAttempts,

//       issues: [],
//       needsFix: false,
//       reviewNotes: [],
//       fixAttempts: 0,
//     });

//     const payload = {
//       issues: finalState.issues,
//       trace: finalState.trace,
//       meta: {
//         runId,
//         needsFix: finalState.needsFix,
//         fixAttempts: finalState.fixAttempts,
//         reviewNotes: finalState.reviewNotes,
//         cached: false,
//         model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash-lite',
//       },
//     };

//     // cache 10 phút (test curl liên tục đỡ tốn quota)
//     setCache(key, payload, 10 * 60 * 1000);

//     return NextResponse.json(payload, { status: 200 });
//   } catch (err: any) {
//     if (isGemini429(err)) {
//       const retryAfter = retryAfterSecondsFromError(err) ?? 30;
//       return NextResponse.json(
//         { error: String(err?.message ?? err), meta: { runId } },
//         { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfter)) } },
//       );
//     }

//     const msg = String(err?.message ?? err);
//     console.error(`[${runId}] [generate-v2] error:`, msg);
//     return NextResponse.json({ error: msg, meta: { runId } }, { status: 500 });
//   }
// }
