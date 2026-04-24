import { z } from 'zod';

export const MarchioSchema = z.object({
  nome: z.string().min(1, 'Il nome è obbligatorio').max(255, 'Nome troppo lungo'),
  link_ita: z.string().url('URL ITA non valido').nullable().optional(),
  link_eng: z.string().url('URL ENG non valido').nullable().optional(),
});

export type MarchioFormData = z.infer<typeof MarchioSchema>;

export const TemplateSchema = z.object({
  header_ita: z.string(),
  header_eng: z.string(),
  footer_ita: z.string(),
  footer_eng: z.string(),
});

export const SettingsSchema = z.object({
  bitly_token: z.string().optional(),
  whatsapp_number: z
    .string()
    .regex(/^\+?[0-9]{8,15}$/, 'Numero non valido (es. 393401234567)')
    .optional()
    .or(z.literal('')),
  tinyurl_token: z.string().optional(),
});

export function validateMarchio(data: unknown) {
  return MarchioSchema.safeParse(data);
}

export function validateTemplates(data: unknown) {
  return TemplateSchema.safeParse(data);
}

export function validateSettings(data: unknown) {
  return SettingsSchema.safeParse(data);
}