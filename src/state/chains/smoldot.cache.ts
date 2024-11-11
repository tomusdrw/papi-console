import { cyclingLocalCache } from "@/utils/cyclingLocalCache"

export const [getCachedSmoldotDb, setCachedSmoldotDb] =
  cyclingLocalCache("smoldot-db")
