import { state, useStateObservable, withDefault } from "@react-rxjs/core"
import { FC } from "react"
import { combineLatest, debounceTime, map, switchMap } from "rxjs"
import { twMerge } from "tailwind-merge"
import { BlockInfo, blocksByHeight$, chainHead$ } from "./block.state"
import { CopyText } from "@/components/Copy"

const best$ = chainHead$.pipeState(switchMap((chainHead) => chainHead.best$))
const finalized$ = chainHead$.pipeState(
  switchMap((chainHead) => chainHead.finalized$),
  map((block) => block.number),
  withDefault(null),
)

interface PositionedBlock {
  block: BlockInfo
  position: number
  branched: number | null
  branches: number[]
}
const blockTable$ = state(
  combineLatest([blocksByHeight$, best$]).pipe(
    debounceTime(0),
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
  ),
  [],
)

export const BlockTable = () => {
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
  if (!finalized) return null

  return (
    <div>
      <h2 className="font-bold">Recent Blocks</h2>
      <table className="border-collapse">
        <thead>
          <tr>
            <th>Number</th>
            <th>Forks</th>
            <th>Hash</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.block.hash}
              className={twMerge(
                row.block.number <= finalized ? "bg-polkadot-900" : "",
                row.block.number === finalized &&
                  row.position === 0 &&
                  "border-t",
              )}
            >
              {rows[i - 1]?.block.number !== row.block.number ? (
                <td
                  rowSpan={numberSpan(i)}
                  className={twMerge(
                    "px-2",
                    numberSpan(i) > 1 && "border-y border-slate-500",
                    row.block.number === finalized && "border-t-white",
                    row.block.number === finalized + 1 && "border-b-white",
                  )}
                >
                  {row.block.number.toLocaleString()}
                </td>
              ) : null}
              <td className="p-0">
                <ForkRenderer row={row} />
              </td>
              <td className="max-w-xs">
                <div className="flex gap-1">
                  <div
                    className={twMerge(
                      "overflow-hidden text-ellipsis whitespace-nowrap tabular-nums text-sm",
                      row.position === 0
                        ? ""
                        : row.block.number > finalized
                          ? "opacity-80"
                          : "opacity-50",
                    )}
                  >
                    {row.block.hash}
                  </div>
                  <CopyText text={row.block.hash} binary />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const CELL_WIDTH = 20
const CELL_HEIGHT = 36
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
          y2={
            row.branched != null && branch === row.position
              ? CELL_HEIGHT / 2
              : CELL_HEIGHT
          }
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
