import { lookup$ } from "@/chain.state"
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

const SIZE = 50
const STROKE_W = 4
const CENTER = SIZE / 2
const RADIUS = CENTER - STROKE_W
const PERIMTER = Math.PI * 2 * RADIUS
export const BlockTime = () => {
  const { time, progress } = useStateObservable(timeProps$)

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <path
        d={`
          M${CENTER} ${STROKE_W}
          a ${RADIUS} ${RADIUS} 0 0 1 0 ${RADIUS * 2}
          a ${RADIUS} ${RADIUS} 0 0 1 0 -${RADIUS * 2}
        `}
        strokeWidth={STROKE_W}
        fill="transparent"
        className="transition-all ease-linear stroke-polkadot-500"
        opacity="0.3"
      />
      {progress ? (
        <path
          d={`
          M${CENTER} ${STROKE_W}
          a ${RADIUS} ${RADIUS} 0 0 1 0 ${RADIUS * 2}
          a ${RADIUS} ${RADIUS} 0 0 1 0 -${RADIUS * 2}
        `}
          strokeDasharray={`${progress * PERIMTER} ${PERIMTER}`}
          strokeWidth={STROKE_W}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all ease-linear stroke-polkadot-500"
          opacity="0.7"
        />
      ) : null}
      {progress && progress > 1 ? (
        <path
          d={`
          M${CENTER} ${STROKE_W}
          a ${RADIUS} ${RADIUS} 0 0 1 0 ${RADIUS * 2}
          a ${RADIUS} ${RADIUS} 0 0 1 0 -${RADIUS * 2}
        `}
          strokeDasharray={`${(progress - 1) * PERIMTER} ${PERIMTER}`}
          strokeWidth={STROKE_W}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all ease-linear stroke-polkadot-500"
        />
      ) : null}
      <text
        x={CENTER}
        y={CENTER}
        textAnchor="middle"
        dy=".3em"
        className="tabular-nums fill-polkadot-200"
      >
        {time}s
      </text>
    </svg>
  )
}
