export function synchronizeScroll(
  scrollingElement: HTMLElement,
  targetElement: HTMLElement,
) {
  let heightCache = {
    time: 0,
    targetHeight: 0,
  }
  const onScroll = async () => {
    await Promise.resolve()
    const now = Date.now()
    heightCache =
      heightCache.time > now - 500
        ? heightCache
        : {
            time: now,
            targetHeight: targetElement.getBoundingClientRect().height,
          }

    const listScrollPos =
      scrollingElement.scrollTop / scrollingElement.scrollHeight
    targetElement.scrollTop = listScrollPos * heightCache.targetHeight
  }

  scrollingElement.addEventListener("scroll", onScroll)
  // Used as scroll target for markers...
  // Otherwise smooth scroll with `element.scrollIntoView` gets interrupted.
  // This should be passed probably by context, but at this scale it works.
  ;(window as any).scrollingElement = scrollingElement
  return () => {
    scrollingElement.removeEventListener("scroll", onScroll)
    ;(window as any).scrollingElement = null
  }
}

export const scrollToMarker = (id: string[]) => {
  const element = document.getElementById("marker-" + id.join("."))
  if (!element) return

  const scrollingElement: HTMLElement = (window as any).scrollingElement
  if (scrollingElement) {
    const elementRect = element.getBoundingClientRect()
    const scrollRect = scrollingElement.getBoundingClientRect()

    scrollingElement.scrollBy({
      top: elementRect.top - scrollRect.top - 50,
      behavior: "smooth",
    })
  } else {
    element.scrollIntoView({ behavior: "instant" })
  }
}
