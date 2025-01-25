/**
 * Analyze interceptor.
 * @file 数据分析拦截器
 * @module interceptor/analyze
 * @author Innei <https://github.com/Innei>
 */
import { URL } from 'node:url'
import { isbot } from 'isbot'
import UAParser from 'ua-parser-js'
import type { SnippetModel } from '~/modules/snippet/snippet.model'
import type { Observable } from 'rxjs'

import {
  CallHandler,
  ExecutionContext,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ReturnModelType } from '@typegoose/typegoose'

// import { PUSH_PLUS_TOKEN } from '~/app.config'
import { RedisKeys } from '~/constants/cache.constant'
import * as SYSTEM from '~/constants/system.constant'
import { REFLECTOR } from '~/constants/system.constant'
import { AnalyzeModel } from '~/modules/analyze/analyze.model'
import { CommentService } from '~/modules/comment/comment.service'
import { OptionModel } from '~/modules/configs/configs.model'
import { ConfigsService } from '~/modules/configs/configs.service'
import { createMockedContextResponse } from '~/modules/serverless/mock-response.util'
import { ServerlessService } from '~/modules/serverless/serverless.service'
import { SnippetType } from '~/modules/snippet/snippet.model'
import { BarkPushService } from '~/processors/helper/helper.bark.service'
import { HttpService } from '~/processors/helper/helper.http.service'
import { CacheService } from '~/processors/redis/cache.service'
import {
  FastifyBizRequest,
  getNestExecutionContextRequest,
} from '~/transformers/get-req.transformer'
import { InjectModel } from '~/transformers/model.transformer'
import { getIp } from '~/utils/ip.util'
import { getRedisKey } from '~/utils/redis.util'
import { scheduleManager } from '~/utils/schedule.util'

@Injectable()
export class AnalyzeInterceptor implements NestInterceptor {
  private parser: UAParser
  private queue: TaskQueuePool<any>
  private readonly logger: Logger = new Logger(CommentService.name)

  constructor(
    @InjectModel(AnalyzeModel)
    private readonly model: ReturnModelType<typeof AnalyzeModel>,
    @InjectModel(OptionModel)
    private readonly options: ReturnModelType<typeof OptionModel>,
    private readonly cacheService: CacheService,
    // private readonly http: HttpService,
    private readonly configsService: ConfigsService,
    private readonly barkService: BarkPushService,
    @Inject(forwardRef(() => ServerlessService))
    private readonly serverlessService: ServerlessService,
    @Inject(REFLECTOR) private readonly reflector: Reflector,
  ) {
    this.init()
    this.queue = new TaskQueuePool(1000, this.model, async (count) => {
      await this.options.updateOne(
        { name: 'apiCallTime' },
        {
          $inc: {
            value: count,
          },
        },
        { upsert: true },
      )
    })
  }

  async init() {
    this.parser = new UAParser()
  }
  async getLocation(ip: string) {
    const fnModel = (await this.serverlessService.model
      .findOne({
        name: 'ip',
        reference: 'built-in',
        type: SnippetType.Function,
      })
      .select('+secret')
      .lean({
        getters: true,
      })) as SnippetModel

    if (!fnModel) {
      this.logger.error('[Serverless Fn] ip query function is missing.')
      return ''
    }

    const result =
      await this.serverlessService.injectContextIntoServerlessFunctionAndCall(
        fnModel,
        {
          req: {
            query: { ip },
          },
          res: createMockedContextResponse({} as any),
        } as any,
      )
    const location =
      `${result.countryName || ''}${
        result.regionName && result.regionName !== result.cityName
          ? `${result.regionName}`
          : ''
      }${result.cityName ? `${result.cityName}` : ''}` || undefined

    return location
  }
  shouldNotify(path: string) {
    return path.includes('/notes/nid')
  }
  async notify(request: FastifyBizRequest) {
    const url = request.url.replace(/^\/api(\/v\d)?/, '')
    const path = new URL(`http://a.com${url}`).pathname

    if (!this.shouldNotify(path)) return

    const { adminUrl } = await this.configsService.get('url')

    request.headers['user-agent'] &&
      this.parser.setUA(request.headers['user-agent'])
    this.barkService.throttlePush(async () => {
      const ip = getIp(request)
      const location = await this.getLocation(ip)
      return {
        title: '网站访问提醒',
        body: `来自 ${location}, IP为 ${ip} 的用户访问了 ${path};\n浏览器：${this.parser.getBrowser().name} ${this.parser.getBrowser().version};\nOS: ${this.parser.getOS().name} ${this.parser.getOS().version};`,
        url: `${adminUrl}#/analyze`,
      }
    })
  }
  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const call$ = next.handle()
    const request = getNestExecutionContextRequest(context)
    if (!request) {
      return call$
    }

    const method = request.method.toUpperCase()
    if (method !== 'GET') {
      return call$
    }

    const shouldSkipLogging = this.reflector.get(
      SYSTEM.SKIP_LOGGING_METADATA,
      context.getHandler(),
    )

    if (shouldSkipLogging) return call$

    const ip = getIp(request)

    // if req from SSR server, like 127.0.0.1, skip
    if (['127.0.0.1', 'localhost', '::-1'].includes(ip)) {
      return call$
    }
    // if login
    if (request.user) {
      return call$
    }

    // if user agent is in bot list, skip
    if (isbot(request.headers['user-agent'])) {
      return call$
    }

    const url = request.url.replace(/^\/api(\/v\d)?/, '')

    if (url.startsWith('/proxy')) {
      return call$
    }
    this.notify(request)
    scheduleManager.schedule(async () => {
      try {
        request.headers['user-agent'] &&
          this.parser.setUA(request.headers['user-agent'])

        const ua = this.parser.getResult()

        this.queue.push({
          ip,
          ua,
          path: new URL(`http://a.com${url}`).pathname,
          country:
            request.headers['cf-ipcountry'] || request.headers['CF-IPCountry'],
        })

        // ip access in redis
        const client = this.cacheService.getClient()

        const count = await client.sadd(getRedisKey(RedisKeys.AccessIp), ip)
        if (count) {
          // record uv to db

          const uvRecord = await this.options.findOne({ name: 'uv' })
          if (uvRecord) {
            await uvRecord.updateOne({
              $inc: {
                value: 1,
              },
            })
          } else {
            await this.options.create({
              name: 'uv',
              value: 1,
            })
          }
        }
      } catch (error) {
        console.error(error)
      }
    })

    return call$
  }
}

class TaskQueuePool<T> {
  private pool: T[] = []
  private interval: number
  private timer: NodeJS.Timer | null = null

  constructor(
    interval: number = 1000,
    private readonly collection: any,
    private onBatch: (count: number) => any,
  ) {
    this.interval = interval
  }

  push(model: T) {
    this.pool.push(model)

    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.batchInsert()
        this.timer = null
      }, this.interval)
    }
  }

  private async batchInsert() {
    if (this.pool.length === 0) return

    await this.collection.insertMany(this.pool)
    await this.onBatch(this.pool.length)
    // 清空任务池，准备下一次批量插入
    this.pool = []
  }
}
