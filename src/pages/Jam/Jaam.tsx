import { JamBinaryDisplay } from "@/jam-codec-components/LookupTypeEdit"
import { ButtonGroup } from "@/components/ButtonGroup"
import {
  CodecComponentType,
  CodecComponentValue,
  NOTIN,
} from "@polkadot-api/react-builder"
import { Binary } from "@polkadot-api/substrate-bindings"
import { useCallback, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { JamEditMode } from "./EditMode"
import { JsonMode } from "./JsonMode"

import { bytes, config, codec as jamCodec } from "@typeberry/block";
import {Var} from "@polkadot-api/metadata-builders"
import {compatBinaryType, createDecode, createEncode} from "@/jam-codec-components/"
import {SearchableSelect} from "@/components/Select"
import {LookupEntryWithCodec, createMetadata} from "./metadata"


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
    const [spec, setSpec] = useState(config.tinyChainSpec);
    const { metadata, initial, lookup, dynCodecs } = useMemo(() => {
      return createMetadata(spec);
    }, [spec]);
    const [entry, setSelectedEntry] = useState<LookupEntryWithCodec>(initial);
    const [viewMode, setViewMode] = useState<"edit" | "json">("edit")
    const location = useLocation()

    const [componentValue, setComponentValue] = useState<CodecComponentValue>({
      type: CodecComponentType.Initial,
      value: location.hash.slice(1)
    });

    const changeEntry = useCallback((x: LookupEntryWithCodec | null) => {
      setComponentValue({
        type: CodecComponentType.Initial,
        value: location.hash.slice(1)
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

    const binaryValue =
      (componentValue.type === CodecComponentType.Initial
        ? componentValue.value
        : componentValue.value.empty
          ? null
          : componentValue.value.encoded) ?? null

    return (<>
      <div className="flex flex-row gap-2 p-4">
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
