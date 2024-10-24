import { lookup$ } from "@/chain.state"
import { EditCodec } from "@/codec-components/EditCodec"
import { ActionButton } from "@/components/ActionButton"
import { CopyText } from "@/components/Copy"
import { BinaryEdit } from "@/components/Icons"
import SliderToggle from "@/components/Toggle"
import {
  CodecComponentType,
  CodecComponentValue,
  NOTIN,
} from "@codec-components"
import { getDynamicBuilder } from "@polkadot-api/metadata-builders"
import { state, useStateObservable, withDefault } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { Binary } from "polkadot-api"
import { FC, useState } from "react"
import { combineLatest, filter, map, scan, startWith, switchMap } from "rxjs"
import { twMerge } from "tailwind-merge"
import { BinaryEditModal } from "../Extrinsics/BinaryEditModal"
import { selectedEntry$ } from "./storage.state"

export const StorageQuery: FC = () => {
  const isReady = useStateObservable(isReady$)

  return (
    <div className="p-2 flex flex-col gap-4 items-start w-full">
      <StorageKeysInput />
      <KeyDisplay />
      <ActionButton disabled={!isReady}>Query</ActionButton>
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
          <StorageKeyInput
            idx={idx}
            type={type}
            disabled={keysEnabled <= idx}
          />
        </li>
      ))}
    </ol>
  )
}

const lookupState$ = state(lookup$, null)
const keyInputValue$ = state(
  (idx: number) =>
    keyValues$.pipe(
      map(
        (v, i): CodecComponentValue =>
          i === 0
            ? {
                type: CodecComponentType.Initial,
              }
            : {
                type: CodecComponentType.Updated,
                value:
                  v[idx] === NOTIN
                    ? {
                        empty: true,
                      }
                    : {
                        empty: false,
                        decoded: v[idx],
                      },
              },
      ),
    ),
  {
    type: CodecComponentType.Initial,
  } satisfies CodecComponentValue,
)
const StorageKeyInput: FC<{ idx: number; type: number; disabled: boolean }> = ({
  idx,
  type,
  disabled,
}) => {
  const [binaryOpen, setBinaryOpen] = useState(false)
  const lookup = useStateObservable(lookupState$)
  const value = useStateObservable(keyInputValue$(idx))

  if (!lookup) return null

  const codec = getDynamicBuilder(lookup).buildDefinition(type)
  const binaryValue =
    (value.type === CodecComponentType.Initial
      ? value.value
      : value.value.empty
        ? null
        : (value.value.encoded ?? codec.enc(value.value.decoded))) ?? null

  const getTypeName = () => {
    const lookupEntry = lookup(type)
    switch (lookupEntry.type) {
      case "primitive":
        return lookupEntry.value
      case "compact":
        return (lookupEntry as any).size ?? "u128"
      case "enum":
        return "Enum"
      case "array":
        if (
          lookupEntry.value.type === "primitive" &&
          lookupEntry.value.value === "u8"
        ) {
          return "Binary"
        }
        return null
      case "bitSequence":
      case "AccountId20":
      case "AccountId32":
        return lookupEntry.type
      default:
        return null
    }
  }

  return (
    <div
      className={twMerge(
        "border-l px-2",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <div className="flex justify-between">
        <div>{getTypeName()}</div>
        <BinaryEdit
          size={18}
          className={twMerge("cursor-pointer hover:text-polkadot-300")}
          onClick={() => setBinaryOpen(true)}
        />
      </div>
      <EditCodec
        metadata={lookup.metadata}
        codecType={type}
        value={value}
        onUpdate={(value) =>
          setKeyValue({ idx, value: value.empty ? NOTIN : value.decoded })
        }
      />
      <BinaryEditModal
        status={{
          encodedValue:
            typeof binaryValue === "string"
              ? Binary.fromHex(binaryValue).asBytes()
              : (binaryValue ?? undefined),
          onValueChanged: (value) => {
            setKeyValue({ idx, value })
            return true
          },
          decode: codec.dec,
          type: "complete",
        }}
        open={binaryOpen}
        path=""
        onClose={() => setBinaryOpen(false)}
      />
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
