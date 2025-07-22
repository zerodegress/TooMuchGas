import { useComputed, useSignal } from '@preact/signals-react'
import { Button, Input, Row, Space, Spin, Table, Typography } from 'antd'
import React, { Suspense, use, useCallback } from 'react'
import { useBuy } from '../buy'
import { useGasConversion } from '../gas'

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
    <Space style={{ width: '100%' }} direction='vertical'>
      <Table
        dataSource={table.map(({ name, quantity, price, sumPrice }) => ({
          name,
          quantity: Intl.NumberFormat('en-US').format(quantity),
          price: Intl.NumberFormat('en-US').format(price),
          sumPrice: Intl.NumberFormat('en-US').format(sumPrice),
        }))}
        columns={columns}
      />
      <Typography.Text>
        总价：
        {Intl.NumberFormat('en-US').format(
          table.reduce((acc, cur) => acc + cur.sumPrice, 0),
        )}
      </Typography.Text>
    </Space>
  )
}

export const GasBuy: React.FC = () => {
  const { buy } = useBuy()
  const { compress, typeIdOf } = useGasConversion()

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
        .map(
          ([name, quantity]) =>
            [
              name,
              quantity,
              (() => {
                const typeId = typeIdOf(name)
                if (!typeId) {
                  return -1
                }
                const typeId1 = compress(typeId)
                if (!typeId1) {
                  return -1
                }
                return buy(typeId1, 1)
              })(),
            ] as const,
        )
        .map(async ([name, quantity, pricePromise]) => {
          const price = await pricePromise
          return {
            name,
            quantity,
            price,
            sumPrice: price * quantity,
          }
        }),
    )
  }, [gasList.value, tablePromise, buy, compress, typeIdOf])

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
      <Suspense fallback={<Spin />}>
        <GasTable tablePromise={tablePromise.value} />
      </Suspense>
    </Space>
  )
}
