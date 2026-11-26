import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Rocket, X } from 'lucide-react';
import { GitHubIcon } from '../components/common/BrandIcons';
import GlassCard from '../components/common/GlassCard';
import Button from '../components/common/Button';
import { projectsApi } from '../api/projects.api';
import { githubApi } from '../api/github.api';
import { uploadsApi } from '../api/uploads.api';
import { useToast } from '../hooks/useToast';
import { parseGithubRepoUrl } from '../utils/formatters';
import { resolveUploadUrl } from '../utils/avatar';
import { invalidateGamification } from '../utils/gamification';
import { projectSchema, validateImageFile } from '../utils/validation';

const CATEGORIES = [
  'Developer Tools',
  'AI & ML',
  'Web Apps',
  'Systems',
  'Open Source',
  'Security',
  'Data & Infra',
  'Mobile',
];

export default function SubmitProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [ghInput, setGhInput] = useState('');
  const [ghLoading, setGhLoading] = useState(false);
  const [ghStatus, setGhStatus] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      desc: '',
      category: 'Developer Tools',
      difficulty: 'Intermediate',
      tags: '',
      githubUrl: '',
    },
  });

  const handleFetchGithub = async () => {
    const parsed = parseGithubRepoUrl(ghInput);
    if (!parsed) {
      setGhStatus('Enter a valid GitHub repo URL like https://github.com/owner/repo');
      return;
    }
    setGhLoading(true);
    setGhStatus('Fetching repository metadata from GitHub…');
    try {
      const res = await githubApi.getRepo(parsed.owner, parsed.repo);
      const repo = res?.data?.repo || res?.data || res;
      if (repo?.name) setValue('title', repo.name, { shouldValidate: true });
      if (repo?.description) setValue('desc', repo.description, { shouldValidate: true });
      if (repo?.language) setValue('tags', repo.language, { shouldValidate: true });
      setValue('githubUrl', `https://github.com/${parsed.owner}/${parsed.repo}`, {
        shouldValidate: true,
      });
      setGhStatus(`Loaded ${parsed.owner}/${parsed.repo} successfully.`);
    } catch (err) {
      setGhStatus(err.message || 'Could not fetch GitHub repository.');
    } finally {
      setGhLoading(false);
    }
  };

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingImage(true);
    try {
      for (const file of files) {
        const check = validateImageFile(file);
        if (!check.valid) {
          showToast(check.message, 'error');
          continue;
        }
        const res = await uploadsApi.image(file);
        const url = res?.data?.url || res?.url;
        if (url) {
          setUploadedImages((prev) => [...prev, url]);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (values) => {
    try {
      const tags = Array.isArray(values.tags)
        ? values.tags
        : String(values.tags || '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

      const res = await projectsApi.create({
        title: values.title.trim(),
        desc: values.desc.trim(),
        category: values.category,
        difficulty: values.difficulty,
        tags,
        githubUrl: values.githubUrl?.trim() || '',
        images: uploadedImages,
      });

      const created = res?.data?.project || res?.data || res;
      const newId = created?.legacyId || created?.slug || created?._id || created?.id;
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      invalidateGamification(queryClient);
      showToast('Project published! (+25 XP)', 'success');
      navigate(newId ? `/projects/${encodeURIComponent(newId)}` : '/explore');
    } catch (err) {
      showToast(err.message || 'Failed to publish project', 'error');
    }
  };

  return (
    <div className="wrap page-header max-w-3xl" data-testid="page-submit-project">
      <span className="eyebrow">Ship &amp; Showcase</span>
      <h1 className="mb-3">
        Submit a <span className="grad-text">Project</span>
      </h1>
      <p className="lede mb-8">
        Publish your build to Explore and earn +25 XP. Import metadata from GitHub or fill it in
        manually.
      </p>

      <GlassCard className="mb-6 p-6">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <GitHubIcon className="h-4 w-4 text-[var(--accent)]" />
          <span>Import from GitHub (optional)</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="url"
            value={ghInput}
            onChange={(e) => setGhInput(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="flex-1"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleFetchGithub} loading={ghLoading}>
            Fetch details
          </Button>
        </div>
        {ghStatus && (
          <p className="mono mt-2 text-xs text-[var(--text-tertiary)]">{ghStatus}</p>
        )}
      </GlassCard>

      <GlassCard className="p-7">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="field">
            <label htmlFor="sp-title">Project title</label>
            <input
              id="sp-title"
              type="text"
              placeholder="e.g. Prism CLI"
              className={errors.title ? 'field-error' : ''}
              {...register('title')}
            />
            {errors.title && <span className="field-error-msg show">{errors.title.message}</span>}
          </div>

          <div className="field">
            <label htmlFor="sp-desc">Description</label>
            <textarea
              id="sp-desc"
              rows={4}
              placeholder="What does it solve, how is it architected, and what did you learn?"
              className={errors.desc ? 'field-error' : ''}
              {...register('desc')}
            />
            {errors.desc && <span className="field-error-msg show">{errors.desc.message}</span>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="sp-category">Category</label>
              <select id="sp-category" {...register('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="sp-difficulty">Difficulty</label>
              <select id="sp-difficulty" {...register('difficulty')}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="sp-tags">Tech stack / tags (comma-separated)</label>
            <input
              id="sp-tags"
              type="text"
              placeholder="React, Node.js, MongoDB, Tailwind"
              {...register('tags')}
            />
          </div>

          <div className="field">
            <label htmlFor="sp-github">GitHub URL (optional)</label>
            <input
              id="sp-github"
              type="url"
              placeholder="https://github.com/owner/repo"
              className={errors.githubUrl ? 'field-error' : ''}
              {...register('githubUrl')}
            />
            {errors.githubUrl && (
              <span className="field-error-msg show">{errors.githubUrl.message}</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="sp-images">Screenshots (optional, max 2 MB each)</label>
            <label
              htmlFor="sp-images"
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-6 text-center transition-colors hover:border-[var(--accent)]"
            >
              <ImagePlus className="mb-2 h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
              <span className="text-sm font-medium">
                {uploadingImage ? 'Uploading…' : 'Click to upload PNG, JPG, WebP, or GIF'}
              </span>
              <input
                id="sp-images"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFilesSelected}
              />
            </label>

            {uploadedImages.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {uploadedImages.map((url, idx) => (
                  <div
                    key={url + idx}
                    className="relative h-24 overflow-hidden rounded-lg border border-[var(--border)]"
                  >
                    <img
                      src={resolveUploadUrl(url)}
                      alt={`Upload ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() =>
                        setUploadedImages((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="absolute right-1 top-1 rounded-full bg-black/80 p-1 text-[var(--coral)]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" variant="primary" loading={isSubmitting} className="w-full">
            <Rocket className="h-4 w-4" aria-hidden="true" />
            Publish to Explore (+25 pts)
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
