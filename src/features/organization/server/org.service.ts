import { prisma } from '@/lib/prisma';
import { accessibleOrgs, allowedOrgPerms, ensureCan } from '../utils/authz';
import { ZOrgItem } from '@/contracts/organizations/organization.query';
import { ORG_ACTIONS } from '@/contracts/organizations/organization';
import { genOrgId } from '../utils/id';
import { OrgCreateInput } from '@/contracts/organizations/organization.input';
import { Prisma } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';
import { buildOrganizationTuples } from '@/lib/authz/tuple-factory';
import { openfgaClient } from '@/lib/authz/clients';
import { OrgError } from '@/lib/http/errors';

const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
type OrgContext = { actorId: string };

const buildOrgLogoUrl = <O extends { logo: string | null }, I extends O | O[]>(org: I): I => {
  const buildURL = (logo: string | null) => (logo ? `/api/avatar/${logo}` : null); // FIXME: gen url use cdn or s3
  if (Array.isArray(org)) return org.map((o) => ({ ...o, logo: buildURL(o.logo) })) as I;
  return { ...org, logo: buildURL(org.logo) } as I;
};

export const getOrg = async (input: { id: string; by?: 'id' | 'slug' }, ctx: OrgContext) => {
  const { id, by = 'id' } = input;
  const where = by === 'id' ? { id } : { slug: id };
  const org = await prisma.organization.findUnique({ where, include: { owner: true } });
  if (!org) throw new OrgError('ORG_NOT_FOUND', 'Organization not found');
  await ensureCan('read', { kind: 'org', id: org.id, attr: { orgId: org.id } }, ctx);
  const orgWithLogo = buildOrgLogoUrl(org);

  // == load _me
  const actor = await prisma.orgMember.findUnique({
    where: { orgId_userId: { orgId: org.id, userId: ctx.actorId } },
  });

  const perms = await allowedOrgPerms(
    ctx,
    { kind: 'org', id: org.id, attr: { orgId: org.id } },
    Array.from(ORG_ACTIONS),
  );
  const _me = { role: actor?.role ?? null, perms };

  // =======
  return ZOrgItem.parse({ ...orgWithLogo, _me });
};

export const listOrgs = async (input: null, ctx: OrgContext) => {
  // list orgs allow view
  const canView = await accessibleOrgs({ action: 'read' }, ctx);
  if (canView.length === 0) return { data: [], meta: { total: 0 } };

  const where = { id: { in: canView } };
  const all = await prisma.organization.findMany({
    where,
    include: { owner: true, members: { where: { userId: ctx.actorId } } },
  });
  const total = await prisma.organization.count({ where });
  // =======
  const withLogos = buildOrgLogoUrl(all);

  // _me
  // load perms
  const actors = await prisma.orgMember.findMany({
    where: { orgId: { in: withLogos.map((o) => o.id) }, userId: ctx.actorId },
  });
  const actorsMap = new Map(actors.map((a) => [a.orgId, a]));
  const orgItems = withLogos.map((org) => {
    const actor = actorsMap.get(org.id);
    const role = actor?.role ?? null;
    return ZOrgItem.parse({ ...org, _me: { role } });
  });
  return { data: orgItems, meta: { total } };
};

export const createOrg = async (input: OrgCreateInput, context: { actorId: string }) => {
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
    const slug = await tx.organization.findUnique({ where: { slug: org.slug } });
    if (slug) throw new OrgError('ORG_CONFLICT', 'Organization slug already exists');

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

  return result;
};

export const deleteOrg = async (orgId: string, ctx: OrgContext) => {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new OrgError('ORG_NOT_FOUND', 'Organization not found');
  await ensureCan('delete', { kind: 'org', id: orgId, attr: { orgId: org.id } }, ctx);
  await prisma.organization.delete({ where: { id: orgId } });
};

export const updateOrg = async (
  orgId: string,
  input: Partial<{ name: string; logo: string | null }>,
  ctx: OrgContext,
) => {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new OrgError('ORG_NOT_FOUND', 'Organization not found');
  await ensureCan('update', { kind: 'org', id: orgId, attr: { orgId: org.id } }, ctx);

  const updatedOrg = await prisma.organization.update({
    where: { id: orgId },
    data: {
      name: input.name ?? undefined,
      logo: input.logo !== undefined ? input.logo : undefined,
    },
    include: { owner: true },
  });
  return ZOrgItem.parse(buildOrgLogoUrl(updatedOrg));
};
