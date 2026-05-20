import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClientMock } from '../mocks/apiClient.mock.js';

vi.mock('../../api/client.js', () => ({ apiClient: apiClientMock }));

import useYouTubeTitle from '../../hooks/useYouTubeTitle.js';

const VALID_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

function makeTitleTouchedRef(value = false): React.RefObject<boolean> {
  return { current: value };
}

describe('useYouTubeTitle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchingTitle is false initially', () => {
    const onTitleFetched = vi.fn();
    const { result } = renderHook(() =>
      useYouTubeTitle({
        url: VALID_URL,
        titleTouched: makeTitleTouchedRef(false),
        onTitleFetched,
      }),
    );
    expect(result.current.fetchingTitle).toBe(false);
  });

  it('does not fetch when URL is empty', async () => {
    const onTitleFetched = vi.fn();
    const { result } = renderHook(() =>
      useYouTubeTitle({
        url: '',
        titleTouched: makeTitleTouchedRef(false),
        onTitleFetched,
      }),
    );

    await act(async () => {
      await result.current.handleUrlBlur();
    });

    expect(apiClientMock.get).not.toHaveBeenCalled();
  });

  it('does not fetch when URL is not a YouTube URL', async () => {
    const onTitleFetched = vi.fn();
    const { result } = renderHook(() =>
      useYouTubeTitle({
        url: 'https://www.vimeo.com/123456',
        titleTouched: makeTitleTouchedRef(false),
        onTitleFetched,
      }),
    );

    await act(async () => {
      await result.current.handleUrlBlur();
    });

    expect(apiClientMock.get).not.toHaveBeenCalled();
  });

  it('does not fetch when titleTouched is true', async () => {
    const onTitleFetched = vi.fn();
    const { result } = renderHook(() =>
      useYouTubeTitle({
        url: VALID_URL,
        titleTouched: makeTitleTouchedRef(true),
        onTitleFetched,
      }),
    );

    await act(async () => {
      await result.current.handleUrlBlur();
    });

    expect(apiClientMock.get).not.toHaveBeenCalled();
  });

  it('fetches title via apiClient.get with correct query param when URL is valid', async () => {
    const onTitleFetched = vi.fn();
    apiClientMock.get.mockResolvedValueOnce({ title: 'Never Gonna Give You Up' });

    const { result } = renderHook(() =>
      useYouTubeTitle({
        url: VALID_URL,
        titleTouched: makeTitleTouchedRef(false),
        onTitleFetched,
      }),
    );

    await act(async () => {
      await result.current.handleUrlBlur();
    });

    expect(apiClientMock.get).toHaveBeenCalledWith(
      `/youtube/title?url=${encodeURIComponent(VALID_URL)}`,
    );
  });

  it('calls onTitleFetched with the fetched title on success', async () => {
    const onTitleFetched = vi.fn();
    apiClientMock.get.mockResolvedValueOnce({ title: 'Never Gonna Give You Up' });

    const { result } = renderHook(() =>
      useYouTubeTitle({
        url: VALID_URL,
        titleTouched: makeTitleTouchedRef(false),
        onTitleFetched,
      }),
    );

    await act(async () => {
      await result.current.handleUrlBlur();
    });

    expect(onTitleFetched).toHaveBeenCalledWith('Never Gonna Give You Up');
  });

  it('silently ignores API errors (does not call onTitleFetched)', async () => {
    const onTitleFetched = vi.fn();
    apiClientMock.get.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() =>
      useYouTubeTitle({
        url: VALID_URL,
        titleTouched: makeTitleTouchedRef(false),
        onTitleFetched,
      }),
    );

    await act(async () => {
      await result.current.handleUrlBlur();
    });

    expect(onTitleFetched).not.toHaveBeenCalled();
  });

  it('does not call onTitleFetched if titleTouched becomes true before response', async () => {
    const onTitleFetched = vi.fn();
    const titleTouched = makeTitleTouchedRef(false);
    // Return a response with a title, but simulate titleTouched set to true before the fetch completes
    apiClientMock.get.mockResolvedValueOnce({ title: 'Some Video' });

    // Set titleTouched.current to true after the hook is created but before the response
    const { result } = renderHook(() =>
      useYouTubeTitle({
        url: VALID_URL,
        titleTouched,
        onTitleFetched,
      }),
    );

    titleTouched.current = true;

    await act(async () => {
      await result.current.handleUrlBlur();
    });

    // titleTouched was already true when handleUrlBlur was called, so no fetch
    expect(onTitleFetched).not.toHaveBeenCalled();
  });

  it('fetchingTitle is false after successful fetch', async () => {
    const onTitleFetched = vi.fn();
    apiClientMock.get.mockResolvedValueOnce({ title: 'Some Title' });

    const { result } = renderHook(() =>
      useYouTubeTitle({
        url: VALID_URL,
        titleTouched: makeTitleTouchedRef(false),
        onTitleFetched,
      }),
    );

    await act(async () => {
      await result.current.handleUrlBlur();
    });

    expect(result.current.fetchingTitle).toBe(false);
  });

  it('fetchingTitle is false after failed fetch', async () => {
    const onTitleFetched = vi.fn();
    apiClientMock.get.mockRejectedValueOnce(new Error('Fail'));

    const { result } = renderHook(() =>
      useYouTubeTitle({
        url: VALID_URL,
        titleTouched: makeTitleTouchedRef(false),
        onTitleFetched,
      }),
    );

    await act(async () => {
      await result.current.handleUrlBlur();
    });

    expect(result.current.fetchingTitle).toBe(false);
  });
});
