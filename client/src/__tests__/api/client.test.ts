import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClientError, classifyError, apiClient } from '../../api/client.js';

function makeFetchResponse(options: {
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
}) {
  return {
    ok: options.ok,
    status: options.status,
    json: options.json ?? (async () => ({})),
  } as unknown as Response;
}

describe('ApiClientError', () => {
  it('sets code, message, details, and errorClass correctly', () => {
    const err = new ApiClientError('NOT_FOUND', 'Resource not found', { id: '1' }, 'client');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Resource not found');
    expect(err.details).toEqual({ id: '1' });
    expect(err.errorClass).toBe('client');
    expect(err.name).toBe('ApiClientError');
    expect(err).toBeInstanceOf(Error);
  });

  it('defaults errorClass to "server" when not provided', () => {
    const err = new ApiClientError('SERVER_ERROR', 'Boom');
    expect(err.errorClass).toBe('server');
  });
});

describe('classifyError', () => {
  it('returns server error message for errorClass "server"', () => {
    const err = new ApiClientError('SERVER_ERROR', 'Boom', undefined, 'server');
    expect(classifyError(err)).toBe('A server error occurred. Please try again later.');
  });

  it('returns client error message for errorClass "client"', () => {
    const err = new ApiClientError('BAD_REQUEST', 'Invalid input', undefined, 'client');
    expect(classifyError(err)).toBe('The request was invalid. Please check your input and try again.');
  });

  it('returns network error message for errorClass "network"', () => {
    const err = new ApiClientError('NETWORK_ERROR', 'No connection', undefined, 'network');
    expect(classifyError(err)).toBe('Could not connect to the server. Please check your network connection.');
  });
});

describe('apiClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('apiClient.get', () => {
    it('resolves with unwrapped data from { data: payload } envelope', async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse({
          ok: true,
          status: 200,
          json: async () => ({ data: { id: '1', title: 'Test' } }),
        }),
      );

      const result = await apiClient.get<{ id: string; title: string }>('/courses');
      expect(result).toEqual({ id: '1', title: 'Test' });
    });

    it('sends request to /api prefix with credentials include', async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse({
          ok: true,
          status: 200,
          json: async () => ({ data: [] }),
        }),
      );

      await apiClient.get('/courses');
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/courses',
        expect.objectContaining({ credentials: 'include' }),
      );
    });
  });

  describe('apiClient.post', () => {
    it('sends correct method, body, and Content-Type header', async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse({
          ok: true,
          status: 201,
          json: async () => ({ data: { id: '1' } }),
        }),
      );

      await apiClient.post('/courses', { title: 'New Course' });

      const [_url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe('POST');
      expect(options.body).toBe(JSON.stringify({ title: 'New Course' }));
      expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    });
  });

  describe('apiClient.delete', () => {
    it('returns undefined for 204 No Content response', async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse({
          ok: true,
          status: 204,
        }),
      );

      const result = await apiClient.delete('/courses/1');
      expect(result).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('throws ApiClientError with correct code from response body on non-2xx', async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse({
          ok: false,
          status: 404,
          json: async () => ({
            error: { code: 'NOT_FOUND', message: 'Resource not found' },
          }),
        }),
      );

      await expect(apiClient.get('/courses/999')).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Resource not found',
        errorClass: 'client',
      });
    });

    it('throws ApiClientError with server errorClass for 5xx responses', async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse({
          ok: false,
          status: 500,
          json: async () => ({
            error: { code: 'INTERNAL_ERROR', message: 'Server blew up' },
          }),
        }),
      );

      await expect(apiClient.get('/courses')).rejects.toMatchObject({
        errorClass: 'server',
      });
    });

    it('throws ApiClientError with network errorClass when fetch rejects', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(apiClient.get('/courses')).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        errorClass: 'network',
      });
    });

    it('dispatches auth:unauthorized custom event on 401 response', async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse({
          ok: false,
          status: 401,
          json: async () => ({
            error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
          }),
        }),
      );

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      await expect(apiClient.get('/protected')).rejects.toBeInstanceOf(ApiClientError);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth:unauthorized' }),
      );
    });
  });
});
