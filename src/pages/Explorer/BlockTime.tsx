import { lookup$ } from "@/chain.state"
import { CircularProgress } from "@/components/CircularProgress"
import { getDynamicBuilder } from "@polkadot-api/metadata-builders"
import { state, useStateObservable } from "@react-rxjs/core"
import {
  animationFrames,
  combineLatest,
  distinctUntilChanged,
  map,
  switchMap,
} from "rxjs"
import { chainHead$ } from "./block.state"

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
  lookup$.pipe(
    map((lookup) => {
      const ct = lookup.metadata.pallets
        .find((p) => p.name === "Babe")
        ?.constants.find((ct) => ct.name === "ExpectedBlockTime")
      if (!ct) return null
      try {
        const res = getDynamicBuilder(lookup)
          .buildDefinition(ct.type)
          .dec(ct.value)
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
