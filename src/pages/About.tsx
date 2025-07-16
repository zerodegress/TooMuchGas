import { Image, Typography } from 'antd'
import reactIcon from '../assets/react.svg'

export const About: React.FC = () => {
  return (
    <Typography>
      <Typography.Title>作者信息</Typography.Title>
      <Typography.Paragraph>冰点启航 出品</Typography.Paragraph>
      <Typography.Paragraph>
        联系邮箱：{(() => 'zero' + 'degress' + '@' + 'out' + 'look.com')()}
      </Typography.Paragraph>
      <Typography.Paragraph>游戏角色名：Zero DegressM</Typography.Paragraph>
      <Typography.Title>感谢</Typography.Title>
      <Typography.Paragraph>
        基于React <Image src={reactIcon} /> 构建
      </Typography.Paragraph>
    </Typography>
  )
}
