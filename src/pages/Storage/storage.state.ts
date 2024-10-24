import { state } from "@react-rxjs/core"
import {
  createKeyedSignal,
  createSignal,
  partitionByKey,
  toKeySet,
} from "@react-rxjs/utils"
import { map, Observable, startWith, switchMap, takeUntil } from "rxjs"
import { v4 as uuid } from "uuid"

export type StorageMetadataEntry = {
  pallet: string
  entry: string
  key: number[]
  value: number
}

export const [entryChange$, setSelectedEntry] =
  createSignal<StorageMetadataEntry | null>()
export const selectedEntry$ = state(entryChange$, null)

export const [newStorageSubscription$, addStorageSubscription] = createSignal<{
  name: string
  type: number
  single: boolean
  stream: Observable<unknown>
}>()
export const [removeStorageSubscription$, removeStorageSubscription] =
  createKeyedSignal<string>()

export type StorageSubscription = {
  name: string
  type: number
  single: boolean
} & ({ result: unknown } | {})
const [getStorageSubscription$, storageSubscriptionKeyChange$] = partitionByKey(
  newStorageSubscription$,
  () => uuid(),
  (src$, id) =>
    src$.pipe(
      switchMap(
        ({ stream, ...props }): Observable<StorageSubscription> =>
          stream.pipe(
            map((result) => ({
              ...props,
              result,
            })),
            startWith(props),
          ),
      ),
      takeUntil(removeStorageSubscription$(id)),
    ),
)

export const storageSubscriptionKeys$ = state(
  storageSubscriptionKeyChange$.pipe(
    toKeySet(),
    map((keys) => [...keys].reverse()),
  ),
  [],
)

export const storageSubscription$ = state(
  (key: string) => getStorageSubscription$(key),
  null,
)
