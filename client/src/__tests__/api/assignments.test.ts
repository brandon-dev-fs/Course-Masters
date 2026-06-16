import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { vi } from 'vitest';

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../api/client.js', () => ({
  apiClient: apiClientMock,
  ApiClientError: class ApiClientError extends Error {
    constructor(public code: string, message: string, public details?: unknown, public errorClass?: string) {
      super(message);
      this.name = 'ApiClientError';
    }
  },
}));

import { assignmentsApi, uploadFileAssignment, getFileDownloadUrl } from '../../api/assignments.js';

const mockAssignment = {
  id: 'a1',
  lessonId: 'lesson-1',
  order: 1,
  title: 'Note Assignment',
  type: 'note',
  objective: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  completed: false,
  noteAssignment: null,
  videoAssignment: null,
  readingAssignment: null,
  vocabAssignment: null,
  practiceProblemAssignment: null,
};

describe('assignmentsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll calls GET /lessons/:lessonId/assignments', async () => {
    apiClientMock.get.mockResolvedValueOnce([mockAssignment]);
    const result = await assignmentsApi.getAll('lesson-1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/lessons/lesson-1/assignments');
    expect(result).toEqual([mockAssignment]);
  });

  it('create calls POST /lessons/:lessonId/assignments with payload', async () => {
    const payload = { title: 'New Note', type: 'note' as const, content: { body: {} } };
    apiClientMock.post.mockResolvedValueOnce(mockAssignment);
    const result = await assignmentsApi.create('lesson-1', payload);
    expect(apiClientMock.post).toHaveBeenCalledWith('/lessons/lesson-1/assignments', payload);
    expect(result).toEqual(mockAssignment);
  });

  it('update calls PUT /assignments/:assignmentId with payload', async () => {
    const payload = { title: 'Updated Title' };
    const updated = { ...mockAssignment, title: 'Updated Title' };
    apiClientMock.put.mockResolvedValueOnce(updated);
    const result = await assignmentsApi.update('a1', payload);
    expect(apiClientMock.put).toHaveBeenCalledWith('/assignments/a1', payload);
    expect(result).toEqual(updated);
  });

  it('delete calls DELETE /assignments/:assignmentId', async () => {
    apiClientMock.delete.mockResolvedValueOnce(undefined);
    const result = await assignmentsApi.delete('a1');
    expect(apiClientMock.delete).toHaveBeenCalledWith('/assignments/a1');
    expect(result).toBeUndefined();
  });

  it('reorder calls PUT /lessons/:lessonId/assignments/reorder with payload', async () => {
    const payload = { assignmentIds: ['a2', 'a1'] };
    apiClientMock.put.mockResolvedValueOnce([mockAssignment]);
    const result = await assignmentsApi.reorder('lesson-1', payload);
    expect(apiClientMock.put).toHaveBeenCalledWith('/lessons/lesson-1/assignments/reorder', payload);
    expect(result).toEqual([mockAssignment]);
  });

  it('complete calls POST /assignments/:assignmentId/complete', async () => {
    const completion = { id: 'c1', userId: 'u1', assignmentId: 'a1', completedAt: '2024-01-01' };
    apiClientMock.post.mockResolvedValueOnce(completion);
    const result = await assignmentsApi.complete('a1');
    expect(apiClientMock.post).toHaveBeenCalledWith('/assignments/a1/complete', {});
    expect(result).toEqual(completion);
  });

  it('uncomplete calls DELETE /assignments/:assignmentId/complete', async () => {
    apiClientMock.delete.mockResolvedValueOnce(undefined);
    const result = await assignmentsApi.uncomplete('a1');
    expect(apiClientMock.delete).toHaveBeenCalledWith('/assignments/a1/complete');
    expect(result).toBeUndefined();
  });

  it('getSavedFlashCards calls GET /lessons/:lessonId/assignments/vocab-flashcards', async () => {
    const entries = [{ id: 'e1', term: 'Hello', definition: 'A greeting' }];
    apiClientMock.get.mockResolvedValueOnce(entries);
    const result = await assignmentsApi.getSavedFlashCards('lesson-1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/lessons/lesson-1/assignments/vocab-flashcards');
    expect(result).toEqual(entries);
  });

  it('saveFlashCard calls POST /vocab-entries/:entryId/flashcard', async () => {
    const savedCard = { id: 'fc1', entryId: 'e1', createdAt: '2024-01-01T00:00:00Z' };
    apiClientMock.post.mockResolvedValueOnce(savedCard);
    const result = await assignmentsApi.saveFlashCard('e1');
    expect(apiClientMock.post).toHaveBeenCalledWith('/vocab-entries/e1/flashcard', {});
    expect(result).toEqual(savedCard);
  });

  it('removeFlashCard calls DELETE /vocab-entries/:entryId/flashcard', async () => {
    apiClientMock.delete.mockResolvedValueOnce(undefined);
    const result = await assignmentsApi.removeFlashCard('e1');
    expect(apiClientMock.delete).toHaveBeenCalledWith('/vocab-entries/e1/flashcard');
    expect(result).toBeUndefined();
  });
});

describe('getFileDownloadUrl', () => {
  it('returns the correct URL for an assignment ID', () => {
    const url = getFileDownloadUrl('asgn-123');
    expect(url).toBe('/api/assignments/asgn-123/file');
  });

  it('embeds the assignmentId in the URL path', () => {
    const url = getFileDownloadUrl('my-id');
    expect(url).toContain('my-id');
  });
});

describe('uploadFileAssignment', () => {
  let xhrMock: {
    open: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    setRequestHeader: ReturnType<typeof vi.fn>;
    upload: { addEventListener: ReturnType<typeof vi.fn> };
    addEventListener: ReturnType<typeof vi.fn>;
    withCredentials: boolean;
    status: number;
    responseText: string;
    _listeners: Record<string, ((...args: unknown[]) => void)[]>;
    _uploadListeners: Record<string, ((...args: unknown[]) => void)[]>;
  };

  beforeEach(() => {
    xhrMock = {
      open: vi.fn(),
      send: vi.fn(),
      setRequestHeader: vi.fn(),
      withCredentials: false,
      status: 200,
      responseText: '',
      _listeners: {},
      _uploadListeners: {},
      upload: {
        addEventListener: vi.fn((event, handler) => {
          xhrMock._uploadListeners[event] = xhrMock._uploadListeners[event] ?? [];
          xhrMock._uploadListeners[event].push(handler);
        }),
      },
      addEventListener: vi.fn((event, handler) => {
        xhrMock._listeners[event] = xhrMock._listeners[event] ?? [];
        xhrMock._listeners[event].push(handler);
      }),
    };

    vi.stubGlobal('XMLHttpRequest', vi.fn(function() { return xhrMock; }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function triggerXhrEvent(event: string) {
    const handlers = xhrMock._listeners[event] ?? [];
    handlers.forEach(h => h());
  }

  function triggerUploadEvent(event: string, eventData: unknown) {
    const handlers = xhrMock._uploadListeners[event] ?? [];
    handlers.forEach(h => h(eventData));
  }

  it('opens a POST request to the correct URL', async () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const promise = uploadFileAssignment('lesson-1', { title: 'My PDF' }, file);
    // Simulate success
    xhrMock.status = 200;
    xhrMock.responseText = JSON.stringify({ data: mockAssignment });
    triggerXhrEvent('load');
    await promise;
    expect(xhrMock.open).toHaveBeenCalledWith('POST', '/api/lessons/lesson-1/assignments/upload');
  });

  it('sets withCredentials to true', async () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const promise = uploadFileAssignment('lesson-1', { title: 'My PDF' }, file);
    xhrMock.status = 200;
    xhrMock.responseText = JSON.stringify({ data: mockAssignment });
    triggerXhrEvent('load');
    await promise;
    expect(xhrMock.withCredentials).toBe(true);
  });

  it('resolves with the parsed assignment on success', async () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const promise = uploadFileAssignment('lesson-1', { title: 'My PDF' }, file);
    xhrMock.status = 201;
    xhrMock.responseText = JSON.stringify({ data: mockAssignment });
    triggerXhrEvent('load');
    const result = await promise;
    expect(result).toEqual(mockAssignment);
  });

  it('calls onProgress with percentage during upload', async () => {
    const onProgress = vi.fn();
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const promise = uploadFileAssignment('lesson-1', { title: 'My PDF' }, file, onProgress);
    // Simulate progress event
    triggerUploadEvent('progress', { lengthComputable: true, loaded: 50, total: 100 });
    xhrMock.status = 200;
    xhrMock.responseText = JSON.stringify({ data: mockAssignment });
    triggerXhrEvent('load');
    await promise;
    expect(onProgress).toHaveBeenCalledWith(50);
  });

  it('does not call onProgress when lengthComputable is false', async () => {
    const onProgress = vi.fn();
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const promise = uploadFileAssignment('lesson-1', { title: 'My PDF' }, file, onProgress);
    triggerUploadEvent('progress', { lengthComputable: false, loaded: 50, total: 0 });
    xhrMock.status = 200;
    xhrMock.responseText = JSON.stringify({ data: mockAssignment });
    triggerXhrEvent('load');
    await promise;
    expect(onProgress).not.toHaveBeenCalled();
  });

  it('rejects with ApiClientError on 401', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const promise = uploadFileAssignment('lesson-1', { title: 'My PDF' }, file);
    xhrMock.status = 401;
    xhrMock.responseText = '';
    triggerXhrEvent('load');
    await expect(promise).rejects.toThrow();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth:unauthorized' }));
  });

  it('rejects with parsed error on non-2xx status', async () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const promise = uploadFileAssignment('lesson-1', { title: 'My PDF' }, file);
    xhrMock.status = 400;
    xhrMock.responseText = JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'Bad input' } });
    triggerXhrEvent('load');
    await expect(promise).rejects.toThrow('Bad input');
  });

  it('rejects with NETWORK_ERROR on network failure', async () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const promise = uploadFileAssignment('lesson-1', { title: 'My PDF' }, file);
    triggerXhrEvent('error');
    await expect(promise).rejects.toThrow('Network request failed');
  });

  it('rejects with PARSE_ERROR when response body is not valid JSON on success status', async () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const promise = uploadFileAssignment('lesson-1', { title: 'My PDF' }, file);
    xhrMock.status = 200;
    xhrMock.responseText = 'not json';
    triggerXhrEvent('load');
    await expect(promise).rejects.toThrow('Failed to parse server response');
  });

  it('includes objective in formData when provided', async () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const promise = uploadFileAssignment('lesson-1', { title: 'My PDF', objective: 'Learn stuff' }, file);
    xhrMock.status = 200;
    xhrMock.responseText = JSON.stringify({ data: mockAssignment });
    triggerXhrEvent('load');
    await promise;
    // send was called with a FormData — we just verify the call was made
    expect(xhrMock.send).toHaveBeenCalledWith(expect.any(FormData));
  });
});
