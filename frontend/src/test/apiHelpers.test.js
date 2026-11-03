import { describe, it, expect } from 'vitest';
import { queryKeys } from '../api/queries';
import { parseApiError, API_BASE_URL } from '../api/mpladsApi';

describe('Query Keys Factory', () => {
  it('generates deterministic query keys for MP endpoints', () => {
    expect(queryKeys.mp.stats('MP123')).toEqual(['mp', 'stats', 'MP123']);
    expect(queryKeys.mp.stats(null)).toEqual(['mp', 'stats', 'me']);
    expect(queryKeys.mp.project('PRJ-001')).toEqual(['mp', 'project', 'PRJ-001']);
    expect(queryKeys.mp.projects('MP123', { status: 'Sanctioned' })).toEqual([
      'mp',
      'projects',
      'MP123',
      { status: 'Sanctioned' },
    ]);
  });

  it('generates deterministic query keys for DA endpoints', () => {
    expect(queryKeys.da.stats('Lucknow')).toEqual(['da', 'stats', 'Lucknow']);
    expect(queryKeys.da.stats(undefined)).toEqual(['da', 'stats', 'me']);
    expect(queryKeys.da.reviewQueue('Lucknow')).toEqual(['da', 'reviewQueue', 'Lucknow']);
    expect(queryKeys.da.projectDetail('PRJ-999')).toEqual(['da', 'projectDetail', 'PRJ-999']);
  });
});

describe('API Error Handling and Configuration', () => {
  it('API_BASE_URL contains no trailing slash', () => {
    expect(API_BASE_URL.endsWith('/')).toBe(false);
  });

  it('parseApiError cleanly extracts string detail', async () => {
    const mockResponse = new Response(JSON.stringify({ detail: 'Project not found' }), {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'application/json' },
    });
    const errorMsg = await parseApiError(mockResponse);
    expect(errorMsg).toBe('Project not found');
  });

  it('parseApiError formats Pydantic validation error arrays', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        detail: [
          { loc: ['body', 'estimated_cost'], msg: 'Input should be greater than 0' },
          { loc: ['body', 'category'], msg: 'Field required' },
        ],
      }),
      { status: 422, statusText: 'Unprocessable Entity', headers: { 'Content-Type': 'application/json' } }
    );
    const errorMsg = await parseApiError(mockResponse);
    expect(errorMsg).toContain('estimated_cost: Input should be greater than 0');
    expect(errorMsg).toContain('category: Field required');
  });

  it('parseApiError falls back to statusText when body is not JSON', async () => {
    const mockResponse = new Response('<html>502 Bad Gateway</html>', {
      status: 502,
      statusText: 'Bad Gateway',
    });
    const errorMsg = await parseApiError(mockResponse);
    expect(errorMsg).toBe('Bad Gateway');
  });
});

