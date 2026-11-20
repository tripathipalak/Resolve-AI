import { z } from 'zod';
import { CATEGORIES, ACTIONS } from '../constants.js';

// Every model output is validated here before anything is saved.
export const classificationSchema = z.object({
  category: z.enum(CATEGORIES),
  priority: z.enum(['low', 'medium', 'high']),
  summary: z.string().min(5).max(300)
});

export const evidenceSchema = z.object({
  findings: z.array(z.object({
    fileName: z.string(),
    observation: z.string().max(400),
    relevantToComplaint: z.boolean()
  })).max(10)
});

export const recommendationSchema = z.object({
  action: z.enum(ACTIONS),
  reasoning: z.string().min(10).max(1200),
  policyCitations: z.array(z.object({
    passageId: z.string(),
    section: z.string(),
    quote: z.string().min(3).max(200)
  })).max(5),
  assumptions: z.array(z.string()).max(5),
  missingInformation: z.array(z.string()).max(5),
  draftResponse: z.string().min(20).max(2000)
});
