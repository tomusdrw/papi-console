import {
  CodecComponentType,
  CodecComponentUpdate,
  CodecComponentValue,
  EditComponents,
  NOTIN,
} from "@polkadot-api/react-builder"
import {
  EnumVar,
  LookupEntry,
  SignedPrimitive,
  UnsignedPrimitive,
} from "@polkadot-api/metadata-builders"
import * as utils from "@polkadot-api/utils"
import { Binary, HexString } from "polkadot-api"
import { codec as jamCodec, bytes as jamBytes } from "@typeberry/block"

type JamCodec<T> = jamCodec.Descriptor<T> & { context?: unknown }

function refresh(
  codec: JamCodec<unknown>,
  value: Uint8Array | HexString | undefined,
): CodecComponentUpdate {
  const decoder = createDecode(codec)
  const v = value !== undefined ? decoder(value) : NOTIN
  if (v === NOTIN) {
    return {
      empty: true,
    }
  }

  const encoded = createEncode(codec)(v)
  if (encoded === undefined) {
    return {
      empty: true,
    }
  }

  return {
    empty: false,
    encoded,
    decoded: value,
  }
}

type DecodeFun<T> = (val: Uint8Array | HexString) => T | NOTIN
export function createDecode<T>(cod: JamCodec<T>): DecodeFun<T> {
  return (bytes) => {
    let source = null
    if (bytes instanceof Uint8Array) {
      source = jamBytes.BytesBlob.blobFrom(bytes)
    }
    if (typeof bytes === "string") {
      source = jamBytes.BytesBlob.parseBlob(
        bytes.startsWith("0x") ? bytes : `0x${bytes}`,
      )
    }

    if (source === null) {
      console.error("Invalid input argument", bytes)
      return NOTIN
    }

    try {
      const result2 = jamCodec.Decoder.decodeObject(cod, source, cod.context)
      return compatBinaryType(result2, false)
    } catch (e) {
      console.warn("Error decoding", e, cod, source)
      return NOTIN
    }
  }
}

export function createEncode<T>(codec: JamCodec<T>) {
  return (value: T | NOTIN): Uint8Array | undefined => {
    if (value === NOTIN) {
      return new Uint8Array()
    }

    try {
      const vJam = compatBinaryType(value, true)
      return jamCodec.Encoder.encodeObject(codec, vJam, codec.context).raw
    } catch (e) {
      console.warn("Error encoding", e, codec, value)
      return undefined
    }
  }
}

// This needs to be auto0generated based on our components and codec stuff.
export function getJamCodecComponent(baseComponents: EditComponents) {
  const {
    CVoid,
    CBigNumber,
    CNumber,
    CBool,
    CStr,
    CBytes,
    CEnum,
    CSequence,
    CArray,
    CTuple,
    CStruct,
    COption,
  } = baseComponents

  type OnChange<T> = (newValue: T | NOTIN) => boolean

  type EnumParent = {
    id: LookupEntry["id"]
    variantTag: string
    variantIdx: number
  }

  type JamCodecComponentProps<T> = {
    entry: LookupEntry
    value: CodecComponentUpdate
    dynCodecs: (id: number) => JamCodec<unknown>
    onChange: OnChange<T>
    path: string[]
    parent?: EnumParent
  }

  type ValueProps<T> =
    | {
        type: "blank"
        value: NOTIN
        encodedValue: undefined
      }
    | {
        type: "complete"
        value: T
        encodedValue: Uint8Array
      }
  type PartialValueProps<T> =
    | ValueProps<T>
    | {
        type: "partial"
        value: T
        encodedValue: undefined
      }

  function getInnerEnumCodec(
    parentCodec: JamCodec<unknown>,
    parent: EnumParent,
  ): JamCodec<unknown> {
    return {
      ...parentCodec,
      encode: (e: jamCodec.Encoder, value: unknown) => {
        const newE = jamCodec.Encoder.create()
        newE.object(parentCodec, { type: parent.variantTag, value })
        const encoded = newE.viewResult().raw.slice(1)
        e.bytes(jamCodec.bytes.Bytes.fromBlob(encoded, encoded.length))
      },
      decode: (d: jamCodec.Decoder) => {
        const newD = jamCodec.Decoder.fromBlob(
          utils.mergeUint8(new Uint8Array([parent.variantIdx]), d.source),
        )
        return parentCodec.decode(newD)
      },
    } as JamCodec<unknown>
  }

  function JamCodecComponent<T>({
    entry,
    value,
    dynCodecs,
    onChange,
    path,
    parent,
  }: JamCodecComponentProps<T>) {
    const cod =
      "id" in entry
        ? dynCodecs(entry.id)
        : getInnerEnumCodec(dynCodecs(parent?.id || 0), parent as EnumParent)
    const decode = createDecode(cod)
    let valueProps: PartialValueProps<any> = {
      type: "blank",
      value: NOTIN,
      encodedValue: undefined,
    }
    if (!value.empty) {
      const encodedValue = value.encoded || createEncode(cod)(value.decoded)
      valueProps = encodedValue
        ? { type: "complete", value: value.decoded, encodedValue }
        : { type: "partial", value: value.decoded, encodedValue: void 0 }
    }
    if (entry.type === "struct") {
      const latestValue = value.empty
        ? utils.mapObject(entry.value, () => NOTIN)
        : (value.decoded as any)

      return (
        <CStruct
          {...valueProps}
          decode={decode as DecodeFun<Record<string, any>>}
          shape={entry}
          onValueChanged={onChange as OnChange<Record<string, any> | NOTIN>}
          path={path}
          innerComponents={utils.mapObject(
            entry.value,
            (entry2, key: string) => (
              <JamCodecComponent
                path={path.concat(key)}
                dynCodecs={dynCodecs}
                entry={entry2}
                onChange={(x) => {
                  const value2 = { ...latestValue }
                  value2[key] = x
                  return onChange(value2)
                }}
                value={
                  latestValue[key] === NOTIN
                    ? { empty: true }
                    : {
                        empty: false,
                        decoded: latestValue[key],
                      }
                }
              />
            ),
          )}
        />
      )
    }

    if (entry.type === "tuple") {
      const latestValue = value.empty
        ? entry.value.map(() => NOTIN)
        : (value.decoded as any)
      return (
        <CTuple
          {...{
            ...valueProps,
            shape: entry,
            onValueChanged: onChange as OnChange<T[]>,
            decode: decode as DecodeFun<T[]>,
            path,
            innerComponents: entry.value.map((entry2, idx) => (
              <JamCodecComponent
                {...{
                  path: path.concat(idx.toString()),
                  dynCodecs,
                  entry: entry2,
                  onChange: (x) => {
                    const value2 = [...latestValue]
                    value2[idx] = x
                    return (onChange as OnChange<unknown[]>)(value2)
                  },
                  value: value.empty
                    ? value
                    : (value.decoded as unknown[])[idx] === NOTIN
                      ? { empty: true }
                      : {
                          empty: false,
                          decoded: (value.decoded as unknown[])[idx],
                        },
                }}
              />
            )),
          }}
        />
      )
    }

    if (entry.type === "enum") {
      let innerEntry
      let decoded: { type: string; value: unknown } | undefined = undefined
      if (!value.empty) {
        decoded =
          typeof value.decoded === "string"
            ? decode(value.encoded || utils.fromHex(value.decoded))
            : value.decoded
        valueProps.value = decoded
        innerEntry = entry.value[decoded?.type as string]
        if (innerEntry?.type === "lookupEntry") {
          innerEntry = innerEntry.value
        }
        if (!innerEntry) {
          valueProps = { type: "blank", value: NOTIN, encodedValue: void 0 }
          value = { empty: true }
        }
      }
      const typedOnChange = onChange as OnChange<{
        type: string
        value: unknown
      }>
      return (
        <CEnum
          {...{
            ...valueProps,
            decode: decode as DecodeFun<any>,
            onValueChanged: typedOnChange,
            path,
            tags: Object.entries(entry.value).map(([tag, { idx }]) => ({
              tag,
              idx,
            })),
            shape: entry,
            inner: value.empty ? null : (
              <JamCodecComponent
                {...{
                  path: path.concat(decoded.type),
                  dynCodecs,
                  entry: innerEntry as any,
                  onChange: (x) =>
                    typedOnChange({
                      type: decoded?.type,
                      value: x,
                    }),
                  parent: {
                    id: entry.id,
                    variantTag: decoded?.type,
                    variantIdx: entry.value[decoded?.type as string].idx,
                  },
                  value:
                    value.decoded.value === NOTIN
                      ? { empty: true }
                      : {
                          empty: false,
                          decoded: decoded?.value,
                          encoded:
                            valueProps.encodedValue &&
                            valueProps.encodedValue.slice(1),
                        },
                }}
              />
            ),
          }}
        />
      )
    }

    if (entry.type === "option") {
      return (
        <COption
          {...{
            ...valueProps,
            path,
            shape: entry,
            onValueChanged: onChange,
            decode,
            inner:
              !value.empty &&
              (value.decoded === void 0 || value.decoded === null) ? (
                <CVoid />
              ) : (
                <JamCodecComponent
                  {...{
                    path: path.concat(
                      `Option(${value.empty ? "Void" : value.decoded === NOTIN ? "" : "Value"})`,
                    ),
                    dynCodecs,
                    entry: entry.value,
                    onChange,
                    value:
                      value.empty || value.decoded === NOTIN
                        ? { empty: true }
                        : { empty: false, decoded: value.decoded },
                  }}
                />
              ),
          }}
        />
      )
    }

    if (entry.type === "void") {
      return <CVoid />
    }

    if (entry.type === "array") {
      if (entry.value.type === "primitive" && entry.value.value === "u8") {
        const decoder = createDecode(jamCodec.codec.bytes(entry.len))
        return (
          <CBytes
            {...{
              decode: (x) => {
                const jamBytes = decoder(x)
                return jamBytes === NOTIN
                  ? NOTIN
                  : Binary.fromBytes(jamBytes.raw)
              },
              onValueChanged: onChange as OnChange<Binary>,
              len: entry.len,
              path,
              ...(valueProps as ValueProps<Binary>),
            }}
          />
        )
      }

      const latestValue = value.empty
        ? Array(entry.len).fill(NOTIN)
        : (value.decoded as any[])
      return (
        <CArray
          {...{
            ...valueProps,
            path,
            shape: entry,
            decode: decode as DecodeFun<any[]>,
            onValueChanged: onChange as OnChange<any[]>,
            innerComponents: latestValue.map((decoded, idx) => (
              <JamCodecComponent
                {...{
                  dynCodecs,
                  entry: entry.value,
                  path: path.concat(idx.toString()),
                  onChange: (x) => {
                    const value2 = [...latestValue]
                    value2[idx] = x
                    return (onChange as OnChange<any[]>)(value2)
                  },
                  value:
                    decoded === NOTIN
                      ? { empty: true }
                      : { empty: false, decoded },
                }}
              />
            )),
          }}
        />
      )
    }

    if (entry.type === "sequence") {
      if (entry.value.type === "primitive" && entry.value.value === "u8") {
        const decoder = createDecode(jamCodec.codec.blob)
        return (
          <CBytes
            {...{
              ...(valueProps as ValueProps<Binary>),
              path,
              decode: (x) => {
                const jamBytes = decoder(x)
                return jamBytes === NOTIN
                  ? NOTIN
                  : Binary.fromBytes(jamBytes.raw)
              },
              onValueChanged: onChange as OnChange<Binary>,
            }}
          />
        )
      }

      const latestValue = value.empty ? [] : (value.decoded as unknown[])
      return (
        <CSequence
          {...{
            ...valueProps,
            path,
            shape: entry,
            onValueChanged: onChange as OnChange<unknown[]>,
            decode: decode as DecodeFun<unknown[]>,
            innerComponents: latestValue.map((decoded, idx) => (
              <JamCodecComponent
                {...{
                  path: path.concat(idx.toString()),
                  dynCodecs,
                  entry: entry.value,
                  onChange: (x) => {
                    const value2 = [...latestValue]
                    value2[idx] = x
                    return (onChange as OnChange<unknown[]>)(value2)
                  },
                  value:
                    decoded === NOTIN
                      ? { empty: true }
                      : { empty: false, decoded },
                }}
              />
            )),
          }}
        />
      )
    }
    let type: SignedPrimitive | UnsignedPrimitive | undefined
    let ResultComponent:
      | typeof CStr
      | typeof CNumber
      | typeof CBigNumber
      | typeof CBool
    switch (entry.type) {
      case "primitive": {
        if (entry.value === "str" || entry.value === "char")
          ResultComponent = CStr
        else if (entry.value === "bool") ResultComponent = CBool
        else {
          const nBits = Number(entry.value.slice(1))
          ResultComponent = nBits < 64 ? CNumber : CBigNumber
          type = entry.value
        }
        break
      }
      default: {
        return null
      }
    }

    return (
      <ResultComponent
        {...({
          ...valueProps,
          path,
          decode,
          onValueChanged: onChange,
          numType: type,
        } as any)}
      />
    )
  }

  type ResultProps = {
    value: CodecComponentValue
    dynCodecs: (id: number) => JamCodec<unknown>
    entry: LookupEntry
    onUpdate: (v: CodecComponentUpdate) => void
  }

  function Result<T>({
    value: propsValue,
    dynCodecs,
    entry,
    onUpdate,
  }: ResultProps) {
    const codec = dynCodecs(entry.id)
    const value =
      propsValue.type === CodecComponentType.Initial
        ? refresh(codec, propsValue.value)
        : propsValue.value
    return (
      <JamCodecComponent
        {...{
          path: [],
          onChange: (x: T | NOTIN) => {
            if (x === NOTIN) {
              onUpdate({ empty: true })
              return true
            }
            let encoded: Uint8Array | undefined
            const hasNotin = detectNotin(x)
            if (!hasNotin) {
              const xJam = compatBinaryType(x, true)
              try {
                encoded = jamCodec.Encoder.encodeObject(
                  codec,
                  xJam,
                  codec.context,
                ).raw
              } catch (e) {
                console.warn("Result: error encoding", xJam, e)
                return false
              }
            }
            onUpdate({ empty: false, decoded: x, encoded })
            return true
          },
          ...{
            dynCodecs,
            entry,
            value,
          },
        }}
      />
    )
  }
  return Result
}

const detectNotin = (x: any) => {
  if (x === NOTIN) return true
  return x != null && typeof x === "object"
    ? Object.values(x).some(detectNotin)
    : false
}

export const compatBinaryType = (x: any, intoJam: boolean): any => {
  if (x === NOTIN) return NOTIN
  if (x === null) return null

  if (intoJam && x instanceof Binary) {
    return jamBytes.BytesBlob.blobFrom(x.asBytes())
  }
  if (!intoJam && x instanceof jamBytes.BytesBlob) {
    return Binary.fromBytes(x.raw)
  }

  if (Array.isArray(x)) {
    return x.map((v) => compatBinaryType(v, intoJam))
  }
  if (!intoJam && x instanceof jamBytes.BitVec) {
    return Binary.fromBytes(x.raw())
  }
  if (x instanceof BigInt) {
    return x
  }
  if (typeof x === "object") {
    return utils.mapObject(x, (val) => {
      return compatBinaryType(val, intoJam)
    })
  }
  return x
}
