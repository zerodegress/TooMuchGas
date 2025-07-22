import { Select, Space, Tabs, TabsProps, Typography } from 'antd'
import { GasBuy } from './pages/GasBuy'
import { GasValue } from './pages/GasValue'
import { About } from './pages/About'

const tabItems: TabsProps['items'] = [
  {
    label: '收购计算',
    key: 'buy',
    children: <GasBuy />,
  },
  {
    label: '气云价值',
    key: 'gas-value',
    children: <GasValue />,
  },
  {
    label: '关于',
    key: 'about',
    children: <About />,
  },
]

function App() {
  return (
    <Space style={{ width: '100%' }} direction='vertical'>
      <Typography.Title>气云计算器</Typography.Title>
      <Typography.Text>*所有气云价值按其压缩变种计算</Typography.Text>
      {/* <Select
        style={{ minWidth: '5rem' }}
        defaultValue='jita'
        options={[
          {
            value: 'jita',
            label: '吉他',
          },
          {
            value: 'dodixie',
            label: '多迪谢',
          },
          {
            value: 'amarr',
            label: '艾玛',
          },
          {
            value: 'hek',
            label: '赫克',
          },
        ]}
      /> */}
      <Tabs items={tabItems} />
    </Space>
  )
}

export default App
