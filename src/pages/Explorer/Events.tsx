import { Popover } from "@/components/Popover"
import type { SystemEvent } from "@polkadot-api/observable-client"
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
import { FC } from "react"
import { JsonDisplay } from "@/components/JsonDisplay"
import { groupBy } from "@/lib/groupBy"

export const Events = () => {
  const events = useStateObservable(recentEvents$)
  const finalized = useStateObservable(finalized$)

  const finalizedIdx = finalized
    ? events.findIndex((evt) => evt.number <= finalized.number)
    : -1

  const numberSpan = (idx: number) => {
    const initialIdx = idx
    const key = eventKey(events[idx])
    do {
      idx++
    } while (key === eventKey(events[idx]))
    return idx - initialIdx
  }

  return (
    <div className="w-full p-2 border border-polkadot-800 rounded">
      <h2 className="font-bold p-2 border-b border-slate-400 mb-2">
        Recent Events
      </h2>
      <table className="w-full">
        <tbody>
          {events.map((evt, idx) => {
            const key = eventKey(evt)
            const span = numberSpan(idx)

            return (
              <tr
                key={`${evt.hash}-${evt.extrinsicNumber}-${evt.index}`}
                className={twMerge(
                  idx === finalizedIdx ? "border-t border-white" : "",
                  finalized && evt.number <= finalized.number
                    ? "bg-polkadot-900"
                    : "",
                )}
              >
                {eventKey(events[idx - 1]) !== key && (
                  <td
                    className={twMerge(
                      "p-2 whitespace-nowrap",
                      span > 1 &&
                        twMerge(
                          idx > 0 ? "border-y" : "border-b",
                          "border-slate-500",
                        ),
                      idx === finalizedIdx && "border-t-white",
                      idx === finalizedIdx - span && "border-b-white",
                    )}
                    rowSpan={span}
                  >
                    {key}
                  </td>
                )}
                <td className="p-1 w-full">
                  {"event" in evt ? (
                    <Popover content={<EventPopover event={evt} />}>
                      <button className="w-full p-1 text-left hover:text-polkadot-200">{`${evt.event.type}.${evt.event.value.type}`}</button>
                    </Popover>
                  ) : (
                    `… ${evt.length} more`
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {events.length === 0 ? (
        <div className="text-slate-400">(No events yet)</div>
      ) : null}
    </div>
  )
}

const EventPopover: FC<{ event: EventInfo }> = ({ event }) => {
  return (
    <div>
      <div className="flex justify-between">
        <h3 className="font-bold text-lg">Event {eventKey(event)}</h3>
        <p>
          Status:{" "}
          {event.status === BlockState.Finalized ? "Finalized" : "Pending"}
        </p>
      </div>
      <p className="overflow-hidden text-ellipsis whitespace-nowrap text-slate-400">
        Block: {event.hash}
      </p>
      <p className="font-bold">{`${event.event.type}.${event.event.value.type}`}</p>
      <JsonDisplay src={event.event.value.value} />
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
export const filterEvt = (evt: SystemEvent) =>
  !blackList.has(`${evt.event.type}.*`) &&
  !blackList.has(`${evt.event.type}.${evt.event.value.type}`)

interface EventInfo {
  status: BlockState
  hash: string
  number: number
  event: SystemEvent["event"]
  extrinsicNumber: number
  index: number
}
interface EventEllipsis {
  number: number
  extrinsicNumber: number
  length: number
  hash: string
  index: number
}
const eventKey = (evt: EventInfo | EventEllipsis) =>
  `${evt?.number.toLocaleString()}-${evt?.extrinsicNumber}`
const MAX_GROUP_LENGTH = 7
const recentEvents$ = state(
  combineKeys(recordedBlocks$, (key) =>
    blockInfo$(key).pipe(
      map((block) => ({
        status: block.status,
        hash: block.hash,
        number: block.number,
        events: block.events
          ?.filter((evt) => evt.phase.type === "ApplyExtrinsic")
          .filter(filterEvt)
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
        .flatMap(({ status, hash, number, events }) => {
          const eventInfo = events!.map(
            ({ event, extrinsicNumber }, index): EventInfo => ({
              status,
              hash,
              number,
              event,
              extrinsicNumber,
              index,
            }),
          )
          const groupedEventInfo = groupBy(eventInfo, eventKey)

          return Object.values(groupedEventInfo).flatMap((group) => {
            if (group.length > MAX_GROUP_LENGTH) {
              const ellipsis: EventEllipsis = {
                length: group.length - MAX_GROUP_LENGTH + 1,
                extrinsicNumber: group[0].extrinsicNumber,
                number,
                hash,
                index: group.length,
              }
              return [...group.slice(0, MAX_GROUP_LENGTH - 1), ellipsis]
            }
            return group
          })
        })
        .slice(0, MAX_LENGTH),
    ),
  ),
  [],
)
