import { V15 } from "@polkadot-api/substrate-bindings"
import { FC } from "react"
import { LookupLink } from "./Lookup"
import { CopyText } from "@/components/Copy"

export const V15Fields: FC<{ metadata: V15 }> = ({ metadata }) => {
  return (
    <>
      <div className="border rounded p-2 flex flex-col gap-2">
        <h3 className="font-bold text-xl">Outer Enums</h3>
        <div>
          <h4>Call</h4>
          <LookupLink id={metadata.outerEnums.call} />
        </div>
        <div>
          <h4>Event</h4>
          <LookupLink id={metadata.outerEnums.event} />
        </div>
        <div>
          <h4>Error</h4>
          <LookupLink id={metadata.outerEnums.error} />
        </div>
      </div>
      {metadata.custom.length > 0 && (
        <div className="border rounded p-2 flex flex-col gap-2">
          <h3 className="font-bold text-xl">Custom</h3>
          {Object.entries(
            metadata.custom.map(([key, { type, value }]) => (
              <div key={key}>
                <h4>{key}</h4>
                <LookupLink id={type} />
                <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                  <CopyText text={value} binary className="mr-2" />
                  {value}
                </div>
              </div>
            )),
          )}
        </div>
      )}
    </>
  )
}
