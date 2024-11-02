export const shortStr = (input: string, preLen: number): string =>
  input.length > preLen * 2 + 2
    ? `${input.slice(0, preLen)}…${input.slice(-preLen)}`
    : input
