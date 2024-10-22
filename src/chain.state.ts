import { chainSpec } from "@polkadot-api/known-chains/polkadot"
import { withPolkadotSdkCompat } from "@polkadot-api/polkadot-sdk-compat"
import { getSmProvider } from "@polkadot-api/sm-provider"
import { Client } from "@polkadot-api/smoldot"
import { startFromWorker } from "@polkadot-api/smoldot/from-worker"
import SmWorker from "@polkadot-api/smoldot/worker?worker"
import {
  CodecType,
  decAnyMetadata,
  metadata as metadataCodec,
  u32,
  V14,
  V15,
  Vector,
} from "@polkadot-api/substrate-bindings"
import { createClient } from "@polkadot-api/substrate-client"
import { toHex } from "@polkadot-api/utils"
import { getWsProvider } from "@polkadot-api/ws-provider/web"
import { from, map, of, shareReplay, startWith, switchMap, tap } from "rxjs"

export type ChainSource = { id: string } & (
  | {
      type: "chainSpec"
      value: {
        chainSpec: string
        relayChain?: string
      }
    }
  | {
      type: "websocket"
      value: string
    }
)

const selectedSource$ = of<ChainSource>({
  id: "polkadot",
  type: "chainSpec",
  value: { chainSpec },
})

type AnyMetadata = CodecType<typeof metadataCodec>

export const metadata$ = selectedSource$.pipe(
  switchMap((src) => {
    const metadata = from(getMetadata(src)).pipe(
      tap((v) => {
        localStorage.setItem(`metadata-${src.id}`, toHex(metadataCodec.enc(v)))
      }),
    )
    const cached = localStorage.getItem(`metadata-${src.id}`)
    if (cached) {
      return from(metadata).pipe(startWith(decAnyMetadata(cached)))
    }
    return from(metadata)
  }),
  map((v): V14 | V15 => {
    const metadata = v.metadata
    if (metadata.tag === "v14" || metadata.tag === "v15") {
      return metadata.value
    }
    throw new Error("Incompatible metadata")
  }),
  shareReplay(1),
)

const u32ListDecoder = Vector(u32).dec
async function getMetadata(source: ChainSource): Promise<AnyMetadata> {
  const provider = getProvider(source)
  const client = createClient(provider)

  console.log("loading metadata")
  const metadata = await new Promise<AnyMetadata>((resolve, reject) => {
    const chainHead = client.chainHead(
      true,
      async (evt) => {
        if (evt.type === "newBlock") {
          chainHead.unpin([evt.blockHash])
        }
        if (evt.type !== "initialized") {
          return
        }

        const hash = evt.finalizedBlockHashes[0]
        const versionsResponse = await chainHead.call(
          hash,
          "Metadata_metadata_versions",
          "",
        )
        const versions = u32ListDecoder(versionsResponse)
        const metadataResponse = await (versions.includes(15)
          ? chainHead.call(
              hash,
              "Metadata_metadata_at_version",
              toHex(u32.enc(15)),
            )
          : chainHead.call(hash, "Metadata_metadata", ""))
        resolve(decAnyMetadata(metadataResponse))
      },
      reject,
    )
  })

  console.log("received", metadata)
  client.destroy()
  return metadata
}

let smoldot: Client | null = null
function getProvider(source: ChainSource) {
  if (source.type === "websocket") {
    return withPolkadotSdkCompat(getWsProvider(source.value))
  }

  if (!smoldot) {
    smoldot = startFromWorker(new SmWorker())
  }
  const chain = source.value.relayChain
    ? smoldot
        .addChain({
          chainSpec: source.value.relayChain,
        })
        .then((chain) =>
          smoldot!.addChain({
            chainSpec: source.value.chainSpec,
            potentialRelayChains: [chain],
          }),
        )
    : smoldot.addChain({
        chainSpec: source.value.chainSpec,
      })

  return getSmProvider(chain)
}
