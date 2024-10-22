import { NOTIN } from "@codec-components"

export const withDefault: <T>(value: T | NOTIN, fallback: T) => T = (
  value,
  fallback,
) => (value === NOTIN ? fallback : value)
