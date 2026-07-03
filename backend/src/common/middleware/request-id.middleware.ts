import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requestContext } from '../context/request-context';

const MAX_REQUEST_ID_LENGTH = 64;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let requestId = req.headers['x-request-id'] as string | undefined;

    if (requestId) {
      const valid = /^[a-zA-Z0-9\-_]+$/.test(requestId) && requestId.length <= MAX_REQUEST_ID_LENGTH;
      if (!valid) {
        requestId = undefined;
      }
    }

    if (!requestId) {
      requestId = uuidv4();
    }

    (req as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    requestContext.run({ requestId }, () => {
      next();
    });
  }
}
