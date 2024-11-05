import {
  accountsByExtension$,
  extensionAccounts$,
  selectedExtensions$,
} from "@/extension-accounts.state"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { state, useStateObservable } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { InjectedExtension } from "polkadot-api/pjs-signer"
import React from "react"
import { combineLatest, distinctUntilChanged, map, merge, of, tap } from "rxjs"

const Accounts: React.FC<{ extension: InjectedExtension }> = ({
  extension,
}) => {
  const accounts = useStateObservable(extensionAccounts$(extension.name))

  return (
    <SelectGroup>
      <SelectLabel>{extension.name}</SelectLabel>
      {accounts.map((account) => (
        <SelectItem
          key={account.address}
          value={account.address + "-" + extension.name}
        >
          {account.name ?? account.address}
        </SelectItem>
      ))}
    </SelectGroup>
  )
}

const [valueSelected$, selectValue] = createSignal<string>()

const LS_KEY = "selected-signer"
const selectedValue$ = state(
  merge(
    of(localStorage.getItem(LS_KEY)),
    valueSelected$.pipe(tap((v) => localStorage.setItem(LS_KEY, v))),
  ),
  null,
)

export const selectedAccount$ = state(
  combineLatest([selectedValue$, accountsByExtension$]).pipe(
    map(([selectedAccount, accountsByExtension]) => {
      if (!selectedAccount) return null
      const [address, ...rest] = selectedAccount.split("-")
      const signer = rest.join("-")

      const accounts = accountsByExtension.get(signer)
      if (!accounts) return null
      return accounts.find((account) => account.address === address) ?? null
    }),
    distinctUntilChanged(),
  ),
  null,
)

export const AccountProvider: React.FC = () => {
  const value = useStateObservable(selectedValue$)
  const extensions = useStateObservable(selectedExtensions$)

  const activeExtensions = [...extensions.values()].filter((v) => !!v)

  if (!activeExtensions.length) return null

  return (
    <Select value={value ?? ""} onValueChange={selectValue}>
      <SelectTrigger>
        <SelectValue placeholder="Select an account" />
      </SelectTrigger>
      <SelectContent>
        {activeExtensions.map((extension) => (
          <Accounts key={extension.name} extension={extension} />
        ))}
      </SelectContent>
    </Select>
  )
}
