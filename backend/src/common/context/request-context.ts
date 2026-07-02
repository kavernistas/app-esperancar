import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContextData {
  requestId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContextData>();
