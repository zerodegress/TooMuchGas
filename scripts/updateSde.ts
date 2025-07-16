import 'dotenv/config'
import { Octokit } from 'octokit'
import { env, exit } from 'node:process'
import { dirname, join } from 'node:path'
import { createWriteStream, createReadStream } from 'node:fs'
import { writeFile, readFile, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import lzma from 'lzma-native'
import tar from 'tar-stream'
import yaml from 'yaml'

export type Result<T, E> =
  | {
      type: 'ok'
      value: T
    }
  | {
      type: 'err'
      value: E
    }

const ESI_BASE_URL = 'https://esi.evetech.net/latest/'
const GENERIC_HEADERS: HeadersInit = {
  'Accept-Language': 'zh',
}

const COMPRESSED_GAS_CLOUD_GROUP_ID = 4168

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

const compressedGasCloudTypeIds = await (async () => {
  const res = await getUniverseGroupsGroupId(COMPRESSED_GAS_CLOUD_GROUP_ID)
  if (res.type == 'ok') {
    return res.value.types
  } else {
    throw 'ESI failed, please check again'
  }
})()

const baseDir = dirname(import.meta.dirname)

const octokit = new Octokit({
  auth: env.GITHUB_TOKEN,
})

const sdeGitHubReleases = await octokit.request(
  'GET /repos/{owner}/{repo}/releases',
  {
    owner: 'EVEShipFit',
    repo: 'sde',
    per_page: 1,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  },
)

const sdeLatest = sdeGitHubReleases.data[0].name
if (!sdeLatest) {
  throw 'GitHub API Error, please check'
}

const latestSdeLatest = await readFile(join(baseDir, '.sde-latest'))
  .then(v => v.toString())
  .catch(() => '')
if (latestSdeLatest == sdeLatest) {
  console.log('Already latest.')
  exit(0)
}

const sdeGitHubAsset = sdeGitHubReleases.data[0].assets.find(
  asset => asset.name == `${sdeLatest}.tar.xz`,
)
if (!sdeGitHubAsset) {
  throw 'GitHub Asset missing!'
}

const sdeGitHubAssetRes = await (
  await fetch(sdeGitHubAsset.browser_download_url)
).bytes()
const sdeTempDir = await mkdtemp(join(tmpdir(), 'tmg-'))
const sdeTempFile = join(sdeTempDir, 'sde.tar.xz')
writeFile(sdeTempFile, sdeGitHubAssetRes)
const typeMaterials = await new Promise(resolve => {
  const typeMaterialsTempFile = join(sdeTempDir, 'typeMaterials.yaml')
  const extract = tar.extract()
  const decompressor = lzma.createDecompressor()
  const stream = createReadStream(sdeTempFile)

  extract.on('entry', (header, stream, next) => {
    if (header.name == 'sde/typeMaterials.yaml') {
      const writer = createWriteStream(typeMaterialsTempFile)
      stream.pipe(writer)
      writer.on('finish', () => {
        readFile(typeMaterialsTempFile).then(x => {
          const typeMaterialsYaml = x.toString()
          const typeMaterials = yaml.parseDocument(typeMaterialsYaml).toJS()
          resolve(
            Object.fromEntries(
              Object.entries(typeMaterials).filter(([id]) =>
                compressedGasCloudTypeIds.includes(Number.parseInt(id)),
              ),
            ),
          )
          next()
        })
      })
    } else {
      stream.resume()
      next()
    }
  })

  decompressor.on('error', err => console.error('Decompression error:', err))
  extract.on('error', err => console.error('Extraction error:', err))

  stream.pipe(decompressor).pipe(extract)
})
writeFile(
  join(baseDir, 'src', 'assets', 'typeMaterials.json'),
  JSON.stringify(typeMaterials),
)

writeFile(join(baseDir, '.sde-latest'), sdeLatest)
