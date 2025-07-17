import { useComputed, useSignal } from '@preact/signals-react'
import { Button, Input, Row, Space, Table } from 'antd'
import React, { Suspense, use, useCallback } from 'react'
import { SdeContext } from '../sde'
import { computeGasValue } from '../compute'

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

const GasTable: React.FC<{
  tablePromise: Promise<
    {
      name: string
      quantity: number
      price: number
      sumPrice: number
    }[]
  >
}> = ({ tablePromise }) => {
  const table = use(tablePromise)
  return (
    <>
      <Table
        dataSource={table.map(({ name, quantity, price, sumPrice }) => ({
          name,
          quantity: Intl.NumberFormat('en-US').format(quantity),
          price: Intl.NumberFormat('en-US').format(price),
          sumPrice: Intl.NumberFormat('en-US').format(sumPrice),
        }))}
        columns={columns}
      />
      总价：
      {Intl.NumberFormat('en-US').format(
        table.reduce((acc, cur) => acc + cur.sumPrice, 0),
      )}
    </>
  )
}

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
  const tablePromise = useSignal<
    Promise<
      {
        name: string
        quantity: number
        price: number
        sumPrice: number
      }[]
    >
  >(new Promise(resolve => resolve([])))

  const computeGas = useCallback(() => {
    tablePromise.value = Promise.all(
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
  }, [gasList.value, typeMaterials, tablePromise])

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
      <Suspense fallback='计算中'>
        <GasTable tablePromise={tablePromise.value} />
      </Suspense>
    </Space>
  )
}
