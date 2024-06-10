import { Test, TestingModule } from '@nestjs/testing';
import { RecentlyService } from './recently.service';

describe('RecentlyService', () => {
  let service: RecentlyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecentlyService],
    }).compile();

    service = module.get<RecentlyService>(RecentlyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
