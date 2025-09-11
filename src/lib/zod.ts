import {z} from 'zod';

export const signInSchema = z.object({
  username: z.string().min(1, 'Le nom d’utilisateur est requis'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

