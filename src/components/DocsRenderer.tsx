import { FC } from "react"
import { twMerge } from "tailwind-merge"

export const DocsRenderer: FC<{ docs: string[] }> = ({ docs }) => {
  if (!docs.length) return null
  if (docs.length === 1) {
    return (
      <div className="text-sm text-slate-400">
        <p>{docs[0]}</p>
      </div>
    )
  }

  const normalizedDocs =
    docs.length > 1 ? ["/*", ...docs.map((v) => ` *${v}`), " */"] : docs
  return (
    <div
      className={twMerge(
        "text-slate-400 max-h-20 overflow-auto",
        normalizedDocs.length > 1 && "text-sm font-mono whitespace-pre",
      )}
    >
      {normalizedDocs.map((d, i) => (
        <p key={i}>{d}</p>
      ))}
    </div>
  )
}
