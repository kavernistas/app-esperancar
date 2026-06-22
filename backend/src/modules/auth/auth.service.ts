import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(dto: any) {
    return { accessToken: '', refreshToken: '' };
  }

  async refresh(dto: any) {
    return { accessToken: '', refreshToken: '' };
  }

  async logout(dto: any) {
    return { loggedOut: true };
  }
}
