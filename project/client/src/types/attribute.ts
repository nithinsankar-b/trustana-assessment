// client/src/types/attribute.ts
export type AttributeType = 
  | 'SHORT_TEXT' 
  | 'LONG_TEXT' 
  | 'RICH_TEXT' 
  | 'NUMBER' 
  | 'SINGLE_SELECT' 
  | 'MULTIPLE_SELECT' 
  | 'MEASURE';

export interface Attribute {
  id: number;
  name: string;
  type: AttributeType;
  unit?: string;
  options: string[];
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeFormData {
  name: string;
  type: AttributeType;
  unit?: string;
  options: string[];
  isRequired: boolean;
}