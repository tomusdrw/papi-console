import { withSubscribe } from "@/components/withSuspense"
import { state, useStateObservable } from "@react-rxjs/core"
import { BlockInfo, blocksByHeight$, chainHead$ } from "./block.state"
import {
  animationFrames,
  distinctUntilChanged,
  map,
  switchMap,
  withLatestFrom,
} from "rxjs"
import { useEffect, useState } from "react"

const finalized$ = state(
  chainHead$.pipe(switchMap((chainHead) => chainHead.finalized$)),
)
const best$ = state(chainHead$.pipe(switchMap((chainHead) => chainHead.best$)))

export const Explorer = withSubscribe(() => {
  const finalized = useStateObservable(finalized$)
  const best = useStateObservable(best$)

  return (
    <div>
      <div className="flex gap-2">
        <span>Finalized:</span>
        <span className="tabular-nums">{finalized.number}</span>
        <span className="text-slate-300">{finalized.hash}</span>
      </div>
      <div className="flex gap-2">
        <span>Best:</span>
        <span className="tabular-nums">{best.number}</span>
        <span className="text-slate-300">{best.hash}</span>
      </div>
      <div>
        Block time: <span className="tabular-nums">{bestBlockTime$}s</span>
      </div>
    </div>
  )
})

const bestBlockTime$ = best$.pipeState(
  // Only count when increasing height
  map((block) => block.number),
  distinctUntilChanged((prev, current) => prev >= current),
  switchMap(() => {
    const timestamp = Date.now()
    return animationFrames().pipe(
      map(() => Date.now() - timestamp),
      map((v) => (Math.round(v / 100) / 10).toFixed(1)),
      distinctUntilChanged(),
    )
  }),
)

const blockTable$ = blocksByHeight$
  .pipe(
    withLatestFrom(best$),
    map(([blocks, best]) => {
      console.log(blocks)
      const result: Array<{
        block: BlockInfo
        position: number
        branched: number | null
        branches: number[]
      }> = []

      const blockPositions: Record<string, number> = {}
      const positionsTaken = new Set<number>()
      const lockFreePosition = () => {
        for (let i = 0; ; i++) {
          if (!positionsTaken.has(i)) {
            positionsTaken.add(i)
            return i
          }
        }
      }
      for (let height = best.number; blocks[height]; height--) {
        const competingBlocks = [...blocks[height].values()]
        if (height === best.number) {
          competingBlocks.sort((a) => (a.hash === best.hash ? -1 : 1))
        }
        const positionsMerged: number[] = []
        competingBlocks.forEach((block) => {
          const branches = [...positionsTaken].filter(
            (v) => !positionsMerged.includes(v),
          )

          const position = blockPositions[block.hash] ?? lockFreePosition()
          if (blockPositions[block.parent]) {
            // then it means the parent was already discovered by a previous
            // so this is the start of a branch
            result.push({
              block,
              branched: blockPositions[block.parent],
              branches,
              position,
            })
            positionsMerged.push(position)
          } else {
            // We put our parent underneath us
            blockPositions[block.parent] = position
            result.push({
              block,
              branched: null,
              branches,
              position,
            })
          }
        })
        positionsMerged.forEach((v) => positionsTaken.delete(v))
      }

      return result
    }),
  )
  .subscribe((v) => console.log(v.map((v) => ({ ...v, hash: v.block.hash }))))
