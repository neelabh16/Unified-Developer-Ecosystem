import { z } from 'zod';

const PASSWORD_SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/`~\\]/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]+$/;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB per backend errorHandler

export function validateImageFile(file) {
  if (!file) return { valid: false, message: 'No file selected.' };
  const mime = (file.type || '').toLowerCase();
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mime)) {
    return {
      valid: false,
      message: 'Unsupported image format. Use JPEG, PNG, WebP, or GIF.',
    };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      message: 'File size exceeds 2 MB limit.',
    };
  }
  return { valid: true, message: null };
}

function isSafeHttpUrl(val) {
  try {
    const parsed = new URL(val);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const safeHttpUrlSchema = z
  .string()
  .trim()
  .refine(isSafeHttpUrl, 'Enter a valid http:// or https:// URL');

const optionalSafeHttpUrlSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === '' || isSafeHttpUrl(val),
    'Enter a valid http:// or https:// URL'
  )
  .optional();

export const strongPasswordSchema = z
  .string()
  .min(7, 'Password must be at least 7 characters')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
  .regex(/[0-9]/, 'Password must include at least one number')
  .regex(PASSWORD_SPECIAL_RE, 'Password must include at least one special character');

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name max 60 characters'),
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(24, 'Username max 24 characters')
      .regex(USERNAME_RE, 'Only letters, numbers, underscores, dots, and hyphens allowed'),
    email: z.string().trim().email('Enter a valid email address'),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    terms: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the Terms & Community Guidelines' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const projectSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(80, 'Title max 80 characters'),
  desc: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000, 'Description max 1000 characters'),
  category: z.string().trim().min(1, 'Category is required'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  githubUrl: optionalSafeHttpUrlSchema,
});

export const commentSchema = z.object({
  text: z.string().trim().min(2, 'Comment must be at least 2 characters').max(1000, 'Comment max 1000 characters'),
});

export const discussionSchema = z.object({
  title: z.string().trim().min(6, 'Title must be at least 6 characters').max(150, 'Title max 150 characters'),
  body: z.string().trim().min(12, 'Body must be at least 12 characters').max(5000, 'Body max 5000 characters'),
});

export const replySchema = z.object({
  text: z.string().trim().min(2, 'Reply must be at least 2 characters').max(2000, 'Reply max 2000 characters'),
});

export const codexEntrySchema = z.object({
  title: z.string().trim().min(8, 'Title must be at least 8 characters').max(160, 'Title max 160 characters'),
  category: z.enum([
    'Debugging',
    'Performance',
    'Architecture',
    'Incidents',
    'Career',
    'Solo Building',
    'Security',
    'Other',
  ]),
  problem: z.string().trim().min(20, 'Problem description must be at least 20 characters').max(3000),
  tried: z.string().trim().min(10, 'Tried section must be at least 10 characters').max(3000),
  fix: z.string().trim().min(10, 'Fix section must be at least 10 characters').max(3000),
  lesson: z.string().trim().min(10, 'Lesson must be at least 10 characters').max(3000),
});

export const squadSchema = z.object({
  name: z.string().trim().min(3, 'Squad name must be at least 3 characters').max(50, 'Squad name max 50 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(500, 'Description max 500 characters'),
});

export const messageSchema = z.object({
  text: z.string().trim().min(1, 'Message cannot be empty').max(1000, 'Message max 1000 characters'),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name max 60 characters').optional(),
  bio: z.string().trim().max(1000, 'Bio max 1000 characters').optional(),
  roleTitle: z.string().trim().max(80).optional(),
  location: z.string().trim().max(80).optional(),
  github: z.string().trim().max(100).optional(),
  skills: z.array(z.string()).optional(),
});

export const usernameChangeSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(24, 'Username max 24 characters')
    .regex(USERNAME_RE, 'Only letters, numbers, underscores, dots, and hyphens allowed'),
});

export const portfolioSchema = z.object({
  name: z.string().trim().min(1, 'Display name is required').max(80),
  title: z.string().trim().max(160).optional(),
  bio: z.string().trim().max(1500).optional(),
  accent: z.string().trim().optional(),
  skills: z.array(z.string()).optional(),
  links: z
    .array(
      z.object({
        label: z.string().trim().min(1, 'Label required'),
        url: safeHttpUrlSchema,
      })
    )
    .optional(),
  projects: z
    .array(
      z.object({
        title: z.string().trim().min(1, 'Project title required'),
        desc: z.string().trim().optional(),
        githubUrl: optionalSafeHttpUrlSchema,
      })
    )
    .optional(),
});
