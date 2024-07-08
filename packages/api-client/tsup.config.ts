import { dirname, parse, resolve } from 'node:path'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsup'

// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url)

// 处理不同操作系统的路径分隔符
const __dirname = dirname(__filename)

const adaptorNames = readdirSync(resolve(__dirname, './adaptors')).map(
  (i) => parse(i).name,
)

export default defineConfig({
  clean: true,
  target: 'es2020',
  entry: ['index.ts', ...adaptorNames.map((name) => `adaptors/${name}.ts`)],
  external: adaptorNames,
  dts: true,
  format: ['cjs', 'esm', 'iife'],
})
