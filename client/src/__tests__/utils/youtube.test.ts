import { describe, it, expect } from 'vitest';
import { extractYouTubeId, getEmbedUrl, youtubeUrlRegex } from '../../utils/youtube.js';

describe('extractYouTubeId', () => {
  it('returns correct ID from youtube.com/watch?v= URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns correct ID from youtu.be/ short URL', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns correct ID from youtube.com/embed/ URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-YouTube URL', () => {
    expect(extractYouTubeId('https://www.example.com/video/123')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractYouTubeId('')).toBeNull();
  });

  it('handles video IDs with hyphens and underscores', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=abc-def_123')).toBe('abc-def_123');
  });
});

describe('getEmbedUrl', () => {
  it('returns youtube-nocookie.com/embed/<id> for a valid YouTube URL', () => {
    expect(getEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    );
  });

  it('returns null when extractYouTubeId returns null', () => {
    expect(getEmbedUrl('https://www.example.com/video')).toBeNull();
  });

  it('works with youtu.be short URLs', () => {
    expect(getEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    );
  });
});

describe('youtubeUrlRegex', () => {
  it('matches youtube.com/watch?v= URLs', () => {
    expect(youtubeUrlRegex.test('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });

  it('matches youtu.be/ short URLs', () => {
    expect(youtubeUrlRegex.test('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('does not match non-YouTube URLs', () => {
    expect(youtubeUrlRegex.test('https://www.vimeo.com/123456')).toBe(false);
  });
});
