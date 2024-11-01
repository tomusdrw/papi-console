import { chainClient$ } from "@/chain.state"
import {
  ChainHead$,
  PinnedBlocks,
  SystemEvent,
} from "@polkadot-api/observable-client"
import { FollowEventWithRuntime } from "@polkadot-api/substrate-client"
import { state, withDefault } from "@react-rxjs/core"
import { partitionByKey } from "@react-rxjs/utils"
import {
  catchError,
  combineLatest,
  concat,
  concatMap,
  filter,
  finalize,
  forkJoin,
  map,
  mergeMap,
  NEVER,
  Observable,
  of,
  scan,
  skip,
  startWith,
  switchMap,
  take,
  takeUntil,
  takeWhile,
  withLatestFrom,
} from "rxjs"

export const chainHead$ = state(
  chainClient$.pipe(
    switchMap(({ observableClient }) => {
      const chainHead = observableClient.chainHead$()
      return concat(of(chainHead), NEVER).pipe(finalize(chainHead.unfollow))
    }),
  ),
)

export const finalized$ = chainHead$.pipeState(
  switchMap((chainHead) => chainHead.finalized$),
  withDefault(null),
)

export enum BlockState {
  Fork = "fork",
  Best = "best",
  Finalized = "finalized",
  Pruned = "pruned",
}
export interface BlockInfo {
  hash: string
  parent: string
  number: number
  body: string[] | null
  events: SystemEvent[] | null
  header: unknown | null
  status: BlockState
}
export const [blockInfo$, recordedBlocks$] = partitionByKey(
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
          concat(
            combineLatest({
              hash: of(hash),
              parent: of(parent),
              number: of(number),
              body: chainHead.body$(hash).pipe(
                startWith(null),
                catchError(() => of(null)),
              ),
              events: chainHead.eventsAt$(hash).pipe(
                startWith(null),
                catchError(() => of(null)),
              ),
              header: chainHead.header$(hash).pipe(
                startWith(null),
                catchError(() => of(null)),
              ),
              status: getBlockStatus$(chainHead, hash, number),
            }),
            NEVER,
          ),
      ),
      // Reset when chainHead is changed
      takeUntil(chainHead$.pipe(skip(1))),
    ),
)

export const blockInfoState$ = state((hash: string) => blockInfo$(hash), null)

export const blocksByHeight$ = state(
  recordedBlocks$.pipe(
    mergeMap((change) => {
      const targets$ = forkJoin(
        [...change.keys].map((hash) => blockInfo$(hash).pipe(take(1))),
      )

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

const getBlockStatus$ = (
  chainHead: ChainHead$,
  hash: string,
  number: number,
): Observable<BlockState> =>
  chainHead.pinnedBlocks$.pipe(
    take(1),
    switchMap((pinnedBlocks) => {
      const block = (hash: string) => pinnedBlocks.blocks.get(hash)
      const blockNum = (hash: string) => block(hash)?.number
      const finalized = blockNum(pinnedBlocks.finalized)!
      if (number <= finalized) {
        // assume we are in the list of finalized blocks on `initialized`
        return of(BlockState.Finalized)
      }

      const getInitialState = (pinnedBlocks: PinnedBlocks) => {
        let bestBranch = pinnedBlocks.best
        while (blockNum(bestBranch)! > finalized && hash !== bestBranch) {
          bestBranch = block(bestBranch)!.parent
        }
        return block(bestBranch)?.hash === hash
          ? BlockState.Best
          : BlockState.Fork
      }
      const initialState = getInitialState(pinnedBlocks)

      return chainHead.follow$.pipe(
        concatMap((evt) => {
          switch (evt.type) {
            case "bestBlockChanged":
              return chainHead.pinnedBlocks$.pipe(take(1), map(getInitialState))
            case "finalized":
              if (evt.finalizedBlockHashes.includes(hash))
                return of(BlockState.Finalized)
              if (evt.prunedBlockHashes.includes(hash))
                return of(BlockState.Pruned)
          }
          return of(null)
        }),
        filter((v) => v !== null),
        takeWhile(
          (v) => v !== BlockState.Finalized && v !== BlockState.Pruned,
          true,
        ),
        startWith(initialState),
      )
    }),
  )
