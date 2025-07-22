import { createContext, use } from 'react'
import {
  JITA_4_LOCATION_ID,
  JITA_SYSTEM_ID,
  THE_FORGE_REGION_ID,
} from './constants'
import { getMarketsRegionIdOrders } from './esi'
import { SdeContext } from './sde'

export const BuyContext = createContext({
  regionId: THE_FORGE_REGION_ID,
  systemId: JITA_SYSTEM_ID,
  locationId: JITA_4_LOCATION_ID,
  ratio: 1.0,
  orderType: 'buy',
} as {
  regionId: number
  systemId: number
  locationId: number
  ratio: number
  orderType: 'buy' | 'sell' | 'split'
})

export const useBuy = () => {
  const { regionId, systemId, locationId, ratio, orderType } = use(BuyContext)
  const { types } = use(SdeContext)

  return {
    buy: async (
      nameOrId: string | number,
      quantity: number,
    ): Promise<number> => {
      const typeId = await (async () => {
        if (typeof nameOrId == 'number') {
          return nameOrId
        } else {
          const idStr =
            Object.entries(types).find(([, v]) =>
              Object.entries(v.name).find(([, v]) => v == nameOrId),
            )?.[0] || undefined
          if (typeof idStr == 'undefined') {
            throw new Error('invalid item name')
          }
          return Number.parseInt(idStr)
        }
      })()
      switch (orderType) {
        case 'buy':
        case 'sell': {
          const buy = await getMarketsRegionIdOrders(regionId, orderType, {
            typeId,
          })
          if (buy.type == 'ok') {
            if (buy.value.length > 0) {
              return (
                buy.value
                  .filter(
                    x =>
                      x.location_id == locationId ||
                      (x.systemd_id == systemId &&
                        (x.range == 'solarsystem' ||
                          typeof x.range == 'number')) ||
                      x.range == 'region',
                  )
                  .filter(x => x.volume_total > 100)
                  .sort((a, b) => b.price - a.price)[0].price *
                quantity *
                ratio
              )
            } else {
              return -1
            }
          } else {
            throw new Error('esi faield')
          }
        }
        case 'split':
          throw new Error('unimpl split')
      }
    },
  }
}
