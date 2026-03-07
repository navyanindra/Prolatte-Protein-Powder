export const normalizePhone = (value: string) => value.replace(/\D/g, "");

export const isValidPhone = (value: string) => {
  const digits = normalizePhone(value);
  return digits.length === 10;
};

export const formatPhoneDisplay = (phone: string) => {
  const normalized = normalizePhone(phone);
  return normalized ? `+91 ${normalized}` : "";
};

export const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);
