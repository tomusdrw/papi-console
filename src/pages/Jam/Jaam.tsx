import { ButtonGroup } from "@/components/ButtonGroup"
import {
  CodecComponentType,
  CodecComponentValue,
} from "@polkadot-api/react-builder"
import { Binary } from "@polkadot-api/substrate-bindings"
import { useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { JamEditMode } from "./EditMode"
import { JsonMode } from "./JsonMode"

import { codec as jamCodec, config, EpochMarker, Header, tickets } from "@typeberry/block";
import {LookupEntry, Var} from "@polkadot-api/metadata-builders"
import {createDecode} from "@/jam-codec-components/EditCodec"

// const binaryValue = '0x5c743dbc514284b2ea57798787c5a155ef9d7ac1e9499ec65910a7a3d65897b72591ebd047489f1006361a4254731466a946174af02fe1d86681d254cfd4a00b74a9e79d2618e0ce8720ff61811b10e045c02224a09299f04e404a9656e85c812a00000001ae85d6635e9ae539d0846b911ec86a27fe000f619b78bcac8a74b77e36f6dbcf333a7e328f0c4183f4b947e1d8f68aa4034f762e5ecdb5a7f6fbf0afea2fd8cd5e465beb01dbafe160ce8216047f2155dd0569f058afd52dcea601025a8d161d3d5e5a51aab2b048f8686ecd79712a80e3265a114cc73f14bdb2a59233fb66d0aa2b95f7572875b0d0f186552ae745ba8222fc0b5bd456554bfe51c68938f8bc7f6190116d118d643a98878e294ccf62b509e214299931aad8ff9764181a4e3348e5fcdce10e0b64ec4eebd0d9211c7bac2f27ce54bca6f7776ff6fee86ab3e3f16e5352840afb47e206b5c89f560f2611835855cf2e6ebad1acc9520a72591d00013b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da290300ae85d6635e9ae539d0846b911ec86a27fe000f619b78bcac8a74b77e36f6dbcf49a52360f74a0233cea0775356ab0512fafff0683df08fae3cb848122e296cbc50fed22418ea55f19e55b3c75eb8b0ec71dcae0d79823d39920bf8d6a2256c5f31dc5b1e9423eccff9bccd6549eae8034162158000d5be9339919cc03d14046e6431c14cbb172b3aed702b9e9869904b1f39a6fe1f3e904b0fd536f13e8cac496682e1c81898e88e604904fa7c3e496f9a8771ef1102cc29d567c4aad283f7b0';

type LookupEntryWithCodec = LookupEntry & {
  Codec: jamCodec.Descriptor<unknown>,
}

let header: LookupEntryWithCodec;
const metadata = ((spec: config.ChainSpec) => {
  let id = 0;
  const metadata: { [id: number]: LookupEntryWithCodec } = {};
  const add = <T, V>(codec: jamCodec.Descriptor<T, V>, v: Var) => {
    id++;
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

  header = add(Header.Codec, {
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

    const entry = header;
    const decode = useMemo(() => {
      const decoder = createDecode(dynCodecs(entry.id));
      return decoder;
    }, [entry]);
    return (
      <div className="flex flex-col overflow-hidden gap-2 p-4 pb-0">
        {/*
            Requires a bit of patching
            <BinaryDisplay
          {...extrinsicProps}
          value={componentValue}
          onUpdate={(value) =>
            setComponentValue({ type: CodecComponentType.Updated, value })
          }
          />*/}

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
            decode={decode}
          />
        )}
      </div>
    )
  }
