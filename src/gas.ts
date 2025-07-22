import { use } from 'react'
import { SdeContext } from './sde'

export const useGasConversion = () => {
  const { typeMaterials, types } = use(SdeContext)

  return {
    compress: (typeId: number) => {
      const typeIdStr = Object.entries(typeMaterials).find(([, v]) =>
        v.materials.find(x => x.materialTypeID == typeId),
      )?.[0]
      return typeIdStr ? Number.parseInt(typeIdStr) : undefined
    },
    uncompress: (typeId: number) => {
      const typeIdStr = typeId.toString()
      if (typeIdStr in typeMaterials) {
        return typeMaterials[typeIdStr as keyof typeof typeMaterials]
          .materials[0].materialTypeID
      } else {
        return undefined
      }
    },
    nameOf: (typeId: number) => {
      const typeIdStr = typeId.toString()
      if (typeIdStr in types) {
        return types[typeIdStr as keyof typeof types].name.zh
      } else {
        return undefined
      }
    },
    typeIdOf: (name: string) => {
      const typeIdStr = Object.entries(types).find(([, v]) =>
        Object.entries(v.name).find(([, v]) => v == name),
      )?.[0]
      if (typeIdStr) {
        return Number.parseInt(typeIdStr)
      } else {
        return undefined
      }
    },
  }
}
