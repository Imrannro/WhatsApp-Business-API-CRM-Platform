import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  role: z.enum(['ADMIN', 'AGENT']).optional().default('AGENT'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const contactCreateSchema = z.object({
  phoneNumber: z
    .string()
    .min(8, 'Phone number is too short')
    .max(20, 'Phone number is too long')
    .regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format').optional().nullable().or(z.literal('')),
  company: z.string().max(100).optional().nullable().or(z.literal('')),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().max(1000).optional().nullable().or(z.literal('')),
});

export const contactUpdateSchema = contactCreateSchema.partial();

export const conversationCreateSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  assignedAgentId: z.string().optional().nullable(),
  subject: z.string().max(200).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
});

export const conversationUpdateSchema = z.object({
  status: z.enum(['OPEN', 'PENDING', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedAgentId: z.string().nullable().optional(),
  subject: z.string().max(200).optional(),
});

export const conversationAssignSchema = z.object({
  agentId: z.string().nullable(),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1, 'Message body cannot be empty').max(4096, 'Message exceeds WhatsApp maximum length'),
  type: z.enum(['TEXT', 'TEMPLATE']).optional().default('TEXT'),
  templateName: z.string().optional(),
});

export const internalNoteSchema = z.object({
  content: z.string().min(1, 'Internal note cannot be empty').max(2000, 'Note exceeds maximum length'),
});

export const userCreateSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'AGENT']).default('AGENT'),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['ADMIN', 'AGENT']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  password: z.string().min(8).optional(),
});
