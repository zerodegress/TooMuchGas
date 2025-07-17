import { Tabs, TabsProps, Typography } from 'antd'
import { GasBuy } from './pages/GasBuy'
import { GasValue } from './pages/GasValue'
import { About } from './pages/About'
import { Suspense } from 'react'

const tabItems: TabsProps['items'] = [
  {
    label: '收购计算',
    key: 'buy',
    children: <GasBuy />,
  },
  {
    label: '气云价值',
    key: 'gas-value',
    children: (
      <Suspense fallback={'waiting'}>
        <GasValue />
      </Suspense>
    ),
  },
  {
    label: '关于',
    key: 'about',
    children: <About />,
  },
]

function App() {
  return (
    <>
      <Typography.Title>气云计算器</Typography.Title>
      <Typography.Text>*所有气云价值按其压缩变种计算</Typography.Text>
      <Tabs items={tabItems} />
    </>
  )
}

export default App
