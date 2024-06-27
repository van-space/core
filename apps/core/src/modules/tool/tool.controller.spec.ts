import { Test, TestingModule } from '@nestjs/testing';
import { ToolController } from './tool.controller';
import { ToolService } from './tool.service';
import { ConfigsService } from '../configs/configs.service';
import { registerGlobal } from 'test/register-global';
import { HttpService } from '~/processors/helper/helper.http.service';
import { CacheService } from '~/processors/cache/cache.service';
registerGlobal();
describe('ToolController', () => {
  let controller: ToolController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolController],
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

    controller = module.get<ToolController>(ToolController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
