import { PrismaService } from '@/common/prisma.service';
import { NotificationService } from '@/modules/notifications/notifications.service';

jest.mock('@/common/prisma.service');

describe('NotificationService.createDeduplicated', () => {
  let prisma: any;
  let service: NotificationService;

  const mockPrisma = {
    notification: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeAll(() => {
    prisma = { ...mockPrisma } as any;
    service = new NotificationService(prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a notification when not duplicated', async () => {
    const input = {
      eventId: 'event_123',
      userId: 'user_456',
      type: 'MISSION_ASSIGNED',
      title: 'Nova missão atribuída',
      message: 'Você recebeu uma nova missão.',
      entityType: 'MISSION',
      actionUrl: '/missions/event_123',
    };

    // No existing notification
    prisma.notification.findFirst.mockResolvedValue(null);
    prisma.notification.create.mockResolvedValue({ id: 'new_id' } as any);

    const result = await service.createDeduplicated(input);
    expect(result.id).toBe('new_id');
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: input,
    });
  });

  it('should return existing notification when duplicate is found', async () => {
    const input = {
      eventId: 'event_123',
      userId: 'user_456',
      type: 'MISSION_ASSIGNED',
    };

    prisma.notification.findFirst.mockResolvedValue({ id: 'existing_id' } as any);
    const result = await service.createDeduplicated(input);
    expect(result).toEqual({ id: 'existing_id' });
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('should throw error when required fields are missing', async () => {
    const input = {
      eventId: 'event_123',
      // userId and type missing
    };

    await expect(service.createDeduplicated(input)).rejects.toThrow(
      /createDeduplicated requires eventId, userId and type/,
    );
    expect(prisma.notification.findFirst).not.toHaveBeenCalled();
  });
});