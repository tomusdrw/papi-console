import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Loader2 } from "lucide-react"
import { combineKeys, createSignal, partitionByKey } from "@react-rxjs/utils"
import { HexString, InvalidTxError, TxBroadcastEvent } from "polkadot-api"
import { state, useStateObservable, withDefault } from "@react-rxjs/core"
import { chainClient$ } from "@/chain.state"
import {
  catchError,
  map,
  mergeMap,
  Observable,
  of,
  skip,
  takeUntil,
  tap,
  withLatestFrom,
} from "rxjs"
import { shortStr } from "@/utils"
import { CopyText } from "@/components/Copy"
import { Link } from "react-router-dom"

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
              ? ("invalid" as "invalid")
              : ("error" as "error"),
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

const grouppedTransactions$ = state(combineKeys(txKeys$, tx$))
const onGoingEvents = new Set(["signed", "broadcasted", "txBestBlocksState"])

const txsSummary$ = grouppedTransactions$.pipeState(
  map((x) => {
    const all = [...x.values()]
    const nOngoing = all.filter((x) => onGoingEvents.has(x.type)).length
    return { nTxs: all.length, nOngoing }
  }),
  withDefault({ nTxs: 0, nOngoing: 0 }),
)
txsSummary$.subscribe()

const transactionList$ = grouppedTransactions$.pipeState(
  map((x) =>
    [...x.values()].map((props) => (
      <Transaction key={props.txHash} {...props} />
    )),
  ),
  withDefault([]),
)
transactionList$.subscribe()

const Transaction: React.FC<
  TxBroadcastEvent | { type: "invalid" | "error"; value: any; txHash: string }
> = (event) => {
  const getStatus = () => {
    const { type } = event
    switch (event.type) {
      case "error":
        return <span>There was an unexpected error.</span>
      case "invalid":
        return (
          <span>
            Invalid transaction. {JSON.stringify(event.value, null, 2)}
          </span>
        )
      case "txBestBlocksState": {
        return event.found ? (
          <span>
            Transaction in{" "}
            <Link
              className="underline font-bold"
              to={`/explorer/${event.block.hash}#tx=${event.block.index}`}
            >
              best block
            </Link>
            .
          </span>
        ) : (
          <span>Transaction no longer in a best block.</span>
        )
      }
      case "signed":
      case "broadcasted":
        return <span>Transaction {type}.</span>
      default:
        return (
          <span>
            Transaction in{" "}
            <Link
              className="underline font-bold"
              to={`/explorer/${event.block.hash}#tx=${event.block.index}`}
            >
              {" "}
              finalized block
            </Link>
            .
          </span>
        )
    }
  }
  const { txHash, type } = event
  return (
    <div className="mb-4 p-3 bg-polkadot-800 rounded-lg">
      <p className="font-medium">
        {shortStr(txHash, 14)} <CopyText text={txHash} />
      </p>
      <p
        className={`text-sm ${
          onGoingEvents.has(type)
            ? "text-yellow-500"
            : type === "finalized"
              ? "text-green-500"
              : "text-red-500"
        }`}
      >
        {getStatus()}
      </p>
    </div>
  )
}

export function Transactions() {
  const [isOpen, setIsOpen] = React.useState(false)
  const { nTxs, nOngoing } = useStateObservable(txsSummary$)
  return !nTxs ? null : (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button className="fixed bottom-4 right-4 bg-polkadot-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-white hover:font-bold hover:text-polkadot-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center space-x-2">
          {nOngoing > 0 && (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span className="font-bold">{nOngoing}</span>
            </>
          )}
          <span>Transactions</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed bottom-0 border-t border-x border-polkadot-800 right-0 w-full sm:w-96 h-96 bg-polkadot-900 rounded-t-xl shadow-xl focus:outline-none">
          <div className="flex justify-between items-center p-4 border-b border-polkadot-800">
            <Dialog.Title className="text-lg font-semibold">
              Transactions
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </Dialog.Close>
          </div>
          <div className="p-4 h-[calc(100%-4rem)] overflow-y-auto">
            {transactionList$}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
