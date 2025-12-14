import { compose } from '@/lib/http/api-compose';

type Params = { sprintId: string };

export const GET = compose<Params>(async (req) => {
  const { sprintId } = req.params;
});
