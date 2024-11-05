import { BehaviorSubject, Observable } from "rxjs"

interface Formatter<R> {
  parse: (value: string) => R
  stringify: (value: string) => string
}
interface LocalStorageSubject {
  <R>(
    key: string,
    formatter: Formatter<R>,
  ): {
    stream$: Observable<R | null>
    setValue: (v: R | ((old: R) => R)) => void
    getValue: () => R | null
    clear: () => void
  }
  <R>(
    key: string,
    formatter: Formatter<R>,
    defaultValue: R,
  ): {
    stream$: Observable<R>
    setValue: (v: R | ((old: R) => R)) => void
    getValue: () => R
    clear: () => void
  }
}
export const localStorageSubject: LocalStorageSubject = (
  key,
  formatter,
  defaultValue = null,
) => {
  const subject = new BehaviorSubject(defaultValue)
  try {
    const value = localStorage.getItem(key)
    subject.next(value ? formatter.parse(value) : defaultValue)
  } catch (_) {
    /* empty */
  }

  return {
    stream$: subject.asObservable(),
    setValue: (value) => {
      const reducer = typeof value === "function" ? value : () => value
      const newValue = (reducer as any)(subject.getValue())
      localStorage.setItem(key, formatter.stringify(newValue))
      subject.next(newValue)
    },
    getValue: () => subject.getValue(),
    clear: () => {
      localStorage.removeItem(key)
      subject.next(defaultValue)
    },
  }
}
