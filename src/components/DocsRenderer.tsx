import { FC } from "react"
import { twMerge } from "tailwind-merge"

export const DocsRenderer: FC<{ docs: string[]; className?: string }> = ({
  docs,
  className,
}) => {
  if (!docs.length) return null
  if (docs.length === 1) {
    return (
      <div className={twMerge("text-sm text-foreground/60", className)}>
        <p>{docs[0]}</p>
      </div>
    )
  }

  const normalizedDocs =
    docs.length > 1 ? ["/*", ...docs.map((v) => ` *${v}`), " */"] : docs
  return (
    <div
      className={twMerge(
        "text-foreground/60 max-h-20 overflow-auto",
        normalizedDocs.length > 1 && "text-xs font-mono whitespace-pre",
        className,
      )}
    >
      {normalizedDocs.map((d, i) => (
        <p key={i}>{d}</p>
      ))}
    </div>
  )
}
