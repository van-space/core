import { Test, TestingModule } from '@nestjs/testing';
import { SayService } from './say.service';

describe('SayService', () => {
  let service: SayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SayService],
    }).compile();

    service = module.get<SayService>(SayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
