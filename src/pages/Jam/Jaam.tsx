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

import { codec as jamCodec } from "@typeberry/block";
import {Var} from "@polkadot-api/metadata-builders"
import {createDecode, createEncode} from "@/jam-codec-components/EditCodec"
import {SearchableSelect} from "@/components/Select"
import {LookupEntryWithCodec, initial, metadata} from "./metadata"


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
  //2
  x.object = patched2(p.object);
  x.optional = patched2(p.optional);
  x.sequenceFixLen = patched2(p.sequenceFixLen);
  x.sequenceVarLen = patched2(p.sequenceVarLen);
}

patchEncoder(jamCodec.Encoder);

const lookup = function(id: number): LookupEntryWithCodec | undefined {
  return metadata[id];
};

const dynCodecs = function(id: number) {
  // build a whole map and instead of special casing, rather convert based on the structure.
  const entry = lookup(id);
  if (!entry) {
    throw new Error(`No entry for ${id}`);
  }
  return entry.Codec;
}

export function Jam() {
    const [entry, setSelectedEntry] = useState<LookupEntryWithCodec>(initial);
    const [viewMode, setViewMode] = useState<"edit" | "json">("edit")
    const location = useLocation()

    const [componentValue, setComponentValue] = useState<CodecComponentValue>({
      type: CodecComponentType.Initial,
      value: location.hash.slice(1) || '00',
    });

    const changeEntry = useCallback((x: LookupEntryWithCodec | null) => {
      setComponentValue({
        type: CodecComponentType.Initial,
        value: location.hash.slice(1) || '00'
      });
      setSelectedEntry(x || initial);
    }, []);

    const entryOptions = useMemo(() => {
      return Object.values(metadata).filter(x => x.name).map(x => ({
        value: x,
        text: x.name!
      }));
    }, []);

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
      <div className="flex flex-col gap-2 p-4">
        <SearchableSelect
          setValue={changeEntry}
          value={entry}
          options={entryOptions}
        />
      </div>
      <div className="flex flex-col overflow-hidden gap-2 p-4 pb-0">
        <JamBinaryDisplay
          dynCodecs={dynCodecs}
          entry={entry}
          value={componentValue}
          onUpdate={(value) => setComponentValue({ type: CodecComponentType.Updated, value })}
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
