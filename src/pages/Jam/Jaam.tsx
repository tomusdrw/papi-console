import { JamBinaryDisplay } from "@/jam-codec-components/LookupTypeEdit"
import { ButtonGroup } from "@/components/ButtonGroup"
import {
  CodecComponentType,
  CodecComponentValue,
  NOTIN,
} from "@polkadot-api/react-builder"
import { Binary } from "@polkadot-api/substrate-bindings"
import { useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { JamEditMode } from "./EditMode"
import { JsonMode } from "./JsonMode"

import { codec as jamCodec, config, EpochMarker, Header, tickets } from "@typeberry/block";
import {LookupEntry, Var} from "@polkadot-api/metadata-builders"
import {createDecode, createEncode} from "@/jam-codec-components/EditCodec"

type LookupEntryWithCodec = LookupEntry & {
  Codec: jamCodec.Descriptor<unknown>,
}

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

let toplevel: LookupEntryWithCodec;
const metadata = ((spec: config.ChainSpec) => {
  let id = 0;
  const metadata: { [id: number]: LookupEntryWithCodec } = {};
  const add = <T, V>(codec: jamCodec.Descriptor<T, V>, v: Var) => {
    id++;
    // attach context
    (codec as any).context = spec;
    metadata[id] = {
      id,
      Codec: codec as jamCodec.Descriptor<unknown>,
      ...v,
    };
    return metadata[id];
  };

  const u8 = add(jamCodec.codec.u8, {
    type: 'primitive',
    value: 'u8',
  });
  const u16 = add(jamCodec.codec.u16, {
    type: 'primitive',
    value: 'u16',
  });
  const u32 = add(jamCodec.codec.u32, {
    type: 'primitive',
    value: 'u32',
  });
  const hash = add(jamCodec.codec.bytes(32), {
    type: 'array',
    len: 32,
    value: u8,
  });
  const hashSeq = add(jamCodec.codec.sequenceVarLen(hash.Codec), {
    type: 'sequence',
    value: hash,
  });
  const bytes96 = add(jamCodec.codec.bytes(96), {
    type: 'array',
    len: 96,
    value: u8,
  });
  const epochMarkerValidatorsArr = add(jamCodec.codec.sequenceFixLen(hash.Codec, spec.validatorsCount), {
    type: 'array',
    len: spec.validatorsCount,
    value: hash,
  });
  const epochMarker = add(EpochMarker.Codec, {
    type: 'struct',
    value: {
      entropy: hash,
      ticketsEntropy: hash,
      validators: epochMarkerValidatorsArr,
    },
    innerDocs: {},
  });
  const optionalEpochMarker = add(jamCodec.codec.optional(epochMarker.Codec), {
    type: 'option',
    value: epochMarker,
  });
  const ticket = add(tickets.Ticket.Codec, {
    type: 'struct',
    value: {
      id: hash,
      attempt: u8,
    },
    innerDocs: {}
  });
  const ticketsMarkerArray = add(jamCodec.codec.sequenceFixLen(ticket.Codec, spec.epochLength), {
    type: 'array',
    len: config.tinyChainSpec.epochLength,
    value: ticket,
  });

  const optionalTicketsMarker = add(jamCodec.codec.optional(ticketsMarkerArray.Codec), {
    type: 'option',
    value: ticketsMarkerArray,
  });

  const header = add(Header.Codec, {
    type: 'struct',
    value: {
      parentHeaderHash: hash,
      priorStateRoot: hash,
      extrinsicHash: hash,
      timeSlotIndex: u32,
      epochMarker: optionalEpochMarker,
      ticketsMarker: optionalTicketsMarker, 
      offendersMarker: hashSeq,
      bandersnatchBlockAuthorIndex: u16,
      entropySource: bytes96,
      seal: bytes96,
    },
    innerDocs: {}
  });

  toplevel = header

  return metadata;
})(config.tinyChainSpec);

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
    const [viewMode, setViewMode] = useState<"edit" | "json">("edit")
    const location = useLocation()

    const [componentValue, setComponentValue] = useState<CodecComponentValue>({
      type: CodecComponentType.Initial,
      value: location.hash.slice(1),
    })
    const binaryValue =
      (componentValue.type === CodecComponentType.Initial
        ? componentValue.value
        : componentValue.value.empty
          ? null
          : componentValue.value.encoded) ?? null

    const entry = toplevel;
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

    return (
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
    )
  }
