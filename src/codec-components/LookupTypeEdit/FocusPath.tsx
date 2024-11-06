import { lookupToType, TypeIcon, TypeIcons } from "@/components/Icons"
import { getLookupFn, Var } from "@polkadot-api/metadata-builders"
import { V14, V15 } from "@polkadot-api/substrate-bindings"
import { FC, ReactElement } from "react"
import { twMerge as clsx } from "tailwind-merge"

export const FocusPath: FC<{
  metadata: V14 | V15
  typeId: number
  value: string[] | null
  onFocus: (value: string[] | null) => void
}> = ({ metadata, typeId, value, onFocus }) => {
  const breadcrumbs = getBreadcrumbs(metadata, typeId, value ?? [], onFocus)

  return (
    <div className="flex-shrink-0 px-2">
      <div className="flex max-w-full flex-wrap gap-1 items-center border border-polkadot-700 text-sm px-2 py-1">
        {breadcrumbs.map((v, i) => (
          <span key={i} className="whitespace-nowrap flex gap-1 items-center">
            {i > 0 && <span className="text-slate-500 mx-2">&gt;</span>}
            {v.icon}
            {v.label}
          </span>
        ))}
      </div>
    </div>
  )
}

type Breadcrumb = {
  icon?: ReactElement | null
  label: ReactElement
}
type BreadcrumbNode = {
  type?: TypeIcon
  label: string
}

function getBreadcrumbs(
  metadata: V14 | V15,
  typeId: number,
  path: string[],
  onFocus: (value: string[] | null) => void,
): Breadcrumb[] {
  const lookup = getLookupFn(metadata)
  const nodes: BreadcrumbNode[] = [
    {
      label: "Root",
    },
  ]
  let lookupType: Var = lookup(typeId)
  for (let i = 0; i < path.length; i++) {
    nodes.push({
      type: lookupToType[lookupType.type],
      label: path[i],
    })

    switch (lookupType.type) {
      case "option":
        throw new Error("TODO Option breadcrumb not implemented")
      case "result":
        throw new Error("TODO Result breadcrumb not implemented")
      case "array":
      case "sequence":
        lookupType = lookupType.value
        break
      case "tuple":
        lookupType = lookupType.value[Number(path[i])]
        break
      case "enum": {
        const inner = lookupType.value[path[i]]
        lookupType = inner.type === "lookupEntry" ? inner.value : inner
        break
      }
      case "struct":
        lookupType = lookupType.value[path[i]]
        break
    }
  }

  const breadcrumbs: Breadcrumb[] = []
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const label =
      i === nodes.length - 1 ? (
        <span>{node.label}</span>
      ) : (
        <a
          href="#"
          className={clsx("hover:text-polkadot-500", i === 0 && "font-bold")}
          onClick={(evt) => {
            evt.preventDefault()
            onFocus(i === 0 ? null : path.slice(0, i))
          }}
        >
          {node.label}
        </a>
      )

    if (i > 0 && nodes[i - 1].type === node.type) {
      const previousBreadcrumb = breadcrumbs[breadcrumbs.length - 1]
      const previousLabel = previousBreadcrumb.label
      previousBreadcrumb.label = (
        <>
          {previousLabel}
          <span className="text-slate-500">/</span>
          {label}
        </>
      )
    } else {
      const Icon = node.type && TypeIcons[node.type]
      breadcrumbs.push({
        icon: Icon ? <Icon size={15} className="text-polkadot-600 mr-1" /> : null,
        label,
      })
    }
  }

  return breadcrumbs
}
