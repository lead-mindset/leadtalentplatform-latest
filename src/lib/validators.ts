export type Validator = (value: string) => string | undefined;

export const required =
  (message = "Este campo es obligatorio"): Validator =>
  (value) =>
    !value || !value.trim() ? message : undefined;

export const email =
  (message = "Escribe un correo válido"): Validator =>
  (value) =>
    value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? message : undefined;

export const minLen =
  (length: number, message?: string): Validator =>
  (value) =>
    value && value.trim().length < length ? (message ?? `Mínimo ${length} caracteres`) : undefined;

export const url =
  (message = "Escribe una URL válida"): Validator =>
  (value) =>
    value && !/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/.test(value.trim()) ? message : undefined;

export const oneOf =
  (options: readonly string[], message?: string): Validator =>
  (value) =>
    value && !options.includes(value) ? (message ?? "Opción no válida") : undefined;

export const combine =
  (...validators: Validator[]): Validator =>
  (value) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return undefined;
  };

export type ValidateSchema<T> = (values: T) => Partial<Record<keyof T, string>>;

export const buildValidate =
  <T extends Record<string, any>>(rules: { [K in keyof T]?: Validator[] }): ValidateSchema<T> =>
  (values) => {
    const errors: Partial<Record<keyof T, string>> = {};
    for (const key of Object.keys(rules) as (keyof T)[]) {
      const validators = rules[key];
      if (!validators) continue;
      const raw = values[key];
      const value = typeof raw === "string" ? raw : String(raw ?? "");
      for (const validator of validators) {
        const error = validator(value);
        if (error) {
          errors[key] = error;
          break;
        }
      }
    }
    return errors;
  };