import { openfgaClient } from '@/lib/authz/clients';
import { buildOrganizationMemberTuples } from '@/lib/authz/tuple-factory';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import z from 'zod';

const ZOrgMemberInput = z.object({
  id: z.string(),
  orgId: z.string(),
  userId: z.string(),
  role: z.enum(['ORG_MEMBER', 'ORG_ADMIN', 'ORG_OWNER']),
});

const ZFgaJobPayload = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('org_member_leave'), member: ZOrgMemberInput }),
  z.object({ kind: z.literal('org_member_add'), member: ZOrgMemberInput }),
  z.object({ kind: z.literal('org_member_remove'), member: ZOrgMemberInput }),
  z.object({
    kind: z.literal('org_member_assign'),
    oldMember: ZOrgMemberInput,
    newMember: ZOrgMemberInput,
  }),
]);

type FgaJobPayload = z.infer<typeof ZFgaJobPayload>;

export const enqueueFgaJob = async (tx: Prisma.TransactionClient, payload: FgaJobPayload) => {
  const parsed = ZFgaJobPayload.parse(payload);
  return await tx.authzOutbox.create({ data: { type: 'OPENFGA', payload: parsed } });
};

const MAX_ATTEMPTS = 10;
const backoffMs = (a: number) => Math.min(5 * 60_000, 1000 * 2 ** a);
export const processFgaJob = async (jobId: string, client = prisma) => {
  const claimed = await client.authzOutbox.updateMany({
    where: { id: jobId, status: 'PENDING' },
    data: { status: 'PROCESSING', attempts: { increment: 1 } },
  });
  if (claimed.count === 0) return;

  const job = await client.authzOutbox.findUnique({ where: { id: jobId } });
  if (!job) return;

  try {
    const payload = ZFgaJobPayload.parse(job.payload);

    switch (payload.kind) {
      case 'org_member_leave':
      case 'org_member_remove': {
        await openfgaClient.deleteTuples(buildOrganizationMemberTuples(payload.member));
        break;
      }
      case 'org_member_add': {
        await openfgaClient.writeTuples(buildOrganizationMemberTuples(payload.member));
        break;
      }
      case 'org_member_assign': {
        const oldTuples = buildOrganizationMemberTuples(payload.oldMember);
        const newTuples = buildOrganizationMemberTuples(payload.newMember);
        await openfgaClient.write({ writes: newTuples, deletes: oldTuples });
        break;
      }
    }

    await client.authzOutbox.update({ where: { id: jobId }, data: { status: 'DONE' } });
  } catch (err) {
    const attempts = job.attempts ?? 0;
    const shouldFail = attempts >= MAX_ATTEMPTS;

    await client.authzOutbox.update({
      where: { id: jobId },
      data: {
        status: shouldFail ? 'FAILED' : 'PENDING',
        nextRunAt: shouldFail ? job.nextRunAt : new Date(Date.now() + backoffMs(attempts)),
        lastError: String((err as any)?.message ?? err).slice(0, 2000),
      },
    });

    if (shouldFail) throw err;
  }
};
