import { AsyncLocalStorage } from 'async_hooks';

export interface IRequestContext {
    tenantId?: string;
    userId?: string;
}

export const requestContext = new AsyncLocalStorage<IRequestContext>();
