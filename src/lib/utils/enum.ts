export const arrayToEnum = <T extends string>(arr: T[]): { [K in T]: K } => {
  const enumObj = arr.reduce(
    (acc, curr) => Object.assign(acc, { [curr]: curr }),
    {} as { [K in T]: K },
  );

  return Object.freeze(enumObj);
};
