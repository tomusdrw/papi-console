import { state, useStateObservable } from "@react-rxjs/core"
import { combineKeys } from "@react-rxjs/utils"
import { filter, map, takeWhile } from "rxjs"
import { twMerge } from "tailwind-merge"
import {
  blockInfo$,
  BlockState,
  finalized$,
  recordedBlocks$,
} from "./block.state"
import { MAX_LENGTH } from "./BlockTable"

export const Events = () => {
  const events = useStateObservable(recentEvents$)
  const finalized = useStateObservable(finalized$)

  const firstFinalized = finalized
    ? events.find((evt) => evt.number <= finalized?.number)
    : events[0]

  return (
    <div className="w-full p-2 border border-polkadot-800 rounded">
      <h2 className="font-bold p-2 border-b border-slate-400 mb-2">
        Recent Events
      </h2>
      <table className="w-full">
        <tbody>
          {events.map((evt) => (
            <tr
              key={`${evt.hash}-${evt.index}`}
              className={twMerge(
                evt === firstFinalized ? "border-t border-white" : "",
                finalized && evt.number <= finalized.number
                  ? "bg-polkadot-900"
                  : "",
              )}
            >
              <td className="p-2 w-full">{`${evt.event.type}.${evt.event.value.type}`}</td>
              <td className="p-2 whitespace-nowrap">{`${evt.number}-${evt.extrinsicNumber}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {events.length === 0 ? (
        <div className="text-slate-400">(No events yet)</div>
      ) : null}
    </div>
  )
}

const blackList = new Set([
  "System.*",
  "Balances.Deposit",
  "Treasury.Deposit",
  "ParaInclusion.*",
  "Balances.Withdraw",
  "Balances.Endowed",
  "Balances.Locked",
  "TransactionPayment.TransactionFeePaid",
  "Staking.Rewarded",
])
const recentEvents$ = state(
  combineKeys(recordedBlocks$, (key) =>
    blockInfo$(key).pipe(
      map((block) => ({
        status: block.status,
        hash: block.hash,
        number: block.number,
        events: block.events
          ?.filter((evt) => evt.phase.type === "ApplyExtrinsic")
          .filter(
            (evt) =>
              !blackList.has(`${evt.event.type}.*`) &&
              !blackList.has(`${evt.event.type}.${evt.event.value.type}`),
          )
          .map((evt) => ({
            event: evt.event,
            extrinsicNumber: (evt.phase as any).value as number,
          })),
      })),
      takeWhile(
        (r) =>
          (r.status !== BlockState.Finalized &&
            r.status !== BlockState.Pruned) ||
          r.events == null,
        true,
      ),
      filter((result) => Boolean(result.events?.length)),
    ),
  ).pipe(
    map((events) =>
      [...events.values()]
        .reverse()
        .filter(
          (evt) =>
            evt.status === BlockState.Best ||
            evt.status === BlockState.Finalized,
        )
        .flatMap(({ status, hash, number, events }) =>
          events!.map(({ event, extrinsicNumber }, index) => ({
            status,
            hash,
            number,
            event,
            extrinsicNumber,
            index,
          })),
        )
        .slice(0, MAX_LENGTH),
    ),
  ),
  [],
)
