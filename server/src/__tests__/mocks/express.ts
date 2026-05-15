import { vi } from 'vitest';

export function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    user: null,
    session: null,
    params: {},
    body: {},
    headers: {},
    query: {},
    path: '/test',
    method: 'GET',
    requestId: 'req-test-id',
    ...overrides,
  };
}

export function makeRes() {
  const res: Record<string, ReturnType<typeof vi.fn>> & { statusCode: number; locals: Record<string, unknown> } = {
    statusCode: 200,
    locals: {},
    status: vi.fn(),
    json: vi.fn(),
    send: vi.fn(),
  };
  res.status = vi.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

export function makeNext() {
  return vi.fn();
}
