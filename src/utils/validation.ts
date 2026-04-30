import { z, ZodError } from 'zod';

export const marchioSchema = z.object({
  nome: z.string().min(1).max(255),
  link_ita: z.string().url().nullable(),
  link_eng: z.string().url().nullable(),
});

export function validateMarchio(data: unknown): { 
  success: true; 
  data: z.infer<typeof marchioSchema> 
} | { 
  success: false; 
  error: ZodError<z.infer<typeof marchioSchema>> 
} {
  const result = marchioSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
