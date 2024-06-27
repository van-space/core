import { Test, TestingModule } from '@nestjs/testing';
import { ToolService } from './tool.service';
import { HttpService } from '~/processors/helper/helper.http.service';
import { ConfigsService } from '../configs/configs.service';
import { CacheService } from '~/processors/cache/cache.service';

describe('ToolService', () => {
  let service: ToolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolService,
        {
          provide: ConfigsService,
          useValue: jest.fn(),
        },
        {
          provide: HttpService,
          useValue: jest.fn(),
        },
        {
          provide: CacheService,
          useValue: jest.fn(),
        },
      ],
    }).compile();

    service = module.get<ToolService>(ToolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
