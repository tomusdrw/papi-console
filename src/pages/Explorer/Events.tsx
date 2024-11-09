import { Popover } from "@/components/Popover"
import { useStateObservable } from "@react-rxjs/core"
import { twMerge } from "tailwind-merge"
import { finalized$ } from "./block.state"
import { EventPopover } from "./EventPopover"
import { eventKey, recentEvents$ } from "./events.state"
import * as Finalizing from "./FinalizingTable"

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
    <Finalizing.Root>
      <Finalizing.Title>Recent Events</Finalizing.Title>
      <Finalizing.Table>
        {events.map((evt, idx) => {
          const key = eventKey(evt)
          const span = numberSpan(idx)

          return (
            <Finalizing.Row
              key={`${evt.hash}-${evt.extrinsicNumber}-${evt.index}`}
              number={events.length - idx}
              finalized={events.length - finalizedIdx}
              idx={idx}
              firstInGroup
            >
              {eventKey(events[idx - 1]) !== key && (
                <td
                  className={twMerge(
                    "p-2 whitespace-nowrap",
                    span > 1 &&
                      twMerge(
                        idx > 0 ? "border-y" : "border-b",
                        "border-card-foreground/25",
                        idx === finalizedIdx && "border-t-card-foreground/50",
                        idx === finalizedIdx - span &&
                          "border-b-card-foreground/50",
                      ),
                  )}
                  rowSpan={span}
                >
                  {key}
                </td>
              )}
              <td className="p-1 w-full">
                {"event" in evt ? (
                  <Popover content={<EventPopover event={evt} />}>
                    <button className="w-full p-1 text-left text-card-foreground/80 hover:text-card-foreground/100">{`${evt.event.type}.${evt.event.value.type}`}</button>
                  </Popover>
                ) : (
                  `… ${evt.length} more`
                )}
              </td>
            </Finalizing.Row>
          )
        })}
      </Finalizing.Table>
      {events.length === 0 ? (
        <div className="text-slate-400">(No events yet)</div>
      ) : null}
    </Finalizing.Root>
  )
}
