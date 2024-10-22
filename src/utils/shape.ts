import { EnumVar, StructVar } from "@polkadot-api/metadata-builders"

const complexTypes = new Set(["array", "sequence", "struct", "enum", "result"])
export const isComplex = (type: string) => complexTypes.has(type)

export const isEnumComplex = <T extends EnumVar>(
  shape: T,
  type: keyof T["value"],
): boolean => {
  const innerShape = shape.value[type]
  return isComplex(
    innerShape.type === "lookupEntry" ? innerShape.value.type : innerShape.type,
  )
}

export const getEnumInnerType = <T extends EnumVar>(
  shape: T,
  type: keyof T["value"],
) => {
  const innerShape = shape.value[type]
  return innerShape.type === "lookupEntry"
    ? innerShape.value.type
    : innerShape.type
}

export const getStructInnerType = <T extends StructVar>(
  shape: T,
  key: keyof T["value"],
) => {
  return shape.value[key].type
}

export const isEnumVoid = <T extends EnumVar>(
  shape: T,
  type: keyof T["value"],
): boolean => {
  const innerShape = shape.value[type]
  const innerType =
    innerShape.type === "lookupEntry" ? innerShape.value.type : innerShape.type
  return innerType === "void"
}

export const getFinalType = (shape: any, name: string) => {
  const innerType = shape.value[name]
  switch (innerType.type) {
    case "primitive":
      return innerType.value
    case "compact":
      return innerType.size
    case "AccountId20":
    case "AccountId32":
      return innerType.type
  }
}
