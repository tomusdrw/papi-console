import { PolkadotIdenticon } from "@/components/PolkadotIdenticon"
import { useSynchronizeInput } from "@/components/useSynchroniseInput"
import {
  accountDetail$,
  accounts$,
  getAccountMapKey,
  getPublicKey,
} from "@/extension-accounts.state"
import { identity$, isVerified } from "@/identity.state"
import { EditAccountId, NOTIN } from "@codec-components"
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react"
import {
  getSs58AddressInfo,
  SS58String,
} from "@polkadot-api/substrate-bindings"
import { state, useStateObservable } from "@react-rxjs/core"
import { combineKeys } from "@react-rxjs/utils"
import { CheckCircle } from "lucide-react"
import { FC, useState } from "react"
import { map, switchMap, take } from "rxjs"
import { twMerge } from "tailwind-merge"

const hintedAccounts$ = state(
  combineKeys(
    accounts$.pipe(map((accounts) => [...accounts.keys()])),
    (account) =>
      accounts$.pipe(
        map((v) => v.get(account)!),
        take(1),
        switchMap((details) =>
          identity$(details.address).pipe(
            map((identity) => ({
              address: details.address,
              name: identity?.displayName ?? details.name,
              isVerified: isVerified(identity),
            })),
          ),
        ),
      ),
  ).pipe(map((v) => new Map(v))),
  new Map<
    string,
    {
      address: string
      name: string | undefined
      isVerified: boolean | undefined
    }
  >(),
)

export const CAccountId: EditAccountId = ({ value, onValueChanged }) => {
  const [localInput, setLocalInput] = useSynchronizeInput(
    value,
    onValueChanged,
    parseValue,
  )
  const accounts = useStateObservable(hintedAccounts$)
  const valueIdentity = useStateObservable(
    identity$(value === NOTIN ? "" : value),
  )

  const [query, setQuery] = useState("")
  const queryInfo = getSs58AddressInfo(query)
  const filteredAccounts =
    query === ""
      ? Array.from(accounts.values())
      : Array.from(accounts.values()).filter(
          (account) =>
            account.address.toLowerCase().includes(query.toLowerCase()) ||
            (account.name &&
              account.name.toLowerCase().includes(query.toLowerCase())),
        )

  return (
    <Combobox
      value={localInput}
      onChange={(v) => setLocalInput(v ?? "")}
      onClose={() => setQuery("")}
      immediate
    >
      <ComboboxButton
        className={twMerge(
          "text-sm border rounded p-2 border-polkadot-200 leading-tight text-white focus-within:outline",
          "flex items-center gap-2 bg-polkadot-900",
          value === NOTIN ? "border-orange-400" : null,
        )}
      >
        {localInput && (
          <PolkadotIdenticon
            className="flex-shrink-0"
            publicKey={getPublicKey(localInput)}
            size={20}
          />
        )}
        <ComboboxInput
          className="bg-transparent outline-none w-full select-all"
          aria-label="AccountId"
          displayValue={(address: string) =>
            valueIdentity?.displayName ??
            accounts.get(getAccountMapKey(address))?.name ??
            address
          }
          onChange={(event) => setQuery(event.target.value)}
        />
      </ComboboxButton>
      <ComboboxOptions
        anchor="bottom start"
        className={twMerge(
          "max-h-96 rounded border border-black p-2 bg-polkadot-800 [--anchor-gap:4px]",
        )}
      >
        {filteredAccounts.length > 0 ? (
          filteredAccounts.map((account) => (
            <AccountOption
              key={account.address}
              account={account.address}
              publicKey={getPublicKey(account.address)}
            />
          ))
        ) : queryInfo.isValid ? (
          <AccountOption account={query} publicKey={queryInfo.publicKey} />
        ) : (
          <div className="text-slate-400">
            The value is not a valid Account ID
          </div>
        )}
      </ComboboxOptions>
    </Combobox>
  )
}

const AccountOption: FC<{ account: string; publicKey: Uint8Array | null }> = ({
  account,
  publicKey,
}) => {
  const details = useStateObservable(accountDetail$(account))
  const identity = useStateObservable(identity$(account))

  const name = identity?.displayName ?? details?.name

  return (
    <ComboboxOption
      value={account}
      className="data-[focus]:bg-polkadot-700 cursor-pointer flex flex-row items-center gap-2 p-1 rounded overflow-hidden"
    >
      <PolkadotIdenticon
        className="flex-shrink-0"
        publicKey={publicKey}
        size={32}
      />
      <div className="flex flex-col justify-center text-white leading-tight overflow-hidden">
        {name && (
          <span className="inline-flex items-center gap-1">
            {name}
            {isVerified(identity) && (
              <CheckCircle size={16} className="text-green-400" />
            )}
          </span>
        )}
        <span className="text-slate-400 text-ellipsis overflow-hidden">
          {account}
        </span>
      </div>
    </ComboboxOption>
  )
}

const getValidationError = (value: string) => {
  if (value === "") return null
  const { isValid } = getSs58AddressInfo(value)
  return isValid ? null : "Invalid address"
}
const parseValue = (value: string): SS58String | NOTIN => {
  if (value.trim() === "") return NOTIN
  if (getValidationError(value)) return NOTIN
  return value
}
