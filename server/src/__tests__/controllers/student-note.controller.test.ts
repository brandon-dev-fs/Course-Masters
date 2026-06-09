import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/student-note.service.js', () => ({
  studentNoteService: {
    findByLesson: vi.fn(),
    upsert: vi.fn(),
    remove: vi.fn(),
  },
}));

import { studentNoteController } from '../../controllers/student-note.controller.js';
import { studentNoteService } from '../../services/student-note.service.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockFindByLesson = studentNoteService.findByLesson as ReturnType<typeof vi.fn>;
const mockUpsert = studentNoteService.upsert as ReturnType<typeof vi.fn>;
const mockRemove = studentNoteService.remove as ReturnType<typeof vi.fn>;

async function callHandler(handler: Function, req: ReturnType<typeof makeReq>) {
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('studentNoteController.get', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns notes for lesson (student role)', async () => {
    const notes = [{ id: 'n1', content: 'My note' }];
    mockFindByLesson.mockResolvedValue(notes);
    const req = makeReq({
      params: { lessonId: 'l1' },
      user: { id: 'user1', role: 'student' },
    });
    const { res, next } = await callHandler(studentNoteController.get, req);
    expect(mockFindByLesson).toHaveBeenCalledWith('l1', 'user1', 'student');
    expect(res.json).toHaveBeenCalledWith(notes);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns notes for lesson (teacher role)', async () => {
    const notes = [{ id: 'n1', content: 'Student note' }, { id: 'n2', content: 'Another note' }];
    mockFindByLesson.mockResolvedValue(notes);
    const req = makeReq({
      params: { lessonId: 'l1' },
      user: { id: 'teacher1', role: 'teacher' },
    });
    const { res, next } = await callHandler(studentNoteController.get, req);
    expect(mockFindByLesson).toHaveBeenCalledWith('l1', 'teacher1', 'teacher');
    expect(res.json).toHaveBeenCalledWith(notes);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('fail');
    mockFindByLesson.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(studentNoteController.get, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('studentNoteController.upsert', () => {
  beforeEach(() => vi.clearAllMocks());

  it('upserts note and responds with json', async () => {
    const note = { id: 'n1', content: 'Updated note' };
    mockUpsert.mockResolvedValue(note);
    const req = makeReq({
      params: { lessonId: 'l1' },
      body: { content: 'Updated note' },
      user: { id: 'user1', role: 'student' },
    });
    const { res, next } = await callHandler(studentNoteController.upsert, req);
    expect(mockUpsert).toHaveBeenCalledWith('l1', req.body, 'user1');
    expect(res.json).toHaveBeenCalledWith(note);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('upsert fail');
    mockUpsert.mockRejectedValue(err);
    const req = makeReq({
      params: { lessonId: 'l1' },
      body: { content: 'Note' },
      user: { id: 'user1', role: 'student' },
    });
    const { next } = await callHandler(studentNoteController.upsert, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('studentNoteController.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes note and responds with 204', async () => {
    mockRemove.mockResolvedValue(undefined);
    const req = makeReq({
      params: { studentNoteId: 'n1' },
      user: { id: 'user1', role: 'student' },
    });
    const { res, next } = await callHandler(studentNoteController.remove, req);
    expect(mockRemove).toHaveBeenCalledWith('n1', 'user1', 'student');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on service failure', async () => {
    const err = new Error('remove fail');
    mockRemove.mockRejectedValue(err);
    const req = makeReq({
      params: { studentNoteId: 'n1' },
      user: { id: 'user1', role: 'student' },
    });
    const { next } = await callHandler(studentNoteController.remove, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});
