import { createSignal } from "@react-rxjs/utils"
import { state } from "@react-rxjs/core"
import { defer, map, scan } from "rxjs"

export const [collapsedToggle$, toggleCollapsed] = createSignal<string>()

const collapsedPaths$ = state(
  defer(() =>
    collapsedToggle$.pipe(
      scan((acc, v) => {
        if (acc.has(v)) acc.delete(v)
        else acc.add(v)
        return acc
      }, new Set<string>()),
    ),
  ),
  new Set(),
)

export const isCollapsed$ = state(
  (path: string) => collapsedPaths$.pipe(map((v) => v.has(path))),
  false,
)

/**
 * Returns true if it's a collapsed root.
 * Same as `isCollapsed`, but returns `false` if a parent path is also collapsed.
 */
export const isCollapsedRoot$ = state(
  (path: string) =>
    collapsedPaths$.pipe(
      map((collapsedPaths) => {
        if (!collapsedPaths.has(path)) return false

        return !Array.from(collapsedPaths).some(
          (otherPath) => otherPath !== path && path.startsWith(otherPath),
        )
      }),
    ),
  false,
)

export const [hoverChange$, setHovered] = createSignal<{
  id: string
  hover: boolean
}>()

const hoverPaths$ = state(
  defer(() =>
    hoverChange$.pipe(
      scan((acc, v) => {
        if (v.hover) acc.add(v.id)
        else acc.delete(v.id)
        return acc
      }, new Set<string>()),
    ),
  ),
  new Set(),
)

export const isActive$ = state(
  (path: string) =>
    hoverPaths$.pipe(
      map((hoverPaths) => {
        if (!hoverPaths.has(path)) return false

        // Here it's the opposite of `isCollapsedRoot`: We don't want to highlight the root if a child is being highlighted
        return !Array.from(hoverPaths).some(
          (otherPath) => otherPath !== path && otherPath.startsWith(path),
        )
      }),
    ),
  false,
)
