import { state } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"

export type StorageMetadataEntry = {
  key: number[]
  value: number
}

export const [entryChange$, setSelectedEntry] =
  createSignal<StorageMetadataEntry | null>()
export const selectedEntry$ = state(entryChange$, null)
