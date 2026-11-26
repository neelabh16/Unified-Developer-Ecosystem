import { describe, expect, it } from 'vitest';
import {
  MAX_IMAGE_SIZE_BYTES,
  portfolioSchema,
  projectSchema,
  validateImageFile,
} from '../utils/validation';

describe('Validation schemas & upload helpers', () => {
  it('validates projectSchema with backend-aligned githubUrl and rejects unsafe URIs', () => {
    const valid = projectSchema.safeParse({
      title: 'Quantum Mesh',
      desc: 'Distributed GPU orchestration engine for edge clusters.',
      category: 'Systems',
      difficulty: 'Advanced',
      githubUrl: 'https://github.com/devverse/quantum-mesh',
    });
    expect(valid.success).toBe(true);
    expect(valid.data.githubUrl).toBe('https://github.com/devverse/quantum-mesh');
    expect(valid.data).not.toHaveProperty('demo');

    const emptyUrl = projectSchema.safeParse({
      title: 'Quantum Mesh',
      desc: 'Distributed GPU orchestration engine for edge clusters.',
      category: 'Systems',
      difficulty: 'Intermediate',
      githubUrl: '',
    });
    expect(emptyUrl.success).toBe(true);

    const jsUri = projectSchema.safeParse({
      title: 'Quantum Mesh',
      desc: 'Distributed GPU orchestration engine for edge clusters.',
      category: 'Systems',
      difficulty: 'Beginner',
      githubUrl: 'javascript:alert(1)',
    });
    expect(jsUri.success).toBe(false);

    const dataUri = projectSchema.safeParse({
      title: 'Quantum Mesh',
      desc: 'Distributed GPU orchestration engine for edge clusters.',
      category: 'Systems',
      difficulty: 'Beginner',
      githubUrl: 'data:text/html,<script>alert(1)</script>',
    });
    expect(dataUri.success).toBe(false);
  });

  it('validates portfolioSchema with title/accent fields and http(s) URL enforcement', () => {
    const valid = portfolioSchema.safeParse({
      name: 'Ada Lovelace',
      title: 'Systems Architect',
      accent: '#7c6fff',
      links: [{ label: 'GitHub', url: 'https://github.com/ada' }],
      projects: [
        {
          title: 'Analytical Engine',
          desc: 'Symbolic engine',
          githubUrl: 'http://localhost:5000/repo',
        },
      ],
    });
    expect(valid.success).toBe(true);
    expect(valid.data.title).toBe('Systems Architect');
    expect(valid.data.accent).toBe('#7c6fff');

    const badLink = portfolioSchema.safeParse({
      name: 'Ada Lovelace',
      links: [{ label: 'XSS', url: 'javascript:alert(1)' }],
    });
    expect(badLink.success).toBe(false);

    const badProjectUrl = portfolioSchema.safeParse({
      name: 'Ada Lovelace',
      projects: [{ title: 'Demo', githubUrl: 'data:text/plain,hello' }],
    });
    expect(badProjectUrl.success).toBe(false);
  });

  it('accepts uppercase image MIME types in validateImageFile and enforces size limit', () => {
    expect(validateImageFile({ type: 'IMAGE/PNG', size: 1024 }).valid).toBe(true);
    expect(validateImageFile({ type: 'Image/WebP', size: 2048 }).valid).toBe(true);
    expect(validateImageFile({ type: 'image/svg+xml', size: 512 }).valid).toBe(false);
    expect(
      validateImageFile({ type: 'image/png', size: MAX_IMAGE_SIZE_BYTES + 1 }).valid
    ).toBe(false);
  });
});
