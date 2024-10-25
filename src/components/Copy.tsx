import { CheckCircle, Copy } from "lucide-react"
import { useEffect, useState } from "react"
import { twMerge } from "tailwind-merge"

export const CopyText: React.FC<{
  text: string
  disabled?: boolean
  className?: string
}> = ({ text, className, disabled = false }) => {
  const [copied, setCopied] = useState(false)
  const copy = async (evt: React.MouseEvent) => {
    if (disabled) return
    evt.stopPropagation()

    await navigator.clipboard.writeText(text)
    setCopied(true)
  }
  useEffect(() => {
    if (copied) {
      setTimeout(() => setCopied(false), 1000)
    }
  }, [copied])

  return (
    <button
      disabled={disabled || copied}
      className={twMerge(className, disabled ? "opacity-50" : "")}
      onClick={copy}
    >
      {copied ? (
        <CheckCircle size={16} className="text-green-300" />
      ) : (
        <Copy size={16} />
      )}
    </button>
  )
}
