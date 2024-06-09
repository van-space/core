import { Test, TestingModule } from '@nestjs/testing';
import { SayController } from './say.controller';

describe('SayController', () => {
  let controller: SayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SayController],
    }).compile();

    controller = module.get<SayController>(SayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
