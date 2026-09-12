import { z } from 'zod';

export const userCreateSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  motDePasse: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  telephone: z.string().optional(),
  role: z.enum(['EMPLOYE', 'TECHNICIEN_IT', 'ADMINISTRATEUR']),
  poste: z.string().optional(),
  specialite: z.string().optional(),
  niveauPrivilege: z.string().optional(),
  departementId: z.number().int().positive().optional(),
});

export const ticketAssignSchema = z.object({
  technicienId: z.number().int().positive("L'ID du technicien doit être un entier valide"),
});

export const departmentSchema = z.object({
  nom: z.string().min(2, "Le nom du département est requis"),
  codeBureau: z.string().min(1, "Le code bureau est requis"),
});

export const categorySchema = z.object({
  nom: z.string().min(2, "Le nom de la catégorie est requis"),
  description: z.string().optional(),
});

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      status: 'fail',
      errors: result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }
  req.body = result.data;
  next();
};
