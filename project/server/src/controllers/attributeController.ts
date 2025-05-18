// src/controllers/attributeController.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

const prisma = new PrismaClient();

export const getAllAttributes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attributes = await prisma.attribute.findMany();
    res.json(attributes);
  } catch (error) {
    next(error);
  }
};

export const getAttributeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid attribute ID');
    }
    
    const attribute = await prisma.attribute.findUnique({
      where: { id }
    });
    
    if (!attribute) {
      throw new ApiError(404, 'Attribute not found');
    }
    
    res.json(attribute);
  } catch (error) {
    next(error);
  }
};

export const createAttribute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, unit, options, isRequired } = req.body;
    
    if (!name || !type) {
      throw new ApiError(400, 'Name and type are required');
    }
    
    // Validate attribute type
    const validTypes = [
      'SHORT_TEXT', 
      'LONG_TEXT', 
      'RICH_TEXT', 
      'NUMBER', 
      'SINGLE_SELECT', 
      'MULTIPLE_SELECT', 
      'MEASURE'
    ];
    
    if (!validTypes.includes(type)) {
      throw new ApiError(400, `Invalid attribute type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    // Additional validation based on type
    if ((type === 'SINGLE_SELECT' || type === 'MULTIPLE_SELECT') && (!options || !Array.isArray(options) || options.length === 0)) {
      throw new ApiError(400, 'Options are required for SELECT type attributes');
    }
    
    if (type === 'MEASURE' && !unit) {
      throw new ApiError(400, 'Unit is required for MEASURE type attributes');
    }
    
    const attribute = await prisma.attribute.create({
      data: {
        name,
        type: type as any, // Type casting to match Prisma enum
        unit,
        options: options || [],
        isRequired: isRequired || false
      }
    });
    
    res.status(201).json(attribute);
  } catch (error) {
    // Handle unique constraint violation
    if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
      return next(new ApiError(409, 'An attribute with this name already exists'));
    }
    next(error);
  }
};

export const updateAttribute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid attribute ID');
    }
    
    const { name, type, unit, options, isRequired } = req.body;
    
    // Check if attribute exists
    const existingAttribute = await prisma.attribute.findUnique({
      where: { id }
    });
    
    if (!existingAttribute) {
      throw new ApiError(404, 'Attribute not found');
    }
    
    // Validate attribute type if provided
    if (type) {
      const validTypes = [
        'SHORT_TEXT', 
        'LONG_TEXT', 
        'RICH_TEXT', 
        'NUMBER', 
        'SINGLE_SELECT', 
        'MULTIPLE_SELECT', 
        'MEASURE'
      ];
      
      if (!validTypes.includes(type)) {
        throw new ApiError(400, `Invalid attribute type. Must be one of: ${validTypes.join(', ')}`);
      }
    }
    
    // Update attribute
    const updatedAttribute = await prisma.attribute.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        type: type !== undefined ? type as any : undefined,
        unit: unit !== undefined ? unit : undefined,
        options: options !== undefined ? options : undefined,
        isRequired: isRequired !== undefined ? isRequired : undefined
      }
    });
    
    res.json(updatedAttribute);
  } catch (error) {
    // Handle unique constraint violation
    if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
      return next(new ApiError(409, 'An attribute with this name already exists'));
    }
    next(error);
  }
};

export const deleteAttribute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid attribute ID');
    }
    
    // Check if attribute exists
    const existingAttribute = await prisma.attribute.findUnique({
      where: { id }
    });
    
    if (!existingAttribute) {
      throw new ApiError(404, 'Attribute not found');
    }
    
    // Delete attribute
    await prisma.attribute.delete({
      where: { id }
    });
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};