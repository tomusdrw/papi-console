import {
  IdentityData,
  IdentityJudgement,
  polkadot_people,
} from "@polkadot-api/descriptors"
import { chainSpec as relayChain } from "polkadot-api/chains/polkadot"
import { chainSpec } from "polkadot-api/chains/polkadot_people"
import { localStorageSubject } from "./utils/localStorageSubject"
import { Binary, createClient, SS58String } from "polkadot-api"
import { getProvider } from "./chain.state"
import { state } from "@react-rxjs/core"
import { filter, map, merge, take, tap } from "rxjs"

interface Identity {
  displayName: string
  judgments: Array<{
    registrar: number
    judgement: IdentityJudgement["type"]
  }>
}

const cache = localStorageSubject<Record<string, Identity>>(
  "identity-cache",
  JSON,
  {},
)

const client = createClient(
  getProvider({
    id: "polkadot_people",
    type: "chainSpec",
    value: {
      chainSpec,
      relayChain,
    },
  }),
)
const typedApi = client.getTypedApi(polkadot_people)

export const identity$ = state((address: SS58String) => {
  const cached$ = cache.stream$.pipe(
    take(1),
    map((v) => v[address]),
    filter((v) => !!v),
  )
  const chain$ = typedApi.query.Identity.IdentityOf.watchValue(address).pipe(
    map((res): Identity | null =>
      res
        ? {
            displayName: readIdentityData(res[0].info.display).asText(),
            judgments: res[0].judgements.map(([registrar, judgement]) => ({
              registrar,
              judgement: judgement.type,
            })),
          }
        : null,
    ),
    tap((v) =>
      cache.setValue((c) => {
        if (v) {
          return { ...c, [address]: v }
        } else {
          delete c[address]
          return c
        }
      }),
    ),
  )
  return merge(cached$, chain$)
}, null)

const readIdentityData = (identityData: IdentityData): Binary => {
  if (identityData.type === "None" || identityData.type === "Raw0")
    return Binary.fromHex("")
  if (identityData.type === "Raw1")
    return Binary.fromBytes(new Uint8Array(identityData.value))
  return identityData.value
}
