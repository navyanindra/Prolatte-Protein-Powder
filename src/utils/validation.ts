export const normalizePhone = (value: string) => value.replace(/\D/g, "");

export const isValidPhone = (value: string) => {
  const digits = normalizePhone(value);
  return digits.length >= 10 && digits.length <= 15;
};

export const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);
