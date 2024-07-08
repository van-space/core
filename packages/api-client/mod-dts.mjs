import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, sep, resolve } from 'path'

// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url)

// 处理不同操作系统的路径分隔符
const __dirname = dirname(__filename)

const PKG = JSON.parse(readFileSync(resolve(__dirname, './package.json')))

const dts = resolve(__dirname, './dist/index.d.ts')
const content = readFileSync(dts, 'utf-8')

// replace declare module '../core/client'
// with declare module '@mx-space/api-client'
writeFileSync(
  dts,
  content.replace(
    /declare module '..\/core\/client'/g,
    'declare module ' + `'${PKG.name}'`,
  ),
)
