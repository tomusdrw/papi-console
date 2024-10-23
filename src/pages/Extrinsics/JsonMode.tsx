import { bytesToString } from "@/components/BinaryInput"
import { Binary } from "@polkadot-api/substrate-bindings"
import { FC, useMemo } from "react"
import ReactJson from "react18-json-view"
import "react18-json-view/src/style.css"
import "react18-json-view/src/dark.css"
import "./jsonView.css"

export const JsonMode: FC<{
  decode: (value: Uint8Array) => unknown
  value: Uint8Array | null
}> = ({ decode, value }) => {
  const src = useMemo(
    () => (value ? decode(value) : null),
    // value
    //   ? JSON.parse(
    //       JSON.stringify(decode(value), (_, v) =>
    //         typeof v === "bigint"
    //           ? `${v}n`
    //           : v instanceof Binary
    //             ? bytesToString(v)
    //             : v,
    //       ),
    //     )
    //   : null,
    [value, decode],
  )

  console.log(src)

  return (
    <div className="overflow-auto p-2 bg-polkadot-900 text-sm">
      <ReactJson
        src={src}
        dark
        theme="a11y"
        // customizeNode={({ node }) => {
        //   if (node instanceof Binary) {
        //     return <>{node.asHex()}</>
        //   }
        // }}
        replacer={(v) => (v instanceof Binary ? bytesToString(v) : v)}
        customizeCopy={(v) =>
          JSON.stringify(
            v,
            (_, v) =>
              typeof v === "bigint"
                ? `${v}n`
                : v instanceof Binary
                  ? bytesToString(v)
                  : v,
            2,
          )
        }
      />
    </div>
  )
}
