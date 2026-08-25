import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "La password deve contenere almeno 8 caratteri.")
  .regex(/[A-Za-z]/, "La password deve contenere almeno una lettera.")
  .regex(/[0-9]/, "La password deve contenere almeno un numero.");

export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Inserisci il nome."),
  surname: z.string().trim().min(2, "Inserisci il cognome."),
  email: z.string().trim().email("Inserisci un indirizzo email valido."),
  password: passwordSchema,
  schoolId: z.string().uuid("Seleziona una scuola valida."),
  instagram: z.string().trim().max(30, "Username Instagram non valido.").optional(),
  referralCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(6, "Codice referral non valido.")
    .max(32, "Codice referral non valido.")
    .regex(/^[A-Z0-9]+$/, "Codice referral non valido.")
    .optional(),
});

export const passwordResetSchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/i, "Link di recupero non valido."),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Le password non coincidono.",
    path: ["passwordConfirmation"],
  });

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Inserisci la password attuale."),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Le password non coincidono.",
    path: ["passwordConfirmation"],
  });

export const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Inserisci il nome."),
  surname: z.string().trim().min(2, "Inserisci il cognome."),
  schoolId: z.string().uuid("Seleziona una scuola valida."),
  instagram: z.string().trim().max(30, "Username Instagram non valido.").optional(),
});
