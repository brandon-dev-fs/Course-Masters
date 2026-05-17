import { describe, it, expect, beforeEach } from 'vitest';
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

vi.mock('../../api/client.js', () => ({ apiClient: apiClientMock }));

import { coursesApi } from '../../api/courses.js';

const mockCourse = { id: 'c1', title: 'Course 1', description: 'Desc' };

describe('coursesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll calls GET /courses', async () => {
    apiClientMock.get.mockResolvedValueOnce([mockCourse]);
    const result = await coursesApi.getAll();
    expect(apiClientMock.get).toHaveBeenCalledWith('/courses');
    expect(result).toEqual([mockCourse]);
  });

  it('getOne calls GET /courses/:id', async () => {
    apiClientMock.get.mockResolvedValueOnce(mockCourse);
    const result = await coursesApi.getOne('c1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/courses/c1');
    expect(result).toEqual(mockCourse);
  });

  it('create calls POST /courses with data', async () => {
    const payload = { title: 'New Course', description: 'Desc' };
    apiClientMock.post.mockResolvedValueOnce(mockCourse);
    const result = await coursesApi.create(payload);
    expect(apiClientMock.post).toHaveBeenCalledWith('/courses', payload);
    expect(result).toEqual(mockCourse);
  });

  it('create calls POST /courses with title only', async () => {
    const payload = { title: 'New Course' };
    apiClientMock.post.mockResolvedValueOnce(mockCourse);
    await coursesApi.create(payload);
    expect(apiClientMock.post).toHaveBeenCalledWith('/courses', payload);
  });

  it('update calls PUT /courses/:id with data', async () => {
    const updates = { title: 'Updated' };
    apiClientMock.put.mockResolvedValueOnce({ ...mockCourse, ...updates });
    const result = await coursesApi.update('c1', updates);
    expect(apiClientMock.put).toHaveBeenCalledWith('/courses/c1', updates);
    expect(result).toMatchObject({ title: 'Updated' });
  });

  it('update can set syllabus to null', async () => {
    const updates = { syllabus: null };
    apiClientMock.put.mockResolvedValueOnce(mockCourse);
    await coursesApi.update('c1', updates);
    expect(apiClientMock.put).toHaveBeenCalledWith('/courses/c1', updates);
  });

  it('delete calls DELETE /courses/:id', async () => {
    apiClientMock.delete.mockResolvedValueOnce(undefined);
    const result = await coursesApi.delete('c1');
    expect(apiClientMock.delete).toHaveBeenCalledWith('/courses/c1');
    expect(result).toBeUndefined();
  });
});
