/**
 * Strip trailing null bytes from a string.
 * Commonly needed when decoding fixed-length ABI byte arrays that
 * are zero-padded on the right.
 */
export const prepareString = (str: string): string => {
  const index = str.indexOf("\x00");
  if (index > 0) {
    return str.slice(0, index);
  }
  return str;
};
