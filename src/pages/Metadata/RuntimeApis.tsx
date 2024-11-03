import { SearchableSelect } from "@/components/Select"
import { V14, V15 } from "@polkadot-api/substrate-bindings"
import { FC, useEffect, useState } from "react"
import { LookupLink } from "./Lookup"
import { DocsRenderer } from "@/components/DocsRenderer"

type Api = (V14 | V15)["apis"][number]
type Method = Api["methods"] extends Array<infer R> ? R : never
export const RuntimeApis: FC<{ apis: Array<Api> }> = ({ apis }) => {
  const [api, setApi] = useState<Api | null>(null)
  const [method, setMethod] = useState<Method | null>(null)

  useEffect(() => {
    setMethod(null)
  }, [api])

  return (
    <div className="border rounded p-2 flex flex-col gap-2">
      <h3 className="font-bold text-xl">Runtime APIs</h3>
      <label className="self-start">
        API:{" "}
        <SearchableSelect
          value={api}
          setValue={setApi}
          options={apis.map((a) => ({
            text: a.name,
            value: a,
          }))}
        />
      </label>
      {api && (
        <label className="self-start">
          Method:{" "}
          <SearchableSelect
            value={method}
            setValue={setMethod}
            options={api.methods.map((m) => ({
              text: m.name,
              value: m,
            }))}
          />
        </label>
      )}
      {method && (
        <>
          <DocsRenderer docs={method.docs} />
          {method.inputs.length && (
            <div>
              <h4>Inputs</h4>
              <ol>
                {method.inputs.map(({ name, type }) => (
                  <li key={name}>
                    <h5>{name}</h5>
                    <LookupLink id={type} />
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div>
            <h4>Output</h4>
            <LookupLink id={method.output} />
          </div>
        </>
      )}
    </div>
  )
}
