import { useComputed, useSignal, useSignalEffect } from '@preact/signals-react'
import { Button, Input, Row, Space, Table } from 'antd'
import React, { use, useCallback, useMemo, useState } from 'react'
import { SdeContext } from '../sde'
import { computeGasValue } from '../compute'

export const GasBuy: React.FC = () => {
  const { typeMaterials } = use(SdeContext)
  const gasText = useSignal('')
  const gasList = useComputed(() =>
    gasText.value
      .split(/\r?\n|\r/)
      .filter(x => x)
      .map(x => {
        const [name, count] = x
          .split(/\s+/)
          .map(x => x.replace(/\s+/, '').replace(/\*$/, ''))
        return [name, Number.parseInt(count.replace(',', ''))] as const
      })
      .reduce(
        (acc, [name, count]) => {
          if (!(name in acc)) {
            acc[name] = count
          } else {
            acc[name] += count
          }
          return acc
        },
        {} as Record<string, number>,
      ),
  )
  const gasComputeTablePromise = useSignal<
    Promise<
      {
        name: string
        quantity: number
        price: number
        sumPrice: number
      }[]
    >
  >(new Promise(resolve => resolve([])))
  useSignalEffect(() => {
    gasComputeTablePromise.value.then(x => setGasComputedTable(x))
  })
  gasComputeTablePromise.subscribe(x => x.then(x => setGasComputedTable(x)))
  const [gasComputeTable, setGasComputedTable] = useState<
    {
      name: string
      quantity: number
      price: number
      sumPrice: number
    }[]
  >([])
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: '总价',
      dataIndex: 'sumPrice',
      key: 'sumPrice',
    },
  ]
  const sumPrice = useMemo(
    () => gasComputeTable.reduce((acc, cur) => acc + cur.sumPrice, 0),
    [gasComputeTable],
  )

  const computeGas = useCallback(() => {
    gasComputeTablePromise.value = Promise.all(
      Object.entries(gasList.value)
        .map(([name, quantity]) =>
          computeGasValue(typeMaterials)(name, quantity),
        )
        .map(async x => {
          const y = await x
          return {
            name: y[0],
            quantity: y[1],
            price: y[2],
            sumPrice: y[3],
          }
        }),
    )
  }, [gasList.value, typeMaterials, gasComputeTablePromise])

  return (
    <Space style={{ width: '100%' }} direction='vertical' size={'small'}>
      <Input.TextArea
        placeholder='请复制游戏内要收购的所有气云并粘贴到此处'
        autoSize={{
          minRows: 5,
          maxRows: 10,
        }}
        onChange={e => {
          gasText.value = e.target.value
        }}
      />
      <Row justify='center'>
        <Button type='primary' onClick={computeGas}>
          计算
        </Button>
      </Row>
      <Table
        dataSource={gasComputeTable.map(
          ({ name, quantity, price, sumPrice }) => ({
            name,
            quantity: Intl.NumberFormat('en-US').format(quantity),
            price: Intl.NumberFormat('en-US').format(price),
            sumPrice: Intl.NumberFormat('en-US').format(sumPrice),
          }),
        )}
        columns={columns}
      />
      总价{Intl.NumberFormat('en-US').format(sumPrice)}
    </Space>
  )
}
