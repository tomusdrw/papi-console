import {BinaryEditButton} from "@/components/BinaryEditButton"
import {TextInputField} from "@/components/TextInputField";
import {NOTIN} from "@polkadot-api/react-builder";
import {bytes} from "@typeberry/block";
import {Binary} from "polkadot-api";
import {useCallback, useEffect, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {twMerge} from "tailwind-merge";

function decode(val: Uint8Array) {
  if (val.length === 0) {
    return NOTIN;
  }
  return Binary.fromBytes(val);
}

type InitialBinaryProps = {
  isValid: boolean;
  value: Binary | undefined;
  onChange: (b: Binary | undefined) => void;
  onError: (s: string) => void;
};
export function InitialBinary({ onChange, value: propsValue, isValid, onError }: InitialBinaryProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [value, setValue] = useState(searchParams.get('data') || '0x');
  
  // propagate error upwards
  useEffect(() => {
    onError(error);
  }, [error, onError]);

  const handleChange = useCallback((v: string) => {
    try {
      setError('');
      setValue(v);
      setSearchParams(x => {
        x.set('data', v);
        return x;
      });
      const val = bytes.BytesBlob.parseBlob(v);
      onChange(Binary.fromBytes(val.raw));
    } catch (e) {
      const err = `${e}`;
      // get rid of value dump in the error message.
      setError(err.substring(0, err.indexOf('Invalid hex string')));
    }
  }, [onChange, setSearchParams]);

  useEffect(() => {
    if (propsValue) {
      handleChange(propsValue.asHex());
    }
  }, [propsValue]);

  // initial onChange
  useEffect(() => {
    handleChange(value);
  }, [handleChange]);

  const isError = !!error;
  const binaryValue = value !== undefined ? Binary.fromHex(value).asBytes() : undefined;

  return (
    <div className="px-2 w-full">
      <TextInputField
        value={value}
        onChange={handleChange}
        placeholder={"0x"}
        className="min-w-80 border-none p-0 outline-none bg-transparent flex-1"
        warn={!isValid}
        error={isError}
      >
        {(input) => (
          <div
            className={twMerge(
              "px-4 py-2 border border-border rounded leading-tight focus-within:outline focus-within:outline-1 flex flex-1 items-center gap-2 bg-input",
              !isValid ? "border-orange-400" : null,
              isError ? "border-red-600" : null,
            )}
          >
            {input}
            <div className="flex gap-2 items-center h-5">
              <BinaryEditButton
                initialValue={binaryValue}
                onValueChange={(decoded: Binary) => {
                  setValue(decoded.asHex());
                  onChange(decoded);
                  return true
                }}
                decode={decode}
                iconProps={{
                  size: 24,
                }}
              />
            </div>
          </div>)}
      </TextInputField>
    </div>
  )
}
