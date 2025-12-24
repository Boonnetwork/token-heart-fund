import { z } from 'zod';

// URL validation schema
export const urlSchema = z.string().refine((url) => {
  if (!url) return true; // Allow empty
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'ipfs:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}, { message: 'Invalid URL format' });

// Campaign creation schema
export const campaignSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .refine((val) => !/<[^>]*>/.test(val), 'HTML tags are not allowed'),
  
  shortDescription: z
    .string()
    .trim()
    .max(150, 'Short description must be less than 150 characters')
    .refine((val) => !/<[^>]*>/.test(val), 'HTML tags are not allowed')
    .optional(),
  
  fullDescription: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(5000, 'Description must be less than 5000 characters')
    .refine((val) => !/<script/i.test(val), 'Scripts are not allowed'),
  
  goalAmount: z
    .string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 1000000000;
    }, 'Goal must be a positive number up to 1 billion'),
  
  durationDays: z
    .string()
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 1 && num <= 365;
    }, 'Duration must be between 1 and 365 days'),
  
  imageUrl: urlSchema.optional(),
});

// Donation validation
export const donationSchema = z.object({
  amount: z
    .string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Amount must be a positive number'),
});

// Sanitize text input (remove potential XSS)
export const sanitizeText = (input: string): string => {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Validate Ethereum address
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Parse and validate number input
export const parsePositiveNumber = (value: string): number | null => {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return null;
  return num;
};
