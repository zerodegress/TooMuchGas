import { useComputed, useSignal } from '@preact/signals-react'
import { Row, Select, Space, Spin, Table } from 'antd'
import React, { Suspense, use } from 'react'
import { getUniverseGroupsGroupId } from '../esi'
import { GAS_CLOUD_GROUP_ID } from '../constants'
import { SdeContext } from '../sde'
import { useBuy } from '../buy'
import { useGasConversion } from '../gas'

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

const GasTable: React.FC<{
  tablePromise: Promise<
    {
      name: string
      volume: number
      price: number
      pricePerVolume: number
    }[]
  >
  filter: 'none' | 'fullerite-only'
}> = ({ tablePromise, filter }) => {
  const table = use(tablePromise)
  const displayTable = table
    .filter(({ price }) => price != -1)
    .filter(({ name }) => {
      switch (filter) {
        case 'fullerite-only':
          return name.includes('-C')
        case 'none':
        default:
          return true
      }
    })
    .sort((a, b) => b.pricePerVolume - a.pricePerVolume)
    .map(({ name, volume, price, pricePerVolume }) => ({
      name,
      volume: Intl.NumberFormat('en-US').format(volume),
      price: Intl.NumberFormat('en-US').format(price),
      pricePerVolume: Intl.NumberFormat('en-US').format(pricePerVolume),
    }))
  return <Table dataSource={displayTable} columns={columns} />
}

export const GasValue: React.FC = () => {
  const { types } = use(SdeContext)
  const filter = useSignal<'none' | 'fullerite-only'>('none')
  const { buy } = useBuy()
  const { compress } = useGasConversion()
  const tablePromise = useComputed(async () => {
    const typeIdsRes = await getUniverseGroupsGroupId(GAS_CLOUD_GROUP_ID)
    if (typeIdsRes.type != 'ok') {
      throw new Error('ESI failed')
    }

    return Promise.all(
      typeIdsRes.value.types.map(async typeId => {
        const item = types[typeId.toString() as keyof typeof types]
        const volume = 'volume' in item ? item.volume : -1
        const name = item.name.zh
        const compressedTypeId = compress(typeId)
        const price = compressedTypeId ? await buy(compressedTypeId, 1) : -1

        return {
          name,
          volume,
          price,
          pricePerVolume: price / volume,
        }
      }),
    )
  })

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
      <Suspense fallback={<Spin />}>
        <GasTable tablePromise={tablePromise.value} filter={filter.value} />
      </Suspense>
    </Space>
  )
}
