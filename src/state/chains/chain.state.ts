import { cyclingLocalCache } from "@/utils/cyclingLocalCache"
import { getDynamicBuilder, getLookupFn } from "@polkadot-api/metadata-builders"
import { getObservableClient } from "@polkadot-api/observable-client"
import { decAnyMetadata } from "@polkadot-api/substrate-bindings"
import { createClient as createSubstrateClient } from "@polkadot-api/substrate-client"
import { toHex } from "@polkadot-api/utils"
import { sinkSuspense, state, SUSPENSE } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { createClient } from "polkadot-api"
import {
  catchError,
  concat,
  EMPTY,
  filter,
  finalize,
  map,
  NEVER,
  of,
  startWith,
  switchMap,
  tap,
} from "rxjs"
import { defaultNetwork, Network } from "./networks"
import {
  createSmoldotSource,
  getSmoldotProvider,
  SmoldotSource,
  RelayChain,
  relayChains,
} from "./smoldot"
import {
  createWebsocketSource,
  getWebsocketProvider,
  WebsocketSource,
} from "./websocket"
import { setCachedSmoldotDb } from "./smoldot.cache"

export type ChainSource = WebsocketSource | SmoldotSource

export type SelectedChain = {
  network: Network
  endpoint: string
}
export const getChainSource = ({
  endpoint,
  network: { id, relayChain },
}: SelectedChain) =>
  endpoint === "light-client"
    ? createSmoldotSource(id, relayChain)
    : createWebsocketSource(id, endpoint)
export const getProvider = (source: ChainSource) =>
  source.type === "websocket"
    ? getWebsocketProvider(source)
    : getSmoldotProvider(source)

export const [selectedChainChanged$, onChangeChain] =
  createSignal<SelectedChain>()
export const selectedChain$ = state<SelectedChain>(selectedChainChanged$, {
  network: defaultNetwork,
  endpoint: "light-client",
})

const selectedSource$ = selectedChain$.pipe(switchMap(getChainSource))

export const chainClient$ = state(
  selectedSource$.pipe(
    map((src) => [src.id, getProvider(src)] as const),
    switchMap(([id, provider], i) => {
      const substrateClient = createSubstrateClient(provider)
      const observableClient = getObservableClient(substrateClient)
      const chainHead = observableClient.chainHead$(2)
      const client = createClient(provider)
      return concat(
        i === 0 ? EMPTY : of(SUSPENSE),
        of({ id, client, substrateClient, observableClient, chainHead }),
        NEVER,
      ).pipe(
        finalize(() => {
          chainHead.unfollow()
          client.destroy()
          observableClient.destroy()
        }),
      )
    }),
    sinkSuspense(),
  ),
)
export const chainHead$ = state(
  chainClient$.pipe(map(({ chainHead }) => chainHead)),
)

export const unsafeApi$ = chainClient$.pipeState(
  map(({ client }) => client.getUnsafeApi()),
)

export const uncachedRuntimeCtx$ = chainClient$.pipeState(
  switchMap(({ chainHead }) => chainHead.runtime$),
  filter((v) => !!v),
)

const [getCachedMetadata, setCachedMetadata] =
  cyclingLocalCache("metadata-cache")
export const runtimeCtx$ = chainClient$.pipeState(
  switchMap(({ id }) =>
    getCachedMetadata(id).then((cached) => ({ id, cached })),
  ),
  switchMap(({ id, cached }) => {
    const realCtx$ = uncachedRuntimeCtx$.pipe(
      tap((v) => {
        setCachedMetadata(id, toHex(v.metadataRaw))
      }),
    )

    if (cached) {
      const metadata = decAnyMetadata(cached)
      const lookup = getLookupFn(metadata.metadata.value as any)
      const dynamicBuilder = getDynamicBuilder(lookup)

      return realCtx$.pipe(
        startWith({
          lookup,
          dynamicBuilder,
        }),
      )
    }
    return realCtx$
  }),
)

export const lookup$ = runtimeCtx$.pipeState(map((ctx) => ctx.lookup))
export const metadata$ = lookup$.pipeState(map((lookup) => lookup.metadata))
export const dynamicBuilder$ = runtimeCtx$.pipeState(
  map((ctx) => ctx.dynamicBuilder),
)

export const persistSyncState$ = chainClient$.pipe(
  switchMap(({ id, client }) => {
    if (!relayChains.includes(id as RelayChain)) return EMPTY

    return uncachedRuntimeCtx$.pipe(
      switchMap(() =>
        client._request<string, []>("chainHead_unstable_finalizedDatabase", []),
      ),
      catchError(() => EMPTY),
      filter((v) => !!v),
      map((db) => ({
        id,
        db,
      })),
    )
  }),
  tap(({ id, db }) => setCachedSmoldotDb(id, db)),
)

export { networkCategories, type Network } from "./networks"
