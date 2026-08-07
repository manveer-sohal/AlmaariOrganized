import express from "express";
import { requireWorkerSecret } from "../utils/serviceAuth.js";
import { processDueEnrichmentJobs } from "../services/enrichmentJob.service.js";
import {
  processDueImagePipelineJobs,
  processCleanupJobs,
} from "../services/imageProcessingJob.service.js";
import { logInfo } from "../observability/logger.js";

const router = express.Router();

/**
 * Internal worker endpoint — not for browsers.
 * Authenticate with ENRICHMENT_WORKER_SECRET via X-Almaari-Service-Key.
 */
router.post("/enrichment/process", requireWorkerSecret, async (req, res) => {
  const limit = Math.min(Number(req.body?.limit) || 5, 20);
  const results = await processDueEnrichmentJobs({ limit });
  logInfo("enrichment_worker_tick", {
    processed: results.length,
    limit,
  });
  return res.status(200).json({
    status: "ok",
    processed: results.length,
    results,
  });
});

router.post("/images/process", requireWorkerSecret, async (req, res) => {
  const limit = Math.min(Number(req.body?.limit) || 5, 20);
  const [pipeline, cleanup] = await Promise.all([
    processDueImagePipelineJobs({ limit }),
    processCleanupJobs({ limit: Math.min(limit, 10) }),
  ]);
  logInfo("image_pipeline_worker_tick", {
    processed: pipeline.length,
    cleanup: cleanup.length,
    limit,
  });
  return res.status(200).json({
    status: "ok",
    processed: pipeline.length,
    cleanup: cleanup.length,
    results: pipeline,
  });
});

export default router;
