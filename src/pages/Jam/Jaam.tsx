import { JamBinaryDisplay } from "@/jam-codec-components/LookupTypeEdit"
import { ButtonGroup } from "@/components/ButtonGroup"
import {
  CodecComponentType,
  CodecComponentValue,
  NOTIN,
} from "@polkadot-api/react-builder"
import { Binary } from "@polkadot-api/substrate-bindings"
import { useCallback, useEffect, useMemo, useState } from "react"
import { JamEditMode } from "./EditMode"
import { JsonMode } from "./JsonMode"

import { bytes, config, codec as jamCodec } from "@typeberry/block";
import {Var} from "@polkadot-api/metadata-builders"
import {createDecode, createEncode} from "@/jam-codec-components/"
import {SearchableSelect} from "@/components/Select"
import {LookupEntryWithCodec, createMetadata} from "./metadata"
import {InitialBinary} from "@/jam-codec-components/InitialBinary"


// TODO [ToDr] Instead we should extend encoder,
// but currently the constructor is private so that's prohibited.
function patchEncoder(c: typeof jamCodec.Encoder) {
  // patch encode to handle NOTIN
  function patched1<A>(f: (v: A) => void) {
    return function(this: any, v: A | NOTIN): void {
      if (v === NOTIN) return;
      f.call(this, v);
    };
  }
  function patched2<A, B>(f: (a: A, v: B) => void) {
    return function (this: any, a: A, v: B | NOTIN): void {
      if (v === NOTIN) return;
      f.call(this, a, v);
    };
  }
  const p = c.prototype;
  const x = p as any;

  x.bitVecFixLen = patched1(p.bitVecFixLen);
  x.bitVecVarLen = patched1(p.bitVecVarLen);
  x.blob = patched1(p.blob);
  x.bool = patched1(p.bool);
  x.bytes = patched1(p.bytes);
  x.bytesBlob = patched1(p.bytesBlob);
  x.i16 = patched1(p.i16);
  x.i24 = patched1(p.i24);
  x.i8 = patched1(p.i8);
  x.i32 = patched1(p.i32);
  x.i64 = patched1(p.i64);
  x.varU32 = patched1(p.varU32);
  x.varU64 = patched1(p.varU64);
  x.bitVecVarLen = patched1(p.bitVecVarLen)
  const bitVecFixLen = patched1(p.bitVecFixLen);
  x.bitVecFixLen = function (v: bytes.BitVec | bytes.BytesBlob) { 
    if (v instanceof bytes.BytesBlob) {
      return bitVecFixLen.call(this, bytes.BitVec.fromBlob(v.raw, v.length * 8));
    }
    return bitVecFixLen.call(this, v);
  };

  //2
  x.object = patched2(p.object);
  x.optional = patched2(p.optional);
  x.sequenceFixLen = patched2(p.sequenceFixLen);
  x.sequenceVarLen = patched2(p.sequenceVarLen);
}

patchEncoder(jamCodec.Encoder);

const specOptions = [
  { text: 'Tiny Chain Spec', value: config.tinyChainSpec },
  { text: 'Full Chain Spec', value: config.fullChainSpec },
];


export function Jam() {
  const [value, setValue] = useState<Binary>();
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState("");

  const handleChange = useCallback<JamWithCodecProps['onChange']>((v, isValid, entry) => {
    setValue(v);
    setIsValid(isValid);
    if (!isValid) {
      setError(`Given data does not look like '${entry.name}'.`);
    } else {
      setError('');
    }
  }, []);

  return (<>
    <div className="flex flex-col gap-2 p-4">
      <InitialBinary
        value={value}
        isValid={isValid}
        onChange={setValue}
        onError={setError}
      />

      <div className="text-red-600">{error}</div>
    </div>
    <JamWithCodec initialValue={value} onChange={handleChange} />
  </>);
}

type JamWithCodecProps = { 
  initialValue: Binary | undefined;
  onChange: (v: Binary | undefined, isValid: boolean, entry: LookupEntryWithCodec) => void;
};
function JamWithCodec({ initialValue, onChange }: JamWithCodecProps) {
    const [spec, setSpec] = useState(config.tinyChainSpec);
    const { metadata, initial, lookup, dynCodecs } = useMemo(() => {
      return createMetadata(spec);
    }, [spec]);
    const [entry, setSelectedEntry] = useState<LookupEntryWithCodec>(initial);
    const [viewMode, setViewMode] = useState<"edit" | "json">("edit")

    const [componentValue, setComponentValue] = useState<CodecComponentValue>({
      type: CodecComponentType.Initial,
      value: initialValue?.asHex(),
    });

    const changeEntry = useCallback((x: LookupEntryWithCodec | null) => {
      setComponentValue({
        type: CodecComponentType.Initial,
        value: initialValue?.asHex(),
      });
      setSelectedEntry(x || initial);
    }, []);

    const entryOptions = useMemo(() => {
      return Object.values(metadata)
        .filter(x => x.name)
        .map(x => ({
          value: x,
          text: x.name!
        }))
        .sort((a, b) => ((a.text < b.text) ? -1 : (a.text === b.text ? 0 : 1)));
    }, [metadata]);

    // refresh the selected entry in case metadata changes
    useEffect(() => {
      setSelectedEntry((entry) => {
        return entryOptions.find(x => x.value.name === entry.name)?.value || entry;
      });
    }, [entryOptions])


    const codec = useMemo(() => {
      const jamCodec = dynCodecs(entry.id);
      const decode = createDecode(jamCodec);
      const encode = createEncode(jamCodec);
      return { decode, encode };
    }, [entry]);

    const binCodec = useMemo(() => {
      return {
        dec: codec.decode,
        enc: (x: any | NOTIN) => codec.encode(x) || new Uint8Array(),
      }
    }, [codec]);

    // update the location when value changes
    useEffect(() => {
      if (!componentValue.value || typeof componentValue.value !== 'object') {
        return;
      }
      if (!('encoded' in componentValue.value)) {
        return;
      }
      if (componentValue.value.encoded === undefined) {
        return;
      }
      if (componentValue.value.encoded === initialValue?.asBytes()) {
        return;
      }
      onChange(
        Binary.fromBytes(componentValue.value.encoded),
        true,
        entry,
      );
    }, [componentValue, entry]);

    // attempt to parse when initial value changes
    useEffect(() => {
      if (!initialValue) {
        return;
      }

      try {
        const decoded = codec.decode(initialValue.asBytes());
        if (decoded === NOTIN) {
          throw new Error('could not parse');
        }
        setComponentValue({ type: CodecComponentType.Updated, value: {
          empty: false,
          decoded,
          encoded: initialValue.asBytes(),
        }})
        onChange(initialValue, true, entry);
      } catch (e: unknown) {
        onChange(initialValue, false, entry);
      }
    }, [initialValue, codec, entry]);

    const binaryValue =
      (componentValue.type === CodecComponentType.Initial
        ? componentValue.value
        : componentValue.value.empty
          ? null
          : componentValue.value.encoded) ?? null

    return (<>
      <div className="flex flex-row gap-2 px-6 py-4">
        <SearchableSelect
          setValue={changeEntry}
          value={entry}
          options={entryOptions}
        />
        <SearchableSelect
          setValue={(x) => setSpec(x || config.tinyChainSpec)}
          value={spec}
          options={specOptions}
        />
      </div>
      <div className="flex flex-col overflow-hidden gap-2 p-4 pb-0">
        <JamBinaryDisplay
          dynCodecs={dynCodecs}
          entry={entry}
          value={componentValue}
          onUpdate={(value) => {
            setComponentValue({ type: CodecComponentType.Updated, value })
          }}
          codec={binCodec}
        />

        <div className="flex flex-row justify-between px-2">
          <ButtonGroup
            value={viewMode}
            onValueChange={setViewMode as any}
            items={[
              {
                value: "edit",
                content: "Edit",
              },
              {
                value: "json",
                content: "JSON",
                disabled: !binaryValue,
              },
            ]}
          />
        </div>

        {viewMode === "edit" ? (
          <JamEditMode
            lookup={lookup as (id: number) => Var}
            dynCodecs={dynCodecs}
            entry={entry}
            value={componentValue}
            onUpdate={(value) =>
              setComponentValue({ type: CodecComponentType.Updated, value })
            }
          />
        ) : (
          <JsonMode
            value={
              typeof binaryValue === "string"
                ? Binary.fromHex(binaryValue).asBytes()
                : binaryValue
            }
            decode={codec.decode}
          />
        )}
      </div>
    </>)
  }
