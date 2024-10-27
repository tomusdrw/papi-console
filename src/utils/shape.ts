import { EnumVar, StructVar, Var } from "@polkadot-api/metadata-builders"

const complexTypes = new Set<Var["type"]>([
  "array",
  "sequence",
  "struct",
  "enum",
  "result",
  "option",
])
export const isComplex = (type: Var["type"]) => complexTypes.has(type)

export const isEnumComplex = <T extends EnumVar>(
  shape: T,
  type: keyof T["value"],
): boolean => {
  const innerShape = shape.value[type]
  return isComplex(
    innerShape.type === "lookupEntry" ? innerShape.value.type : innerShape.type,
  )
}

export const getEnumInnerVar = <T extends EnumVar>(
  shape: T,
  type: keyof T["value"],
): Var => {
  const innerShape = shape.value[type]
  return innerShape.type === "lookupEntry" ? innerShape.value : innerShape
}
export const getEnumInnerType = <T extends EnumVar>(
  shape: T,
  type: keyof T["value"],
) => getEnumInnerVar(shape, type).type

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
