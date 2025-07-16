import { useSignal, useSignalEffect } from '@preact/signals-react'
import { Table } from 'antd'
import React, { use, useState } from 'react'
import { getUniverseGroupsGroupId } from '../esi'
import { GAS_CLOUD_GROUP_ID } from '../constants'
import { computeGasValueById } from '../compute'
import { SdeContext } from '../sde'

export const GasValue: React.FC = () => {
  const { typeMaterials } = use(SdeContext)
  const gasComputeTablePromise = useSignal<
    Promise<
      {
        name: string
        volume: number
        price: number
        pricePerVolume: number
      }[]
    >
  >(
    (async () => {
      const typeIdsRes = await getUniverseGroupsGroupId(GAS_CLOUD_GROUP_ID)
      if (typeIdsRes.type != 'ok') {
        throw new Error('ESI failed')
      }

      return Promise.all(
        typeIdsRes.value.types.map(async typeId => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [name, _, price, __, volume] = await computeGasValueById(
            typeMaterials,
            {
              ignoreInvalidItem: true,
            },
          )(typeId, 1)
          return {
            name,
            volume,
            price,
            pricePerVolume: price / volume,
          }
        }),
      )
    })(),
  )
  const [table, setTable] = useState<
    {
      name: string
      volume: number
      price: number
      pricePerVolume: number
    }[]
  >([])
  useSignalEffect(() => {
    gasComputeTablePromise.value.then(x =>
      setTable(x.sort((a, b) => b.pricePerVolume - a.pricePerVolume)),
    )
  })
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '体积',
      dataIndex: 'volume',
      key: 'volume',
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: '每体积价格',
      dataIndex: 'pricePerVolume',
      key: 'pricePerVolume',
    },
  ]
  return (
    <Table
      style={{ width: '100%' }}
      dataSource={table
        .filter(({ price }) => price != -1)
        .map(({ name, volume, price, pricePerVolume }) => ({
          name,
          volume: Intl.NumberFormat('en-US').format(volume),
          price: Intl.NumberFormat('en-US').format(price),
          pricePerVolume: Intl.NumberFormat('en-US').format(pricePerVolume),
        }))}
      columns={columns}
    />
  )
}
