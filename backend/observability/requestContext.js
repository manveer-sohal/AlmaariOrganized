import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";

const storage = new AsyncLocalStorage();

export const getRequestContext = () => storage.getStore() || null;

export const getRequestId = () => getRequestContext()?.requestId || null;

export const runWithRequestContext = (context, fn) =>
  storage.run(context, fn);

export const updateRequestContext = (patch) => {
  const current = getRequestContext();
  if (!current) return null;
  Object.assign(current, patch);
  return current;
};

export const resolveIncomingRequestId = (req) => {
  const header = req?.headers?.["x-request-id"];
  if (typeof header === "string" && header.trim()) {
    return header.trim().slice(0, 128);
  }
  return randomUUID();
};

export const REQUEST_ID_HEADER = "x-request-id";
