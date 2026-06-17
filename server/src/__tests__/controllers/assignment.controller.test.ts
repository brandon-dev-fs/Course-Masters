import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PassThrough } from 'stream';

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../services/assignment.service.js', () => ({
  assignmentService: {
    findAllByLesson: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    reorder: vi.fn(),
    markComplete: vi.fn(),
    markIncomplete: vi.fn(),
    getSavedVocabEntryFlashCards: vi.fn(),
    saveVocabEntryFlashCard: vi.fn(),
    removeVocabEntryFlashCard: vi.fn(),
    createFileAssignment: vi.fn(),
    getFileStream: vi.fn(),
  },
}));

import { assignmentController } from '../../controllers/assignment.controller.js';
import { assignmentService } from '../../services/assignment.service.js';
import { ValidationError } from '../../errors/ValidationError.js';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

const mockFindAll = assignmentService.findAllByLesson as ReturnType<typeof vi.fn>;
const mockFindById = assignmentService.findById as ReturnType<typeof vi.fn>;
const mockCreate = assignmentService.create as ReturnType<typeof vi.fn>;
const mockUpdate = assignmentService.update as ReturnType<typeof vi.fn>;
const mockRemove = assignmentService.remove as ReturnType<typeof vi.fn>;
const mockReorder = assignmentService.reorder as ReturnType<typeof vi.fn>;
const mockMarkComplete = assignmentService.markComplete as ReturnType<typeof vi.fn>;
const mockMarkIncomplete = assignmentService.markIncomplete as ReturnType<typeof vi.fn>;
const mockGetSavedVocabEntryFlashCards = assignmentService.getSavedVocabEntryFlashCards as ReturnType<typeof vi.fn>;
const mockSaveVocabEntryFlashCard = assignmentService.saveVocabEntryFlashCard as ReturnType<typeof vi.fn>;
const mockRemoveVocabEntryFlashCard = assignmentService.removeVocabEntryFlashCard as ReturnType<typeof vi.fn>;
const mockCreateFileAssignment = assignmentService.createFileAssignment as ReturnType<typeof vi.fn>;
const mockGetFileStream = assignmentService.getFileStream as ReturnType<typeof vi.fn>;

async function callHandler(handler: Function, req: ReturnType<typeof makeReq>) {
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('assignmentController.getAll', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all assignments for a lesson', async () => {
    const assignments = [{ id: 'a1', title: 'Assignment 1' }];
    mockFindAll.mockResolvedValue(assignments);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1', role: 'student' } });
    const { res, next } = await callHandler(assignmentController.getAll, req);
    expect(mockFindAll).toHaveBeenCalledWith('l1', 'user1');
    expect(res.json).toHaveBeenCalledWith(assignments);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('fail');
    mockFindAll.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(assignmentController.getAll, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.getOne', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns one assignment by id', async () => {
    const assignment = { id: 'a1', title: 'Assignment 1' };
    mockFindById.mockResolvedValue(assignment);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1', role: 'student' } });
    const { res, next } = await callHandler(assignmentController.getOne, req);
    expect(mockFindById).toHaveBeenCalledWith('a1', 'user1');
    expect(res.json).toHaveBeenCalledWith(assignment);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('not found');
    mockFindById.mockRejectedValue(err);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(assignmentController.getOne, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates assignment and responds with 201', async () => {
    const created = { id: 'a2', title: 'New Assignment' };
    mockCreate.mockResolvedValue(created);
    const req = makeReq({ params: { lessonId: 'l1' }, body: { type: 'note', title: 'New Assignment' } });
    const { res, next } = await callHandler(assignmentController.create, req);
    expect(mockCreate).toHaveBeenCalledWith('l1', req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('create fail');
    mockCreate.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, body: {} });
    const { next } = await callHandler(assignmentController.create, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates assignment and responds with json', async () => {
    const updated = { id: 'a1', title: 'Updated' };
    mockUpdate.mockResolvedValue(updated);
    const req = makeReq({ params: { assignmentId: 'a1' }, body: { title: 'Updated' } });
    const { res, next } = await callHandler(assignmentController.update, req);
    expect(mockUpdate).toHaveBeenCalledWith('a1', req.body);
    expect(res.json).toHaveBeenCalledWith(updated);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('update fail');
    mockUpdate.mockRejectedValue(err);
    const req = makeReq({ params: { assignmentId: 'a1' }, body: {} });
    const { next } = await callHandler(assignmentController.update, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes assignment and responds with 204', async () => {
    mockRemove.mockResolvedValue(undefined);
    const req = makeReq({ params: { assignmentId: 'a1' } });
    const { res, next } = await callHandler(assignmentController.remove, req);
    expect(mockRemove).toHaveBeenCalledWith('a1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('remove fail');
    mockRemove.mockRejectedValue(err);
    const req = makeReq({ params: { assignmentId: 'a1' } });
    const { next } = await callHandler(assignmentController.remove, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.reorder', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reorders assignments and responds with json', async () => {
    const reordered = [{ id: 'a2' }, { id: 'a1' }];
    mockReorder.mockResolvedValue(reordered);
    const req = makeReq({
      params: { lessonId: 'l1' },
      body: { assignmentIds: ['a2', 'a1'] },
    });
    const { res, next } = await callHandler(assignmentController.reorder, req);
    expect(mockReorder).toHaveBeenCalledWith('l1', ['a2', 'a1']);
    expect(res.json).toHaveBeenCalledWith(reordered);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('reorder fail');
    mockReorder.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, body: { assignmentIds: [] } });
    const { next } = await callHandler(assignmentController.reorder, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.complete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks assignment complete and responds with 201', async () => {
    const completion = { id: 'comp1', assignmentId: 'a1' };
    mockMarkComplete.mockResolvedValue(completion);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1', role: 'student' } });
    const { res, next } = await callHandler(assignmentController.complete, req);
    expect(mockMarkComplete).toHaveBeenCalledWith('a1', 'user1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(completion);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('complete fail');
    mockMarkComplete.mockRejectedValue(err);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(assignmentController.complete, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.uncomplete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks assignment incomplete and responds with 204', async () => {
    mockMarkIncomplete.mockResolvedValue(undefined);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1', role: 'student' } });
    const { res, next } = await callHandler(assignmentController.uncomplete, req);
    expect(mockMarkIncomplete).toHaveBeenCalledWith('a1', 'user1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('uncomplete fail');
    mockMarkIncomplete.mockRejectedValue(err);
    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(assignmentController.uncomplete, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.getSavedVocabEntryFlashCards', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns saved vocab flash cards for a lesson', async () => {
    const flashCards = [{ id: 'fc1', entryId: 'e1' }];
    mockGetSavedVocabEntryFlashCards.mockResolvedValue(flashCards);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1', role: 'student' } });
    const { res, next } = await callHandler(assignmentController.getSavedVocabEntryFlashCards, req);
    expect(mockGetSavedVocabEntryFlashCards).toHaveBeenCalledWith('l1', 'user1');
    expect(res.json).toHaveBeenCalledWith(flashCards);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('flash card fetch fail');
    mockGetSavedVocabEntryFlashCards.mockRejectedValue(err);
    const req = makeReq({ params: { lessonId: 'l1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(assignmentController.getSavedVocabEntryFlashCards, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.saveVocabEntryFlashCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saves vocab entry flash card and responds with 201', async () => {
    const saved = { id: 'fc1', entryId: 'e1' };
    mockSaveVocabEntryFlashCard.mockResolvedValue(saved);
    const req = makeReq({ params: { entryId: 'e1' }, user: { id: 'user1', role: 'student' } });
    const { res, next } = await callHandler(assignmentController.saveVocabEntryFlashCard, req);
    expect(mockSaveVocabEntryFlashCard).toHaveBeenCalledWith('e1', 'user1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(saved);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('save flash card fail');
    mockSaveVocabEntryFlashCard.mockRejectedValue(err);
    const req = makeReq({ params: { entryId: 'e1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(assignmentController.saveVocabEntryFlashCard, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.removeVocabEntryFlashCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes vocab entry flash card and responds with 204', async () => {
    mockRemoveVocabEntryFlashCard.mockResolvedValue(undefined);
    const req = makeReq({ params: { entryId: 'e1' }, user: { id: 'user1', role: 'student' } });
    const { res, next } = await callHandler(assignmentController.removeVocabEntryFlashCard, req);
    expect(mockRemoveVocabEntryFlashCard).toHaveBeenCalledWith('e1', 'user1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const err = new Error('remove flash card fail');
    mockRemoveVocabEntryFlashCard.mockRejectedValue(err);
    const req = makeReq({ params: { entryId: 'e1' }, user: { id: 'user1', role: 'student' } });
    const { next } = await callHandler(assignmentController.removeVocabEntryFlashCard, req);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('assignmentController.uploadFile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls next with ValidationError when title is missing', async () => {
    const req = makeReq({ params: { lessonId: 'l1' }, body: {}, user: { id: 'user1', role: 'teacher' } });
    const { next } = await callHandler(assignmentController.uploadFile, req);
    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it('calls next with ValidationError when title is blank', async () => {
    const req = makeReq({ params: { lessonId: 'l1' }, body: { title: '   ' }, user: { id: 'user1', role: 'teacher' } });
    const { next } = await callHandler(assignmentController.uploadFile, req);
    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it('calls next with ValidationError when file is missing', async () => {
    const req = makeReq({ params: { lessonId: 'l1' }, body: { title: 'My File' }, user: { id: 'user1', role: 'teacher' } });
    const { next } = await callHandler(assignmentController.uploadFile, req);
    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it('creates file assignment and responds with 201 when title and file are present', async () => {
    const created = { id: 'a-new', title: 'My File', type: 'file' };
    mockCreateFileAssignment.mockResolvedValue(created);
    const req = makeReq({
      params: { lessonId: 'l1' },
      body: { title: 'My File' },
      file: { originalname: 'test.pdf', mimetype: 'application/pdf', size: 1024, buffer: Buffer.from('') },
      user: { id: 'user1', role: 'teacher' },
    });
    const { res, next } = await callHandler(assignmentController.uploadFile, req);
    expect(mockCreateFileAssignment).toHaveBeenCalledWith('l1', {
      title: 'My File',
      objective: undefined,
      file: req.file,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('assignmentController.downloadFile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets headers and pipes the stream to res on success', async () => {
    const mockStream = new PassThrough();
    mockGetFileStream.mockResolvedValue({
      stream: mockStream,
      filename: 'test.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    });

    const res = makeRes() as ReturnType<typeof makeRes> & {
      setHeader: ReturnType<typeof vi.fn>;
      destroy: ReturnType<typeof vi.fn>;
    };
    res.setHeader = vi.fn();
    res.destroy = vi.fn();

    // Spy on pipe so we can verify it was called
    const pipeSpy = vi.spyOn(mockStream, 'pipe').mockReturnValue(res as unknown as PassThrough);

    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1', role: 'student' } });
    const next = makeNext();

    assignmentController.downloadFile(req, res as unknown as Parameters<typeof assignmentController.downloadFile>[1], next);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('test.pdf'),
    );
    expect(pipeSpy).toHaveBeenCalledWith(res);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls res.destroy when stream emits an error', async () => {
    const mockStream = new PassThrough();
    mockGetFileStream.mockResolvedValue({
      stream: mockStream,
      filename: 'test.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    });

    const res = makeRes() as ReturnType<typeof makeRes> & {
      setHeader: ReturnType<typeof vi.fn>;
      destroy: ReturnType<typeof vi.fn>;
    };
    res.setHeader = vi.fn();
    res.destroy = vi.fn();

    vi.spyOn(mockStream, 'pipe').mockReturnValue(res as unknown as PassThrough);

    const req = makeReq({ params: { assignmentId: 'a1' }, user: { id: 'user1', role: 'student' } });
    const next = makeNext();

    assignmentController.downloadFile(req, res as unknown as Parameters<typeof assignmentController.downloadFile>[1], next);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    mockStream.emit('error', new Error('S3 error'));

    expect(res.destroy).toHaveBeenCalled();
  });
});
