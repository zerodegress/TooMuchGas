import { useComputed, useSignal, useSignalEffect } from '@preact/signals-react'
import { Row, Select, Space, Table } from 'antd'
import React, { use } from 'react'
import { getUniverseGroupsGroupId } from '../esi'
import { GAS_CLOUD_GROUP_ID } from '../constants'
import { computeGasValueById } from '../compute'
import { SdeContext } from '../sde'

export const GasValue: React.FC = () => {
  const { typeMaterials } = use(SdeContext)
  const filter = useSignal<'none' | 'fullerite-only'>('none')
  const tablePromise = useSignal<
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
  const table = useSignal<
    {
      name: string
      volume: number
      price: number
      pricePerVolume: number
    }[]
  >([])
  const displayTable = useComputed(() =>
    table.value
      .filter(({ price }) => price != -1)
      .filter(({ name }) => {
        switch (filter.value) {
          case 'fullerite-only':
            return name.includes('-C')
          case 'none':
          default:
            return true
        }
      })
      .map(({ name, volume, price, pricePerVolume }) => ({
        name,
        volume: Intl.NumberFormat('en-US').format(volume),
        price: Intl.NumberFormat('en-US').format(price),
        pricePerVolume: Intl.NumberFormat('en-US').format(pricePerVolume),
      })),
  )
  useSignalEffect(() => {
    tablePromise.value.then(
      x =>
        (table.value = x.sort((a, b) => b.pricePerVolume - a.pricePerVolume)),
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
    <Space style={{ width: '100%' }} direction='vertical'>
      <Row align='middle'>
        过滤器：
        <Select
          style={{
            minWidth: '8rem',
          }}
          defaultValue='none'
          options={[
            {
              value: 'none',
              label: '无',
            },
            {
              value: 'fullerite-only',
              label: '仅富勒体',
            },
          ]}
          onChange={(v: 'none' | 'fullerite-only') => (filter.value = v)}
        />
      </Row>
      <Table dataSource={displayTable.value} columns={columns} />
    </Space>
  )
}
