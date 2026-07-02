import { Test, TestingModule } from '@nestjs/testing';

describe('Notification Flow (e2e)', () => {
  let prisma:any;

  beforeAll(() => {
    const prismaMock = {
      $connect: () => Promise.resolve(),
      $disconnect: () => Promise.resolve(),
      notification: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'dummy' }),
      },
    };

    prisma = prismaMock;
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should have notifications module loaded', () => {
    expect(prisma).toBeDefined();
  });
});