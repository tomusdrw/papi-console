import { chainClient$ } from "@/chain.state"
import { state } from "@react-rxjs/core"
import { combineKeys, createSignal, partitionByKey } from "@react-rxjs/utils"
import { HexString, InvalidTxError, TxBroadcastEvent } from "polkadot-api"
import {
  catchError,
  mergeMap,
  Observable,
  of,
  skip,
  takeUntil,
  tap,
  withLatestFrom,
} from "rxjs"

const [signedTx$, onNexTx] = createSignal<HexString>()
export { onNexTx }

const transactions$ = signedTx$.pipe(
  withLatestFrom(chainClient$),
  mergeMap(([tx, { client }]) => {
    const submitAndWatch = client.submitAndWatch as (
      tx: HexString,
      at: string,
      withSigned: boolean,
    ) => Observable<TxBroadcastEvent>

    let txHash: string = ""
    return submitAndWatch(tx, "finalized", true).pipe(
      tap((e) => {
        txHash = e.txHash
      }),
      catchError((err) =>
        of({
          type:
            err instanceof InvalidTxError
              ? ("invalid" as const)
              : ("error" as const),
          txHash,
          value: err,
        }),
      ),
    )
  }),
)

const [tx$, txKeys$] = partitionByKey(
  transactions$,
  (x) => x.txHash,
  (x) => x.pipe(takeUntil(chainClient$.pipe(skip(1)))),
)

export const grouppedTransactions$ = state(combineKeys(txKeys$, tx$))
export const onGoingEvents = new Set([
  "signed",
  "broadcasted",
  "txBestBlocksState",
])
