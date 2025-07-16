import {
  getMarketsRegionIdOrders,
  getUniverseTypesTypeId,
  postUniverseIds,
} from './esi'
import typeMaterials from './assets/typeMaterials.json'
import { THE_FORGE_REGION_ID } from './constants'

type TypeMaterials = typeof typeMaterials

export const computeGasValue =
  (typeMaterials: TypeMaterials) => async (name: string, quantity: number) => {
    const typeIdRes = await postUniverseIds([name])
    if (typeIdRes.type == 'ok' && typeIdRes.value.inventory_types) {
      const typeId = typeIdRes.value.inventory_types[0].id
      const compressed = Object.entries(typeMaterials).find(
        ([, { materials }]) =>
          materials.find(
            ({ materialTypeID, quantity }) =>
              materialTypeID == typeId && quantity == 1,
          ),
      )
      if (!compressed) {
        throw new Error('input contains non-gas item')
      }
      const [compressedTypeId] = compressed
      const ordersRes = await getMarketsRegionIdOrders(
        THE_FORGE_REGION_ID,
        'buy',
        {
          typeId: Number.parseInt(compressedTypeId),
        },
      )
      if (ordersRes.type != 'ok') {
        throw new Error('get order failed')
      }
      const orders = ordersRes.value
        .filter(x => x.volume_total > 100)
        .sort((a, b) => b.price - a.price)
      if (orders.length == 0) {
        return [name, quantity, -1, -1] as const
      }
      // 名称 数量 单价 总价
      return [
        name,
        quantity,
        orders[0].price,
        orders[0].price * quantity,
      ] as const
    } else {
      throw new Error('input contains invalid item')
    }
  }

export const computeGasValueById =
  (
    typeMaterials: TypeMaterials,
    options?: {
      ignoreInvalidItem: boolean
    },
  ) =>
  async (typeId: number, quantity: number) => {
    const item = await getUniverseTypesTypeId(typeId)
    if (item.type != 'ok') {
      throw new Error('ESI failed')
    }

    const compressed = Object.entries(typeMaterials).find(([, { materials }]) =>
      materials.find(
        ({ materialTypeID, quantity }) =>
          materialTypeID == typeId && quantity == 1,
      ),
    )
    if (!compressed) {
      if (options?.ignoreInvalidItem) {
        return [
          item.value.name,
          quantity,
          -1,
          -1,
          item.value.volume || -1,
        ] as const
      } else {
        throw new Error('input contains non-gas item')
      }
    }
    const [compressedTypeId] = compressed
    const ordersRes = await getMarketsRegionIdOrders(
      THE_FORGE_REGION_ID,
      'buy',
      {
        typeId: Number.parseInt(compressedTypeId),
      },
    )
    if (ordersRes.type != 'ok') {
      throw new Error('get order failed')
    }
    const orders = ordersRes.value
      .filter(x => x.volume_total > 100)
      .sort((a, b) => b.price - a.price)
    if (orders.length == 0) {
      return [
        item.value.name,
        quantity,
        -1,
        -1,
        item.value.volume || -1,
      ] as const
    }
    // 名称 数量 单价 总价 体积
    return [
      item.value.name,
      quantity,
      orders[0].price,
      orders[0].price * quantity,
      item.value.volume || -1,
    ] as const
  }
