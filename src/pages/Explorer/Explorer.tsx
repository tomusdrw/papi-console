import { withSubscribe } from "@/components/withSuspense"
import { state, useStateObservable } from "@react-rxjs/core"
import {
  animationFrames,
  distinctUntilChanged,
  map,
  merge,
  switchMap,
  withLatestFrom,
} from "rxjs"
import { BlockInfo, blocksByHeight$, chainHead$ } from "./block.state"
import { FC } from "react"
import { twMerge } from "tailwind-merge"

const finalized$ = state(
  chainHead$.pipe(switchMap((chainHead) => chainHead.finalized$)),
)
const best$ = state(chainHead$.pipe(switchMap((chainHead) => chainHead.best$)))

const explorer$ = merge(finalized$, best$, blocksByHeight$)

export const Explorer = withSubscribe(
  () => {
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
        <BlockTable />
      </div>
    )
  },
  {
    source$: explorer$,
  },
)

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

export interface PositionedBlock {
  block: BlockInfo
  position: number
  branched: number | null
  branches: number[]
}
const blockTable$ = blocksByHeight$.pipeState(
  withLatestFrom(best$),
  map(([blocks, best]) => {
    const result: Array<PositionedBlock> = []

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
      if (competingBlocks.length > 1) {
        if (height === best.number) {
          competingBlocks.sort((a) => (a.hash === best.hash ? -1 : 1))
        } else {
          competingBlocks.sort((a, b) =>
            (blockPositions[a.hash] ?? Number.POSITIVE_INFINITY) <
            (blockPositions[b.hash] ?? Number.POSITIVE_INFINITY)
              ? -1
              : 1,
          )
        }
      }
      const positionsMerged: number[] = []
      competingBlocks.forEach((block) => {
        const branches = [...positionsTaken].filter(
          (v) => !positionsMerged.includes(v),
        )

        const position = blockPositions[block.hash] ?? lockFreePosition()
        if (blockPositions[block.parent] != null) {
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

const BlockTable = () => {
  const rows = useStateObservable(blockTable$)
  const finalized = useStateObservable(finalized$)

  const numberSpan = (idx: number) => {
    const initialIdx = idx
    const number = rows[idx].block.number
    do {
      idx++
    } while (number === rows[idx]?.block.number)
    return idx - initialIdx
  }

  return (
    <table className="border-collapse">
      <thead>
        <tr>
          <th>Block Number</th>
          <th>Forks</th>
          <th>Hash</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={row.block.hash}
            className={twMerge(
              row.block.number <= finalized.number ? "bg-polkadot-900" : "",
              row.block.number === finalized.number &&
                row.position === 0 &&
                "border-t",
            )}
          >
            {rows[i - 1]?.block.number !== row.block.number ? (
              <td rowSpan={numberSpan(i)} className="px-2">
                {row.block.number}
              </td>
            ) : null}
            <td className="p-0">
              <ForkRenderer row={row} />
            </td>
            <td
              className={
                row.position === 0
                  ? ""
                  : row.block.number > finalized.number
                    ? "opacity-80"
                    : "opacity-50"
              }
            >
              {row.block.hash}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const CELL_WIDTH = 26
const CELL_HEIGHT = 26
const CIRCLE_R = 5
const ForkRenderer: FC<{ row: PositionedBlock }> = ({ row }) => {
  const totalCells = Math.max(row.position, ...row.branches) + 1

  const getPositionCenter = (p: number) => CELL_WIDTH * p + CELL_WIDTH / 2

  return (
    <svg
      height={CELL_HEIGHT}
      width={CELL_WIDTH * totalCells}
      className="stroke-polkadot-200"
    >
      {row.branches.map((branch, i) => (
        <line
          key={i}
          x1={getPositionCenter(branch)}
          y1={0}
          x2={getPositionCenter(branch)}
          y2={CELL_HEIGHT}
        />
      ))}
      {row.branched != null ? (
        <line
          x1={getPositionCenter(row.branched)}
          y1={CELL_HEIGHT / 2}
          x2={getPositionCenter(row.position)}
          y2={CELL_HEIGHT / 2}
        />
      ) : row.branches.includes(row.position) ? null : (
        <line
          x1={getPositionCenter(row.position)}
          y1={CELL_HEIGHT / 2}
          x2={getPositionCenter(row.position)}
          y2={CELL_HEIGHT}
        />
      )}
      <circle
        cx={getPositionCenter(row.position)}
        cy={CELL_HEIGHT / 2}
        r={CIRCLE_R}
        className={
          row.position === 0 ? "fill-polkadot-500" : "fill-polkadot-600"
        }
      />
    </svg>
  )
}
