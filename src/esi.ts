import { ESI_BASE_URL } from './constants'
import { Result } from './result'

const GENERIC_HEADERS: HeadersInit = {
  'Accept-Language': 'zh',
}

export const getUniverseGroupsGroupId = (
  groupId: number,
): Promise<
  Result<
    {
      category_id: number
      group_id: number
      name: string
      published: boolean
      types: number[]
    },
    {
      error: string
      timeout?: number
    }
  >
> =>
  fetch(new URL(`/universe/groups/${groupId}`, ESI_BASE_URL), {
    headers: GENERIC_HEADERS,
  }).then(res =>
    res.ok
      ? res.json().then(res => ({
          type: 'ok',
          value: res,
        }))
      : res.json().then(res => ({
          type: 'err',
          value: res,
        })),
  )

export const getUniverseTypesTypeId = (
  typeId: number,
): Promise<
  Result<
    {
      capacity?: number
      description: string
      dogma_attributes?: {
        attribute_id: number
        value: number
      }[]
      dogma_effects?: {
        effect_id: number
        is_default: boolean
      }[]
      graphic_id?: number
      group_id: number
      icon_id?: number
      market_group_id?: number
      mass?: number
      name: string
      packaged_volume?: number
      portion_size?: number
      published: boolean
      radius?: number
      type_id: number
      volume?: number
    },
    {
      error: string
      timeout?: number
    }
  >
> =>
  fetch(new URL(`/universe/types/${typeId}`, ESI_BASE_URL), {
    headers: GENERIC_HEADERS,
  }).then(res =>
    res.ok
      ? res.json().then(res => ({
          type: 'ok',
          value: res,
        }))
      : res.json().then(res => ({
          type: 'err',
          value: res,
        })),
  )

export const getMarketsRegionIdOrders = (
  regionId: number,
  orderType: 'buy' | 'sell' | 'all',
  options: {
    typeId?: number
    page?: number
  },
): Promise<
  Result<
    {
      duration: number
      is_buy_order: boolean
      issued: string
      location_id: number
      min_volume: number
      order_id: number
      price: number
      range: string
      systemd_id: number
      type_id: number
      volume_remain: number
      volume_total: number
    }[],
    {
      timeout?: number
      error: string
    }
  >
> =>
  fetch(
    new URL(
      `/markets/${regionId}/orders/?${(() => {
        const search = new URLSearchParams({
          order_type: orderType,
        })
        if (options.typeId !== null && options.typeId !== undefined) {
          search.set('type_id', options.typeId.toString())
        }
        if (options.page !== null && options.page !== undefined) {
          search.set('page', options.page.toString())
        }
        return search.toString()
      })()}`,
      ESI_BASE_URL,
    ),
    {
      headers: GENERIC_HEADERS,
    },
  ).then(res =>
    res.ok
      ? res.json().then(res => ({
          type: 'ok',
          value: res,
        }))
      : res.json().then(res => ({
          type: 'err',
          value: res,
        })),
  )

export const postUniverseIds = (
  names: string[],
): Promise<
  Result<
    {
      agents?: {
        id: number
        name: string
      }[]
      alliances?: {
        id: number
        name: string
      }[]
      characters?: {
        id: number
        name: string
      }[]
      constellations?: {
        id: number
        name: string
      }[]
      corporations?: {
        id: number
        name: string
      }[]
      factions?: {
        id: number
        name: string
      }[]
      inventory_types?: {
        id: number
        name: string
      }[]
      stations?: {
        id: number
        name: string
      }
    },
    {
      timeout?: number
      error: string
    }
  >
> =>
  fetch(new URL(`/universe/ids/`, ESI_BASE_URL), {
    method: 'POST',
    headers: {
      ...GENERIC_HEADERS,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(names),
  }).then(res =>
    res.ok
      ? res.json().then(res => ({
          type: 'ok',
          value: res,
        }))
      : res.json().then(res => ({
          type: 'err',
          value: res,
        })),
  )
