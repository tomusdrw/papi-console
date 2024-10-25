import { Binary, getSs58AddressInfo } from "@polkadot-api/substrate-bindings"
import { state } from "@react-rxjs/core"
import { combineKeys } from "@react-rxjs/utils"
import {
  connectInjectedExtension,
  getInjectedExtensions,
  InjectedPolkadotAccount,
} from "polkadot-api/pjs-signer"
import {
  concat,
  filter,
  finalize,
  from,
  fromEventPattern,
  interval,
  map,
  retry,
  startWith,
  switchMap,
  take,
  timer,
} from "rxjs"

export const getPublicKey = (address: string) => {
  const info = getSs58AddressInfo(address)
  return info.isValid ? info.publicKey : null
}
export const getAccountMapKey = (address: string) => {
  const pk = getPublicKey(address)
  return pk ? Binary.fromBytes(pk).asHex() : address
}

const extensions$ = state(
  concat(
    timer(0, 100).pipe(
      map(getInjectedExtensions),
      filter((v) => v.length > 0),
      take(1),
    ),
    interval(2000).pipe(map(getInjectedExtensions)),
  ),
  [],
)
const extensionAccounts$ = combineKeys(extensions$, (extension) =>
  from(connectInjectedExtension(extension)).pipe(
    switchMap((extension) =>
      fromEventPattern<InjectedPolkadotAccount[]>(
        extension.subscribe,
        (_, fn) => fn(),
      ).pipe(
        startWith(extension.getAccounts()),
        finalize(extension.disconnect),
      ),
    ),
    retry({
      delay: 100,
    }),
  ),
)
export const accounts$ = state(
  extensionAccounts$.pipe(
    map(
      (extensionAccounts) =>
        new Map(
          Array.from(extensionAccounts.entries()).flatMap(
            ([extension, accounts]) =>
              accounts.map((account) => [
                getAccountMapKey(account.address),
                {
                  ...account,
                  extension,
                },
              ]),
          ),
        ),
    ),
  ),
  new Map<string, InjectedPolkadotAccount & { extension: string }>(),
)

export const accountDetail$ = state(
  (account: string) =>
    accounts$.pipe(map((v) => v.get(getAccountMapKey(account)) ?? null)),
  null,
)
