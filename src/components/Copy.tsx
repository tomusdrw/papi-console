import { CheckCircle, Copy } from "lucide-react"
import { useEffect, useState } from "react"

export const CopyText: React.FC<{ text: string; disabled?: boolean }> = ({
  text,
  disabled = false,
}) => {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (disabled) return

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
      className={disabled ? "opacity-50" : ""}
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
