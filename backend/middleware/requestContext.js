import {
  resolveIncomingRequestId,
  runWithRequestContext,
  REQUEST_ID_HEADER,
} from "../observability/requestContext.js";
import { logInfo } from "../observability/logger.js";

const isAiRoute = (path = "") =>
  path.startsWith("/api/ai") ||
  path.startsWith("/api/aiStylist") ||
  path.startsWith("/api/ai-stylist") ||
  path === "/api/clothes/crop" ||
  path.startsWith("/api/clothes/crop");

/**
 * Attaches correlation ID to AsyncLocalStorage + response header.
 */
export const requestContextMiddleware = (req, res, next) => {
  const requestId = resolveIncomingRequestId(req);
  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  const context = {
    requestId,
    method: req.method,
    route: req.originalUrl || req.url,
    workflow: undefined,
  };

  runWithRequestContext(context, () => {
    if (isAiRoute(req.path || "")) {
      logInfo("ai.request.received", {
        method: req.method,
        route: req.originalUrl || req.url,
      });
    }
    next();
  });
};
