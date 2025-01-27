import {LookupEntry, Var} from "@polkadot-api/metadata-builders";
import {StringRecord} from "@polkadot-api/substrate-bindings";
import { codec as jamCodec, config, EpochMarker, Header, tickets, assurances, disputes, gaurantees, workReport, refineContext, workResult, Block, Extrinsic, preimage, bytes, workItem } from "@typeberry/block";

const { codec } = jamCodec;

export type LookupEntryWithCodec = LookupEntry & {
  Codec: jamCodec.Descriptor<unknown>,
  name?: string,
}

type Metadata = {
  [id: number]: LookupEntryWithCodec,
};

class PackageInfo {
  static Codec = jamCodec.codec.object({
    packageHash: jamCodec.codec.bytes(32),
    refineContext: refineContext.RefineContext.Codec,
  });
  constructor(
    public readonly packageHash: bytes.Bytes<32>,
    public readonly refineContext: refineContext.RefineContext,
  ) {}
}


export function createMetadata(spec: config.ChainSpec) {
  let id = 0;
  const metadata: Metadata = {};

  const bool = add(codec.bool, {
    type: 'primitive',
    value: 'bool',
  });
  const u8 = add(codec.u8, {
    type: 'primitive',
    value: 'u8',
  });
  const u16 = add(codec.u16, {
    type: 'primitive',
    value: 'u16',
  }, 'u16');
  const u32 = add(codec.u32, {
    type: 'primitive',
    value: 'u32',
  }, 'u32');
  const u64 = add(codec.u64, {
    type: 'primitive',
    value: 'u64',
  }, 'u64');
  add(codec.varU64, {
    type: 'primitive',
    value: 'u64',
  }, 'varU64');
  const hash = add(codec.bytes(32), {
    type: 'array',
    len: 32,
    value: u8,
  }, 'Hash');
  const blob = add(codec.blob, {
    type: 'sequence',
    value: u8,
  }, 'Blob');
  const hashSeq = add(codec.sequenceVarLen(hash.Codec), {
    type: 'sequence',
    value: hash,
  });
  const bytes64 = add(codec.bytes(64), {
    type: 'array',
    len: 64,
    value: u8,
  }, 'Bytes<64>');
  const bytes96 = add(codec.bytes(96), {
    type: 'array',
    len: 96,
    value: u8,
  }, 'Bytes<96>');
  const bandersnatchProof = add(codec.bytes(784), {
    type: 'array',
    len: 784,
    value: u8,
  }, "Bandersnatch Signature");
  const epochMarkerValidatorsArr = add(codec.sequenceFixLen(hash.Codec, spec.validatorsCount), {
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
    innerDocs: {
      entropy: ['Entropy source'],
      ticketsEntropy: ['Tickets entropy'],
      validators: ['Validators  for the new epoch'],
    },
  }, 'Epoch Marker');
  const optionalEpochMarker = add(codec.optional(epochMarker.Codec), {
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
  }, 'Ticket');
  const ticketsMarkerArray = add(codec.sequenceFixLen(ticket.Codec, spec.epochLength), {
    type: 'array',
    len: config.tinyChainSpec.epochLength,
    value: ticket,
  }, 'Tickets Marker');
  const optionalTicketsMarker = add(codec.optional(ticketsMarkerArray.Codec), {
    type: 'option',
    value: ticketsMarkerArray,
  });
  const header = addStruct(Header, {
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
  }, "Header");

  const assurancesBitfieldBytes = Math.ceil(spec.coresCount / 8) * 8;
  const assuranceBitfield = add(
    codec.bitVecFixLen(assurancesBitfieldBytes),
    {
      type: 'array',
      len: assurancesBitfieldBytes / 8,
      value: u8
    }
  );

  const availabilityAssurance = addStruct(assurances.AvailabilityAssurance, {
    anchor: hash,
    bitfield: assuranceBitfield,
    validatorIndex: u16,
    signature: bytes64,
  }, "Availability Assurance");

  const assurancesExtrinsic = add(assurances.assurancesExtrinsicCodec, {
    type: 'sequence',
    value: availabilityAssurance,
  }, 'Assurances Extrinsic');  

  const fault = addStruct(disputes.Fault, {
    workReportHash: hash,
    wasConsideredValid: bool,
    key: hash,
    signature: bytes64,
  }, "Fault");

  const culprit = addStruct(disputes.Culprit, {
    workReportHash: hash,
    key: hash,
    signature: bytes64,
  }, "Culprit");

  const judgement = addStruct(disputes.Judgement, {
    isWorkReportValid: bool,
    index: u16,
    signature: bytes64,
  }, "Judgement");

  const verdict = addStruct(disputes.Verdict, {
    workReportHash: hash,
    votesEpoch: u32,
    votes: add(codec.sequenceFixLen(judgement.Codec, spec.validatorsSuperMajority), {
      type: 'array',
      value: judgement,
      len: spec.validatorsSuperMajority,
    })
  }, "Verdict");

  const disputesExtrinsic = addStruct(disputes.DisputesExtrinsic, {
    verdicts: add(codec.sequenceVarLen(disputes.Verdict.Codec), {
      type: 'sequence',
      value: verdict,
    }),
    culprits: add(codec.sequenceVarLen(disputes.Culprit.Codec), {
      type: 'sequence',
      value: culprit,
    }),
    faults: add(codec.sequenceVarLen(disputes.Fault.Codec), {
      type: 'sequence',
      value: fault,
    }),
  }, "Disputes Extrinsic");

  const credential = addStruct(gaurantees.Credential, {
    validatorIndex: u16,
    signature: bytes64,
  }, "Credential");

  const workPackageSpec = addStruct(workReport.WorkPackageSpec, {
    length: u32,
    hash: hash,
    erasureRoot: hash,
    exportsRoot: hash,
    exportsCount: u16
  }, "Work Package Spec");

  const context = addStruct(refineContext.RefineContext, {
    anchor: hash,
    stateRoot: hash,
    beefyRoot: hash,
    lookupAnchor: hash,
    lookupAnchorSlot: u32,
    prerequisites: add(codec.sequenceVarLen(hash.Codec), {
      type: 'sequence',
      value: hash,
    }),
  }, "Refine Context");

  const segmentRootLookupItem = addStruct(workReport.SegmentRootLookupItem, {
    workPackageHash: hash,
    segmentTreeRoot: hash
  }, "Segment Root Lookup Item");

  addStruct(PackageInfo, {
    packageHash: hash,
    refineContext: context,
  }, "Package Info");

  const importSpec = addStruct(workItem.ImportSpec, {
    treeRoot: hash,
    index: u16,
  }, "Import Spec");

  const workItemExtrinsicSpec = addStruct(workItem.WorkItemExtrinsicSpec, {
    hash: hash,
    len: u32,
  }, "Work Item Extrinsic Spec");

  addStruct(workItem.WorkItem, {
    service: u32,
    codeHash: hash,
    payload: blob,
    refineGasLimit: u64,
    accumulateGasLimit: u64,
    importSegments: add(codec.sequenceVarLen(importSpec.Codec), {
      type: 'sequence',
      value: importSpec,
    }),
    extrinsic: add(codec.sequenceVarLen(workItemExtrinsicSpec.Codec), {
      type: 'sequence',
      value: workItemExtrinsicSpec,
    }),
    exportCount: u16
  }, "Work Item");

  const workExecResult = add(workResult.WorkExecResult.Codec, {
    type: 'enum',
    value: {
      ok: {
        idx: 0,
        type: 'lookupEntry',
        value: blob,
      },
      error: {
        idx: 1,
        type: 'void',
      }
    },
    innerDocs: {}
  }, "Work Exec Result");

  const wresult = addStruct(workResult.WorkResult, {
    serviceId: u32,
    codeHash: hash,
    payloadHash: hash,
    gas: u64,
    result: workExecResult,
  }, "Work Result");

  const report = addStruct(workReport.WorkReport, {
    workPackageSpec,
    context,
    coreIndex: u16,
    authorizerHash: hash,
    authorizationOutput: blob,
    segmentRootLookup: add(codec.sequenceVarLen(workReport.SegmentRootLookupItem.Codec), {
      type: 'sequence',
      value: segmentRootLookupItem
    }),
    results: add(codec.sequenceVarLen(workResult.WorkResult.Codec), {
      type: "sequence",
      value: wresult
    }),
  }, "Work Report");

  const reportGuarantee = addStruct(gaurantees.ReportGuarantee, {
    report,
    slot: u32,
    credentials: add(codec.sequenceVarLen(gaurantees.Credential.Codec), {
      type: 'sequence',
      value: credential
    })
  }, "Report Guarantee");

  const guaranteesExtrinsic = add(gaurantees.guaranteesExtrinsicCodec, {
    type: 'sequence',
    value: reportGuarantee,
  }, "Gaurantees Extrinsic");

  const signedTicket = addStruct(tickets.SignedTicket, {
    attempt: u8,
    signature: bandersnatchProof
  }, "Signed Ticket");

  const ticketsExtrinsic = add(tickets.ticketsExtrinsicCodec, {
    type: 'sequence',
    value: signedTicket,
  }, "Tickets Extrinsic");

  const pImage = addStruct(preimage.Preimage, {
    requester: u32,
    blob
  }, "Preimage");

  const preimagesExtrinsic = add(preimage.preimagesExtrinsicCodec, {
    type: 'sequence',
    value: pImage
  }, "Preimages Extrinsic");

  const extrinsic = addStruct(Extrinsic, {
    tickets: ticketsExtrinsic,
    preimages: preimagesExtrinsic,
    guarantees: guaranteesExtrinsic,
    assurances: assurancesExtrinsic,
    disputes: disputesExtrinsic
  }, "Extrinsic");

  addStruct(Block, {
    header,
    extrinsic
  }, "Block");


  return {
    metadata,
    lookup,
    dynCodecs,
    initial: header,
  };

  function lookup(id: number): LookupEntryWithCodec | undefined {
    return metadata[id];
  }

  function dynCodecs(id: number) {
    // build a whole map and instead of special casing, rather convert based on the structure.
    const entry = lookup(id);
    if (!entry) {
      throw new Error(`No entry for ${id}`);
    }
    (entry.Codec as any).context = spec;
    return entry.Codec;
  }

  function add<T, V>(codec: jamCodec.Descriptor<T, V>, v: Var, name?: string) {
    id++;
    metadata[id] = {
      id,
      name,
      Codec: codec as jamCodec.Descriptor<unknown>,
      ...v,
    };
    return metadata[id];
  }
  
  function addStruct<T, V>(
    clazz: CodecConstructor<T, V>,
    fields: Fields<T>,
    name: string,
  ) {
    return add(clazz.Codec, {
      type: 'struct',
      value: fields as unknown as StringRecord<LookupEntry>,
      innerDocs: {},
    }, name);
  }
}

type Fields<T> = {
  [K in PropertyKeys<T>]: LookupEntry;
};

type PropertyKeys<T> = {
  // eslint-disable-next-line
  [K in Extract<keyof T, string>]: T[K] extends Function ? never : K;
}[Extract<keyof T, string>];

type CodecConstructor<T, V> = {
  Codec: jamCodec.Descriptor<T, V>;
  name: string;
};
