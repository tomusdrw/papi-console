import SliderToggle from "@/components/Toggle"
import { state, useStateObservable, withDefault } from "@react-rxjs/core"
import { combineKeys, createSignal } from "@react-rxjs/utils"
import { FC } from "react"
import { combineLatest, filter, map, scan, startWith, switchMap } from "rxjs"
import { selectedEntry$ } from "./storage.state"
import { NOTIN } from "@codec-components"
import { ActionButton } from "@/components/ActionButton"
import { lookup$ } from "@/chain.state"
import { getDynamicBuilder } from "@polkadot-api/metadata-builders"
import { CopyText } from "@/components/Copy"
import { twMerge } from "tailwind-merge"

export const StorageQuery: FC = () => {
  const isReady = useStateObservable(isReady$)

  return (
    <>
      <StorageKeysInput />
      <KeyDisplay />
      <ActionButton disabled={!isReady}>Query</ActionButton>
    </>
  )
}

const keys$ = selectedEntry$.pipeState(
  filter((e) => !!e),
  map((entry) => entry.key),
  withDefault([] as number[]),
)

const [toggleKey$, toggleKey] = createSignal<number>()
const keysEnabled$ = keys$.pipeState(
  switchMap((k) =>
    toggleKey$.pipe(
      /*
      acc=2
      [X,X, , ]
       0 1 2 3
      toggle 0 => acc=0
      toggle 1 => acc=1
      toggle 2 => acc=3
      toggle 3 => acc=4
      */
      scan((acc, toggle) => (acc <= toggle ? toggle + 1 : toggle), k.length),
      startWith(k.length),
    ),
  ),
  withDefault(0),
)

const [keyValueChange$, setKeyValue] = createSignal<{
  idx: number
  value: unknown | NOTIN
}>()
const keyValues$ = keys$.pipeState(
  switchMap((keys) => {
    const values: unknown[] = keys.map(() => NOTIN)
    return keyValueChange$.pipe(
      scan((acc, change) => {
        const newValue = [...acc]
        newValue[change.idx] = change.value
        return newValue
      }, values),
      startWith(values),
    )
  }),
  withDefault([] as unknown[]),
)

const isReady$ = state(
  combineLatest([keyValues$, keysEnabled$]).pipe(
    map(
      ([keyValues, keysEnabled]) =>
        keyValues.length >= keysEnabled &&
        keyValues.slice(0, keysEnabled).every((v) => v !== NOTIN),
    ),
  ),
  false,
)

const StorageKeysInput: FC = () => {
  const keys = useStateObservable(keys$)
  const keysEnabled = useStateObservable(keysEnabled$)

  return (
    <ol className="flex flex-col gap-2">
      {keys.map((type, idx) => (
        <li key={idx} className="flex flex-row gap-2 items-center">
          <SliderToggle
            isToggled={keysEnabled > idx}
            toggle={() => toggleKey(idx)}
          />
          <StorageKeyInput type={type} disabled={keysEnabled <= idx} />
        </li>
      ))}
    </ol>
  )
}

const StorageKeyInput: FC<{ type: number; disabled: boolean }> = ({
  type,
  disabled,
}) => {
  return (
    <div className="border-l p-2">
      Key type={type} enabled={String(!disabled)}
    </div>
  )
}

const encodedKey$ = state(
  combineLatest([lookup$, selectedEntry$, keyValues$, keysEnabled$]).pipe(
    map(([lookup, selectedEntry, keyValues, keysEnabled]) => {
      const args = keyValues.slice(0, keysEnabled)
      if (
        keyValues.length < keysEnabled ||
        !args.every((v) => v !== NOTIN) ||
        !selectedEntry
      ) {
        return null
      }

      const codec = getDynamicBuilder(lookup).buildStorage(
        selectedEntry.pallet,
        selectedEntry.entry,
      )
      return codec.enc(...args)
    }),
  ),
  null,
)
const KeyDisplay: FC = () => {
  const key = useStateObservable(encodedKey$)

  return (
    <div className="flex w-full overflow-hidden bg-polkadot-800 p-2 gap-2 rounded items-center">
      <div className="flex-shrink-0 text-polkadot-200">Encoded key:</div>
      <div
        className={twMerge(
          "flex-1 overflow-hidden whitespace-nowrap text-ellipsis text-sm tabular-nums",
          key === null ? "text-slate-400" : null,
        )}
      >
        {key ?? "Fill in all the storage keys to calculate the encoded key"}
      </div>
      <CopyText text={key ?? ""} disabled={key === null} />
    </div>
  )
}
