export const assertNever = (
  value: never,
  message = 'Unexpected value',
): never => {
  throw new Error(`${message}: ${String(value)}`);
};
