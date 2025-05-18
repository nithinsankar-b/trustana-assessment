// src/routes/attributeRoutes.ts
import express from 'express';
import { 
  getAllAttributes, 
  getAttributeById, 
  createAttribute, 
  updateAttribute, 
  deleteAttribute 
} from '../controllers/attributeController';

const router = express.Router();

router.get('/', getAllAttributes);
router.get('/:id', getAttributeById);
router.post('/', createAttribute);
router.put('/:id', updateAttribute);
router.delete('/:id', deleteAttribute);

export { router as attributeRouter };
