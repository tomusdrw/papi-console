import { FC, PropsWithChildren, useEffect, useState } from "react"
import { twMerge } from "tailwind-merge"

export const Loading: FC<PropsWithChildren> = ({ children }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const token = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(token)
  }, [])

  return (
    <div
      className={twMerge(
        "text-center p-2 text-xl text-slate-400 opacity-0 transition-opacity",
        visible && "opacity-100",
      )}
    >
      {children}
    </div>
  )
}

export const LoadingMetadata: FC = () => (
  <Loading>Waiting for metadata…</Loading>
)
export const LoadingBlocks: FC = () => <Loading>Waiting for blocks…</Loading>
