import { chainHead$, dynamicBuilder$ } from "@/chain.state"
import { CircularProgress } from "@/components/CircularProgress"
import { state, useStateObservable } from "@react-rxjs/core"
import {
  animationFrames,
  combineLatest,
  distinctUntilChanged,
  map,
  switchMap,
} from "rxjs"

const best$ = chainHead$.pipeState(switchMap((chainHead) => chainHead.best$))
const bestBlockTime$ = best$.pipeState(
  // Only count when increasing height
  map((block) => block.number),
  distinctUntilChanged((prev, current) => prev >= current),
  switchMap(() => {
    const timestamp = Date.now()
    return animationFrames().pipe(map(() => Date.now() - timestamp))
  }),
)
const targetTime$ = state(
  dynamicBuilder$.pipe(
    map((builder) => {
      const ct = builder.lookup.metadata.pallets
        .find((p) => p.name === "Babe")
        ?.constants.find((ct) => ct.name === "ExpectedBlockTime")
      if (!ct) return null
      try {
        const res = builder.buildDefinition(ct.type).dec(ct.value)
        return Number(res)
      } catch (_) {
        return null
      }
    }),
  ),
)

const timeProps$ = state(
  combineLatest([bestBlockTime$, targetTime$]).pipe(
    map(([bestBlockTime, targetTime]) => {
      const time = (Math.round(bestBlockTime / 100) / 10).toFixed(1)
      const progress = targetTime ? bestBlockTime / targetTime : null
      return {
        time,
        progress: progress ? Math.round(progress * 100) / 100 : null,
      }
    }),
    distinctUntilChanged((a, b) => a.time === b.time),
  ),
  {
    time: "0",
    progress: null,
  },
)

export const BlockTime = () => {
  const { time, progress } = useStateObservable(timeProps$)

  return <CircularProgress progress={progress} text={time + "s"} />
}
