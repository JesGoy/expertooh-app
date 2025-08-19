import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Usuario inválido').transform((v) => v.trim().toLowerCase()),
  password: z.string().min(6, 'Contraseña inválida'),
  remember: z.union([z.literal('on'), z.literal('')]).optional(),
});

export type loginSchema = z.infer<typeof loginSchema>;
