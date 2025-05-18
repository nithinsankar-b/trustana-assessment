// src/routes/enrichmentRoutes.ts
import express from 'express';
import { 
  enrichProducts, 
  getEnrichmentJobStatus
} from '../controllers/enrichmentController';

const router = express.Router();

router.post('/products', enrichProducts);
router.get('/status/:id', getEnrichmentJobStatus);

export { router as enrichmentRouter };