// src/lib/agents/spec-agent.ts
import { ModelMessage, generateObject, FilePart } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { ZProjectImport, ZProjectDraft } from '@/contracts/project';
import { ZJsonPatchOp } from '@/lib/jsonpatch';

// Nếu bạn có sẵn applyPatch trong codebase thì dùng cái đó.
// Ví dụ với fast-json-patch (nếu bạn dùng):
// import { applyPatch } from 'fast-json-patch';

type Context = { type: 'file' | 'text'; value: string; label: string };

const ZPatchPlan = z.object({
  spec: z
    .array(z.string())
    .default([])
    .describe('Bullet list mô tả thay đổi dự định (không bắt buộc).'),
  operations: z.array(ZJsonPatchOp),
});

const ZCheck = z.object({
  ok: z.boolean(),
  missing: z.array(z.string()).default([]),
});

function formatZodError(err: z.ZodError): string {
  return err.issues.map((i) => `- ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
}

// TODO: thay bằng apply patch implementation bạn đang dùng.
function applyPatchOps<T>(
  doc: T,
  ops: unknown[],
): { ok: true; next: T } | { ok: false; error: string } {
  try {
    // ====== OPTION A: nếu bạn dùng fast-json-patch ======
    // const cloned = structuredClone(doc);
    // const res = applyPatch(cloned as any, ops as any, /*validate*/ true, /*mutateDocument*/ true);
    // return { ok: true, next: res.newDocument as T };

    // ====== OPTION B: placeholder (bắt buộc thay) ======
    // Nếu bạn có helper nội bộ: return { ok: true, next: applyJsonPatch(doc, ops) }
    throw new Error(
      'applyPatchOps chưa được implement. Hãy thay bằng fast-json-patch hoặc helper apply patch của bạn.',
    );
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}

function buildSystem(schemaText: string) {
  return `
You are "spec-agent": an AI that updates project management data using JSON Patch (RFC 6902).

You must output a patch plan:
- spec: short bullet list describing intended changes
- operations: JSON Patch operations (array)

Hard rules:
- Operations MUST be valid RFC6902 JSON Patch.
- Only modify fields allowed by the provided JSON Schema.
- Do NOT touch helper fields like "__index" (never add/replace/remove it).
- Prefer minimal operations.
- When editing issues array, use indices (e.g. /issues/0/summary) and append with "/issues/-" when adding.

Field mapping:
- tasks -> issues
- title/name -> summary

Project JSON Schema:
${schemaText}
  `.trim();
}

function buildMessages(args: {
  draft: unknown;
  instruction?: string;
  fileParts?: FilePart[];
  textContexts?: Context[];
  lastError?: string;
}): ModelMessage[] {
  const { draft, instruction, fileParts = [], textContexts = [], lastError } = args;

  const msgs: ModelMessage[] = [];

  // Nên để project data là USER để model coi là input
  msgs.push({
    role: 'user',
    content: `Current project data (JSON):\n${JSON.stringify(draft)}`,
  });

  if (textContexts.length) {
    msgs.push({
      role: 'user',
      content:
        `Additional text contexts:\n` +
        textContexts.map((c) => `- [${c.label}] ${c.value}`).join('\n'),
    });
  }

  if (fileParts.length) {
    msgs.push({ role: 'user', content: fileParts });
  }

  if (instruction?.trim()) {
    msgs.push({ role: 'user', content: `Instruction:\n${instruction}` });
  }

  if (lastError) {
    msgs.push({
      role: 'user',
      content:
        `Previous attempt failed with this error.\n` +
        `Fix the operations accordingly. Error:\n${lastError}`,
    });
  }

  return msgs;
}

async function checkSatisfaction(args: {
  instruction?: string;
  nextDraft: unknown;
  schemaText: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { instruction, nextDraft, schemaText } = args;
  if (!instruction?.trim()) return { ok: true };

  const { object } = await generateObject({
    model: google('gemini-2.5-flash'),
    temperature: 0,
    schema: ZCheck,
    system: `
You are a strict QA checker.
Given the instruction and the updated project JSON, decide if the instruction is fully satisfied.
Return:
- ok: boolean
- missing: list of unmet requirements (short)
Schema (for reference):
${schemaText}
    `.trim(),
    prompt: [
      `Instruction:\n${instruction}`,
      `Updated project JSON:\n${JSON.stringify(nextDraft)}`,
    ].join('\n\n'),
  });

  if (object.ok) return { ok: true };
  return {
    ok: false,
    error: `Instruction not satisfied. Missing:\n- ${object.missing.join('\n- ')}`,
  };
}

export async function runSpecAgent(input: {
  values?: z.infer<typeof ZProjectDraft>;
  instruction?: string;
  contexts?: Context[];
  fileParts?: FilePart[];
  maxIterations?: number;
}) {
  const maxIterations = input.maxIterations ?? 4;

  // Chuẩn hoá values như code bạn đang làm (gắn __index)
  const initial = structuredClone(input.values ?? {});
  const v: any = initial;
  if (v?.issues && Array.isArray(v.issues)) {
    v.issues = v.issues.map((iss: any, __index: number) => ({ ...iss, __index }));
  }

  const projectJSONSchema = z.toJSONSchema(ZProjectImport);
  const schemaText = JSON.stringify(projectJSONSchema);

  const textContexts = (input.contexts ?? []).filter((c) => c.type === 'text');
  const fileParts = input.fileParts ?? [];

  const draft: any = v;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxIterations; attempt++) {
    const messages = buildMessages({
      draft,
      instruction: input.instruction,
      fileParts,
      textContexts,
      lastError,
    });

    // 1) Generate patch plan + ops
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      temperature: 0.25,
      schema: ZPatchPlan,
      messages,
      system: buildSystem(schemaText),
    });

    // 2) Apply ops
    const applied = applyPatchOps(draft, object.operations);
    if (!applied.ok) {
      lastError = `Patch apply failed (attempt ${attempt}): ${applied.error}\nOps:\n${JSON.stringify(
        object.operations,
      )}`;
      continue;
    }

    // 3) Validate final document against schema
    const validated = ZProjectImport.safeParse(applied.next);
    if (!validated.success) {
      lastError =
        `Schema validation failed after applying patch (attempt ${attempt}):\n` +
        formatZodError(validated.error) +
        `\nOps:\n${JSON.stringify(object.operations)}`;
      // Cập nhật draft để model sửa trên state mới hay state cũ?
      // Ở đây giữ state cũ để model “sửa ops” thay vì chồng lỗi.
      continue;
    }

    // 4) Optional: check instruction satisfaction
    const sat = await checkSatisfaction({
      instruction: input.instruction,
      nextDraft: applied.next,
      schemaText,
    });
    if (!sat.ok) {
      lastError = `Satisfaction check failed (attempt ${attempt}): ${sat.error}`;
      // Cho phép model iterate dựa trên draft hiện tại hoặc draft mới.
      // Thường nên dựa trên draft hiện tại để ra ops đúng ngay từ đầu.
      continue;
    }

    return {
      ok: true as const,
      attempt,
      spec: object.spec,
      operations: object.operations,
      nextValues: applied.next,
    };
  }

  return {
    ok: false as const,
    attempt: maxIterations,
    error:
      `spec-agent failed after ${maxIterations} iterations.\n` + (lastError ?? 'Unknown error'),
  };
}
