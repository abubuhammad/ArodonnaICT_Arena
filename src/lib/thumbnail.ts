const DEFAULT_THUMBNAIL = '/images/course-default.jpg';

export function normalizeThumbnail(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_THUMBNAIL;

  const thumbnail = value.trim();
  if (/^https?:\/\/localhost(?::\d+)?\/uploads\//i.test(thumbnail)) {
    return DEFAULT_THUMBNAIL;
  }

  return thumbnail;
}
