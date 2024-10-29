import {
  ViewBigNumber,
  ViewBool,
  ViewEthAccount,
  ViewNumber,
  ViewOption,
  ViewResult,
  ViewStr,
  ViewVoid,
} from "@codec-components"

export const CBool: ViewBool = ({ value }) => {
  return <div className="flex gap-4">{value ? "Yes" : "No"}</div>
}

export const CVoid: ViewVoid = () => null

export const CEthAccount: ViewEthAccount = ({ value }) => <span>{value}</span>

export const COption: ViewOption = ({ value, inner }) => {
  const selected = value !== undefined
  return (
    <div>{selected ? inner : <span className="text-slate-400">None</span>}</div>
  )
}

export const CResult: ViewResult = ({ value, inner }) => {
  return (
    <div>
      <div>{value.success ? "OK" : "KO"}</div>
      {inner}
    </div>
  )
}

export const CStr: ViewStr = ({ value }) => <div>{value}</div>
export const CNumber: ViewNumber = ({ value }) => <div>{value}</div>
export const CBigNumber: ViewBigNumber = ({ value }) => (
  <div>{String(value)}</div>
)
