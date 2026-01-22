import { searchProjects, ZProjectListInput } from '@/features/projects/server/cqrs/search-projects';
import { authenticatedV2, getAuthFromRequest } from '@/lib/authn';
import { compose } from '@/lib/http/api-compose';

const ZProjectListInputStrict = ZProjectListInput.strict();
export const GET = compose(authenticatedV2, async (req, res) => {
  const auth = await getAuthFromRequest(req);
  const actorId = auth.user.id;

  const input = ZProjectListInputStrict.parse(req.query);
  const result = await searchProjects(input, { actorId });

  return res.json(result);
});
