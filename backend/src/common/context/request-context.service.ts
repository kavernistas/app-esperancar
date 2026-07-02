import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class RequestContext {
  constructor(@Inject(REQUEST) private readonly req: Request) {}

  get requestId(): string | undefined {
    return (this.req as any)?.requestId;
  }

  get organizationId(): string | undefined {
    return (this.req as any)?.user?.organization_id;
  }

  get userId(): string | undefined {
    return (this.req as any)?.user?.id;
  }

  get userEmail(): string | undefined {
    return (this.req as any)?.user?.email;
  }

  get userRole(): string | undefined {
    return (this.req as any)?.user?.role;
  }
}
