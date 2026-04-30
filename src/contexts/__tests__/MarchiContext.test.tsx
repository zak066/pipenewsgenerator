import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MarchiProvider, useMarchi } from '../MarchiContext';
import { electronApi } from '../../api/electron';

// Mock electronAPI
vi.mock('../../api/electron', () => ({
  electronApi: {
    getMarchi: vi.fn(),
    addMarchio: vi.fn(),
    updateMarchio: vi.fn(),
    deleteMarchio: vi.fn(),
    testLink: vi.fn(),
    convertTinyUrl: vi.fn(),
    generateBitly: vi.fn(),
  },
}));

function TestComponent() {
  const { marchi, loading } = useMarchi();
  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'done'}</span>
      <span data-testid="count">{marchi.length}</span>
    </div>
  );
}

describe('MarchiContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carica i marchi al mount', async () => {
    (electronApi.getMarchi as any).mockResolvedValue([
      { id: 1, nome: 'Test', link_ita: null, link_eng: null },
    ]);

    render(
      <MarchiProvider>
        <TestComponent />
      </MarchiProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('done');
    });
    
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
});
