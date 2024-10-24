import SliderToggle from "@/components/Toggle"
import { useStateObservable, withDefault } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { FC } from "react"
import { filter, map, scan, startWith, switchMap } from "rxjs"
import { selectedEntry$ } from "./storage.state"

export const StorageQuery: FC = () => {
  return (
    <div>
      <StorageKeysInput />
    </div>
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
    <div>
      Key type={type} enabled={String(!disabled)}
    </div>
  )
}
