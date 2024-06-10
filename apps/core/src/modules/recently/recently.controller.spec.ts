import { Test, TestingModule } from '@nestjs/testing';
import { RecentlyController } from './recently.controller';

describe('RecentlyController', () => {
  let controller: RecentlyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecentlyController],
    }).compile();

    controller = module.get<RecentlyController>(RecentlyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
