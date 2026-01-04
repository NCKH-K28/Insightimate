import { OrgCreateInput, ZOrgCreateInput } from '@/contracts/organizations/organization.input';
import { ZOrgItem } from '@/contracts/organizations/organization.query';
import { openfgaClient } from '@/features/authz-v2/clients/openfga';
import { buildOrganizationTuples } from '@/features/authz-v2/tuple-factory';
import { accessibleOrgs } from '@/features/organization/utils/authz';
import { authenticatedV2, getAuthFromRequest } from '@/lib/auth/authn';
import { compose } from '@/lib/http/api-compose';
import { getZodBody, zodBodyPipe } from '@/lib/http/zod-pipes';
import { prisma } from '@/lib/prisma';
import { createId } from '@paralleldrive/cuid2';
import { Prisma } from '@prisma/client';
import uniqBy from 'lodash/uniqBy';
import { NextResponse } from 'next/server';

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

export const GET = compose(authenticatedV2, async (req) => {
  try {
    const auth = await getAuthFromRequest(req);

    // == Business Logic ==
    const result = await listOrgs(null, { actorId: auth.user.id });
    return NextResponse.json(result);
  } catch (err) {
    console.error('Error in listing orgs:', err);
    return NextResponse.json({
      error: { message: err instanceof Error ? err.message : 'Unknown error' },
    });
  }
});
const ZPOSTInput = ZOrgCreateInput.transform(orgCreateInputTransformer);
export const POST = compose(authenticatedV2, zodBodyPipe(ZPOSTInput), async (req) => {
  try {
    const auth = await getAuthFromRequest(req);
    const input = getZodBody(req, ZPOSTInput);

    // == Business Logic ==
    const result = await createOrg(input, { actorId: auth.user.id });
    return NextResponse.json(result);
  } catch (err) {
    console.error('Error in creating org:', err);
    return NextResponse.json({
      error: { message: err instanceof Error ? err.message : 'Unknown error' },
    });
  }
});
