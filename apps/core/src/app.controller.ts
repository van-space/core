import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectModel } from 'nestjs-typegoose';
import PKG from '../package.json';
import { Auth } from './common/decorator/auth.decorator';
import { HttpCache } from './common/decorator/cache.decorator';
import { IpLocation, IpRecord } from './common/decorator/ip.decorator';
import { RedisKeys } from './constants/cache.constant';
import { OptionModel } from './modules/configs/configs.model';
import { CacheService } from './processors/cache/cache.service';
import { getRedisKey } from './utils/redis.util';
@Controller()
@ApiTags('Root')
export class AppController {
  constructor(
    private readonly cacheService: CacheService,
    @InjectModel(OptionModel)
    private readonly optionModel: MongooseModel<OptionModel>,
  ) {}
  @Get(['/', '/info'])
  async appInfo() {
    let hash = '';
    try {
      await $`git log --pretty=oneline | head -n 1 | cut -d' ' -f1 | cat`;
    } catch (e: any) {
      // HACK https://www.codenong.com/19120263/
      if (e.exitCode == 141) {
        hash = e.stdout.trim();
      }
    }

    return {
      name: PKG.name,
      author: PKG.author,
      version: PKG.version,
      homepage: PKG.homepage,
      issues: PKG.issues,
      hash,
    };
  }

  @Get('/ping')
  ping(): 'pong' {
    return 'pong';
  }

  @Post('/like_this')
  @HttpCache.disable
  @HttpCode(204)
  async likeThis(@IpLocation() { ip }: IpRecord) {
    const redis = this.cacheService.getClient();

    const isLikedBefore = await redis.sismember(
      getRedisKey(RedisKeys.LikeSite),
      ip,
    );
    if (isLikedBefore) {
      throw new BadRequestException('一天一次就够啦');
    } else {
      redis.sadd(getRedisKey(RedisKeys.LikeSite), ip);
    }

    await this.optionModel.updateOne(
      {
        name: 'like',
      },
      {
        $inc: {
          // @ts-ignore
          value: 1,
        },
      },
      { upsert: true },
    );

    return;
  }

  @Get('/like_this')
  @HttpCache.disable
  async getLikeNumber() {
    const doc = await this.optionModel.findOne({ name: 'like' }).lean();
    return doc ? doc.value : 0;
  }

  @Get('/clean_catch')
  @HttpCache.disable
  @Auth()
  async cleanCatch() {
    const redis = this.cacheService.getClient();
    const keys: string[] = await redis.keys('mx-api-cache:*');
    await Promise.all(keys.map((key) => redis.del(key)));

    return;
  }
}
