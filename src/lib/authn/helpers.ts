// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAuthFromRequestHono = async (c: any, _parse: boolean = true) => {
  if ('get' in c) {
    const auth = c.get('jwtPayload');
    if (!auth) throw new Error('Missing "auth" in "request"');
    return { id: auth.sub, email: auth.email, userId: auth.sub };
  } else {
    throw new Error('Context is not Hono context');
  }
};
