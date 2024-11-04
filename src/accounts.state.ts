import { state } from "@react-rxjs/core"
import { combineKeys, createKeyedSignal } from "@react-rxjs/utils"
import {
  connectInjectedExtension,
  getInjectedExtensions,
  InjectedExtension,
  InjectedPolkadotAccount,
} from "polkadot-api/pjs-signer"
import {
  defer,
  EMPTY,
  exhaustMap,
  map,
  merge,
  mergeMap,
  Observable,
  of,
  startWith,
  tap,
  timer,
} from "rxjs"

const availableExtensions$ = state(
  defer(() =>
    timer(100, 500).pipe(
      map(getInjectedExtensions),
      startWith(getInjectedExtensions()),
    ),
  ),
  [],
)

const [toggleExtension$, onTogleExtension] = createKeyedSignal<string>()
export { onTogleExtension }

export const enum ConnectStatus {
  Connecting,
  Disconnected,
  Connected,
}
export type ExtensionState =
  | {
      type: ConnectStatus.Disconnected
    }
  | { type: ConnectStatus.Connecting }
  | { type: ConnectStatus.Connected; value: InjectedExtension }

const extension$ = state(
  (name: string): Observable<ExtensionState> => {
    const storageKey = `extension-${name}`
    const isInStorage = localStorage.hasOwnProperty(storageKey)

    const connect$ = defer(() =>
      connectInjectedExtension(name)
        .then((value) => ({
          type: ConnectStatus.Connected as const,
          value,
        }))
        .catch(() => ({ type: ConnectStatus.Disconnected as const })),
    ).pipe(startWith({ type: ConnectStatus.Connecting as const }))

    const init$ = isInStorage ? of() : EMPTY

    let state: ExtensionState = { type: ConnectStatus.Disconnected }
    return merge(
      init$,
      toggleExtension$(name).pipe(
        exhaustMap(() =>
          state.type === ConnectStatus.Disconnected
            ? connect$
            : of({ type: ConnectStatus.Disconnected as const }),
        ),
        tap(({ type }) => {
          if (type === ConnectStatus.Disconnected)
            localStorage.removeItem(storageKey)
          else if (type === ConnectStatus.Connected)
            localStorage.setItem(storageKey, "")
        }),
      ),
    )
  },
  { type: ConnectStatus.Disconnected as const },
)

const extensionAccounts$ = state((name: string) =>
  extension$(name).pipe(
    mergeMap((x) => {
      if (x.type !== ConnectStatus.Connected) return EMPTY
      return new Observable<InjectedPolkadotAccount[]>((observer) =>
        x.value.subscribe((accounts) => {
          observer.next(accounts)
        }),
      )
    }),
  ),
)

export const extensions$ = combineKeys(availableExtensions$, extension$)
// extensions$.subscribe()

export const accountsByExntesion$ = combineKeys(
  availableExtensions$,
  extensionAccounts$,
)
// accountsByExntesion$.subscribe()
