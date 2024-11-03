import { FC, PropsWithChildren } from "react"

export const Loading: FC<PropsWithChildren> = ({ children }) => (
  <div className="text-center p-2 text-xl text-slate-400">{children}</div>
)

export const LoadingMetadata: FC = () => (
  <Loading>Waiting for metadata…</Loading>
)
export const LoadingBlocks: FC = () => <Loading>Waiting for blocks…</Loading>
