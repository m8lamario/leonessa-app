import { z } from "zod";

export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Inserisci il nome."),
  surname: z.string().trim().min(2, "Inserisci il cognome."),
  email: z.string().trim().email("Inserisci un indirizzo email valido."),
  password: z
    .string()
    .min(8, "La password deve contenere almeno 8 caratteri.")
    .regex(/[A-Za-z]/, "La password deve contenere almeno una lettera.")
    .regex(/[0-9]/, "La password deve contenere almeno un numero."),
  schoolId: z.string().uuid("Seleziona una scuola valida."),
  instagram: z.string().trim().max(30, "Username Instagram non valido.").optional(),
});

export const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Inserisci il nome."),
  surname: z.string().trim().min(2, "Inserisci il cognome."),
  schoolId: z.string().uuid("Seleziona una scuola valida."),
  instagram: z.string().trim().max(30, "Username Instagram non valido.").optional(),
});
