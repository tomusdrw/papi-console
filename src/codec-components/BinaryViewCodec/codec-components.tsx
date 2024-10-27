import {
  EditAccountId,
  EditBigNumber,
  EditBool,
  EditBytes,
  EditEthAccount,
  EditNumber,
  EditOption,
  EditPrimitiveComponentProps,
  EditResult,
  EditStr,
  EditVoid,
  NOTIN,
} from "@codec-components"
import { u8 } from "@polkadot-api/substrate-bindings"
import { toHex } from "@polkadot-api/utils"
import { useStateObservable } from "@react-rxjs/core"
import { FC } from "react"
import { isActive$ } from "../common/paths.state"
import { useSubtreeFocus } from "../common/SubtreeFocus"

export const CVoid: EditVoid = () => null

const CPrimitive: FC<EditPrimitiveComponentProps<any>> = ({
  encodedValue,
  path,
}) => {
  const isActive = useStateObservable(isActive$(path.join(".")))
  return encodedValue ? (
    <span className={highlight(isActive)}>
      <span className={headerHighlight(isActive)}>
        {toConcatHex(encodedValue)}
      </span>
    </span>
  ) : (
    <MissingData />
  )
}
export const CBool: EditBool = CPrimitive
export const CStr: EditStr = CPrimitive
export const CEthAccount: EditEthAccount = CPrimitive
export const CBigNumber: EditBigNumber = CPrimitive
export const CNumber: EditNumber = CPrimitive
export const CAccountId: EditAccountId = CPrimitive
export const CBytes: EditBytes = CPrimitive

export const COption: EditOption = ({ path, value, inner }) => {
  const isActive = useStateObservable(isActive$(path.join(".")))
  const focus = useSubtreeFocus()
  const sub = focus.getNextPath(path)
  if (sub) {
    return inner
  }
  if (value === NOTIN) return <MissingData />

  // TODO Looking at scale-ts, Option<Boolean> seems to be 00, 01 or 02! (None, Some(true), Some(false))
  // but can't find it at the docs? https://docs.substrate.io/reference/scale-codec/
  return (
    <span className={highlight(isActive)}>
      <span className={headerHighlight(isActive)}>
        {toConcatHex(u8.enc(value ? 1 : 0))}
      </span>
      {inner}
    </span>
  )
}

export const CResult: EditResult = ({ value, inner, path }) => {
  const isActive = useStateObservable(isActive$(path.join(".")))
  const focus = useSubtreeFocus()
  const sub = focus.getNextPath(path)
  if (sub) return inner

  if (value === NOTIN) return <MissingData />

  return (
    <span className={highlight(isActive)}>
      <span className={headerHighlight(isActive)}>
        {toConcatHex(u8.enc(value.success ? 0 : 1))}
      </span>
      {inner}
    </span>
  )
}

export const MissingData = () => (
  <span className="mx-0.5 text-slate-400 text-sm">(…)</span>
)
export const toConcatHex = (value: Uint8Array) => toHex(value).slice(2)
export const highlight = (isActive: boolean) =>
  isActive ? "text-polkadot-400 mx-1" : ""
export const headerHighlight = (isActive: boolean) =>
  isActive ? "text-polkadot-500" : ""
