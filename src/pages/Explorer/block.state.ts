import { chainClient$ } from "@/chain.state"
import { FollowEventWithRuntime } from "@polkadot-api/substrate-client"
import { SystemEvent } from "@polkadot-api/observable-client"
import { state } from "@react-rxjs/core"
import { partitionByKey } from "@react-rxjs/utils"
import {
  combineLatest,
  concatMap,
  forkJoin,
  map,
  mergeMap,
  Observable,
  of,
  scan,
  skip,
  startWith,
  switchMap,
  take,
  takeUntil,
  withLatestFrom,
} from "rxjs"

export const chainHead$ = state(
  chainClient$.pipe(
    map(({ observableClient }) => observableClient.chainHead$()),
  ),
)

export interface BlockInfo {
  hash: string
  parent: string
  number: number
  body: string[] | null
  events: SystemEvent[] | null
  header: unknown | null
}
const [blockInfo$, recordedBlocks$] = partitionByKey(
  chainHead$.pipe(
    switchMap((chainHead) =>
      chainHead.follow$.pipe(
        withInitializedNumber(),
        scan(
          (acc, evt) => {
            switch (evt.type) {
              case "initialized": {
                const blockNumbers: Record<string, number> = {}
                evt.finalizedBlockHashes.forEach((hash, i) => {
                  const parent = blockNumbers[evt.finalizedBlockHashes[i - 1]]
                  blockNumbers[hash] = parent ? parent + 1 : evt.number
                })
                return {
                  value: evt.finalizedBlockHashes.map((hash, i) => ({
                    hash,
                    parent: evt.finalizedBlockHashes[i - 1] || evt.parentHash,
                    number: blockNumbers[hash],
                  })),
                  blockNumbers,
                }
              }
              case "newBlock": {
                const number = acc.blockNumbers[evt.parentBlockHash] + 1
                acc.blockNumbers[evt.blockHash] = number
                return {
                  value: [
                    {
                      hash: evt.blockHash,
                      parent: evt.parentBlockHash,
                      number,
                    },
                  ],
                  blockNumbers: acc.blockNumbers,
                }
              }
            }
            return { value: [], blockNumbers: acc.blockNumbers }
          },
          { value: [], blockNumbers: {} } as {
            value: Array<{
              hash: string
              parent: string
              number: number
            }>
            blockNumbers: Record<string, number>
          },
        ),
        mergeMap(({ value }) => value),
      ),
    ),
  ),
  (v) => v.hash,
  (initialized$) =>
    initialized$.pipe(
      take(1),
      withLatestFrom(chainHead$),
      switchMap(
        ([{ hash, parent, number }, chainHead]): Observable<BlockInfo> =>
          combineLatest({
            hash: of(hash),
            parent: of(parent),
            number: of(number),
            body: chainHead.body$(hash).pipe(startWith(null)),
            events: chainHead.eventsAt$(hash).pipe(startWith(null)),
            header: chainHead.header$(hash).pipe(startWith(null)),
          }),
      ),
      // Reset when chainHead is changed
      takeUntil(chainHead$.pipe(skip(1))),
    ),
)

export const blocksByHeight$ = state(
  recordedBlocks$.pipe(
    mergeMap((change) => {
      const targets$ = forkJoin([...change.keys].map(blockInfo$))

      return targets$.pipe(
        map((targets) => ({
          type: change.type,
          targets,
        })),
      )
    }),
    scan(
      (acc, evt) => {
        if (evt.type === "remove") {
          for (const { hash, number } of evt.targets) {
            acc[number]?.delete(hash)
            if (!acc[number]?.size) {
              delete acc[number]
            }
          }
        } else {
          for (const block of evt.targets) {
            acc[block.number] = acc[block.number] ?? new Map()
            acc[block.number].set(block.hash, block)
          }
        }

        return acc
      },
      {} as Record<number, Map<string, BlockInfo>>,
    ),
  ),
)

function withInitializedNumber() {
  return (source$: Observable<FollowEventWithRuntime>) =>
    source$.pipe(
      withLatestFrom(chainHead$),
      concatMap(([event, chainHead]) => {
        return event.type !== "initialized"
          ? of(event)
          : chainHead.header$(event.finalizedBlockHashes[0]).pipe(
              map((header) => ({
                ...event,
                number: header.number,
                parentHash: header.parentHash,
              })),
            )
      }),
    )
}
