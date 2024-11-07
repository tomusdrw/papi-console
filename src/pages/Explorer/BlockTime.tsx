import { chainClient$, chainHead$, runtimeCtx$ } from "@/chain.state"
import { CircularProgress } from "@/components/CircularProgress"
import { groupBy } from "@/lib/groupBy"
import { state, useStateObservable } from "@react-rxjs/core"
import {
  animationFrames,
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  withLatestFrom,
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

const fromConstants$ = runtimeCtx$.pipe(
  map(({ dynamicBuilder, lookup }) => {
    const palletsByName = groupBy(lookup.metadata.pallets, (p) => p.name)
    const getConstant = (pallet: string, constant: string) =>
      palletsByName[pallet]?.[0]?.constants.find((ct) => ct.name === constant)
    const ct =
      getConstant("Babe", "ExpectedBlockTime") ??
      getConstant("Aura", "SlotDuration")
    if (!ct) return null
    try {
      const res = dynamicBuilder.buildDefinition(ct.type).dec(ct.value)
      return Number(res)
    } catch (_) {
      return null
    }
  }),
)
const fromCall$ = runtimeCtx$.pipe(
  withLatestFrom(chainClient$),
  switchMap(([{ lookup }, { client }]) => {
    const getFromApi = (apiName: string, apiMethod: string) => {
      const hasApi =
        "apis" in lookup.metadata &&
        lookup.metadata.apis
          .find((api) => api.name === apiName)
          ?.methods.find((method) => method.name === apiMethod)

      return hasApi ? client.getUnsafeApi().apis[apiName][apiMethod]() : null
    }

    return (
      getFromApi("AuraApi", "slot_duration")?.then((r) => Number(r)) ??
      getFromApi("BabeApi", "configuration")?.then((r) =>
        Number(r.slot_duration),
      ) ??
      of(null)
    )
  }),
)

const targetTime$ = state(
  fromConstants$.pipe(switchMap((v) => (v ? of(v) : fromCall$))),
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
