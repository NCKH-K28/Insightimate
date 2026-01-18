import { OrgCreateInput, ZOrgCreateInput } from '@/contracts/organizations/organization.input';
import { ZOrgItem } from '@/contracts/organizations/organization.query';
import { openfgaClient } from '@/features/authz-v2/clients/openfga';
import { buildOrganizationTuples } from '@/features/authz-v2/tuple-factory';
import { accessibleOrgs } from '@/features/organization/utils/authz';
import { authenticatedHono, getAuthFromRequestHono } from '@/lib/auth/authn';
import { appAPIV3 } from '@/lib/hono';
import { prisma } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import { Prisma } from '@prisma/client';
import uniqBy from 'lodash/uniqBy';

// transformers
const orgCreateInputTransformer = (arg: OrgCreateInput): OrgCreateInput => {
  const invitees = arg.invitees?.map((inv) => ({
    email: inv.email.trim().toLowerCase(),
    role: inv.role,
  }));
  const uniqueInvitees = invitees ? uniqBy(invitees, 'email') : [];
  return { ...arg, invitees: uniqueInvitees };
};

const genOrgId = () => `org_${createId()}`;

const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const createOrg = async (input: OrgCreateInput, context: { actorId: string }) => {
  const { invitees: inviteesInput = [], ...orgInput } = input;
  const org = { ...orgInput, id: genOrgId(), ownerId: context.actorId, settings: {} };

  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS);
  const invitees: Prisma.OrgInvitationCreateManyInput[] = inviteesInput.map((inv) => ({
    ...inv,
    orgId: org.id,
    expiresAt,
    token: createId(),
  }));

  const result = await prisma.$transaction(async (tx) => {
    const newOrg = await tx.organization.create({
      include: { owner: true, members: true },
      data: { ...org, members: { create: { userId: context.actorId, role: 'ORG_OWNER' } } },
    });
    if (invitees.length > 0) await tx.orgInvitation.createMany({ data: invitees });
    const orgItem = ZOrgItem.parse(newOrg);

    // ==== Build Open FGA Tuples
    const tuples = buildOrganizationTuples(newOrg);
    await openfgaClient.writeTuples(tuples);

    return orgItem;
  });

  // send invitations
  // FIXME: send invitation emails here

  return result;
};

const listOrgs = async (input: null, context: { actorId: string }) => {
  const accessibleOrgIds = await accessibleOrgs(
    { action: 'can_view' },
    { actorId: context.actorId },
  );

  if (accessibleOrgIds.length === 0) return { data: [], meta: { total: 0 } };

  const where = { id: { in: accessibleOrgIds } };
  const all = await prisma.organization.findMany({
    where,
    include: { owner: true, members: { where: { userId: context.actorId } } },
  });

  const total = await prisma.organization.count({ where });

  const orgItems = all.map((org) => {
    const role = org.members.length > 0 ? org.members[0].role : null;
    const logo = org.logo ? `/api/avatar/${org.logo}` : null;
    return ZOrgItem.parse({ ...org, logo, _me: { role } });
  });
  return { data: orgItems, meta: { total } };
};

import { zValidator } from '@hono/zod-validator';
import { handle } from 'hono/vercel';

appAPIV3.get('/orgs', authenticatedHono, async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const result = await listOrgs(null, { actorId: auth.id });
  return c.json(result);
});

const ZPOSTInput = ZOrgCreateInput.transform(orgCreateInputTransformer);
appAPIV3.post('/orgs', authenticatedHono, zValidator('json', ZPOSTInput), async (c) => {
  const auth = await getAuthFromRequestHono(c);
  const input = c.req.valid('json');
  const result = await createOrg(input, { actorId: auth.id });
  return c.json(result);
});

export const GET = handle(appAPIV3);
export const POST = handle(appAPIV3);
