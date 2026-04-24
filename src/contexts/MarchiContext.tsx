import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Marchio, MarchioInput, LinkTestResults } from '../types';
import { electronApi } from '../api/electron';
import { validateMarchio } from '../utils/validation';

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToastContext must be used within ToastContext provider');
  return context;
}

function createToastEvent(message: string, type: 'success' | 'error' | 'info') {
  window.dispatchEvent(new CustomEvent('toast', { detail: { message, type } }));
}

interface MarchiContextType {
  marchi: Marchio[];
  loading: boolean;
  selectedIds: Set<number>;
  search: string;
  testingLinks: Record<number, LinkTestResults>;
  setSearch: (search: string) => void;
  toggleSelect: (id: number) => void;
  selectAll: (ids: number[]) => void;
  deselectAll: () => void;
  refresh: () => Promise<void>;
  addMarchio: (data: MarchioInput) => Promise<Marchio>;
  updateMarchio: (marchio: Marchio) => Promise<Marchio>;
  deleteMarchio: (id: number) => Promise<void>;
  testLink: (id: number, type: 'ita' | 'eng') => Promise<void>;
  convertToTinyUrl: (id: number, type: 'ita' | 'eng') => Promise<void>;
  generateBitly: (id: number, type: 'ita' | 'eng') => Promise<void>;
  filteredMarchi: Marchio[];
  selectedCount: number;
}

const MarchiContext = createContext<MarchiContextType | null>(null);

export function MarchiProvider({ children }: { children: React.ReactNode }) {
  const [marchi, setMarchi] = useState<Marchio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [testingLinks, setTestingLinks] = useState<Record<number, LinkTestResults>>({});

  const filteredMarchi = marchi.filter(m => m.nome.toLowerCase().includes(search.toLowerCase()));
  const selectedCount = selectedIds.size;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await electronApi.getMarchi();
      setMarchi(data);
    } catch (err) {
      console.error('Error loading marchi:', err);
      createToastEvent('Errore durante il caricamento dei marchi', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: number[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const addMarchio = useCallback(async (data: MarchioInput): Promise<Marchio> => {
    const validation = validateMarchio(data);
    if (!validation.success) {
      createToastEvent(validation.error.errors[0]?.message || 'Dati non validi', 'error');
      throw new Error('Validation failed');
    }
    const result = await electronApi.addMarchio(data);
    await refresh();
    createToastEvent('Marchio creato con successo!', 'success');
    return result;
  }, [refresh]);

  const updateMarchio = useCallback(async (marchio: Marchio): Promise<Marchio> => {
    const validation = validateMarchio(marchio);
    if (!validation.success) {
      createToastEvent(validation.error.errors[0]?.message || 'Dati non validi', 'error');
      throw new Error('Validation failed');
    }
    const result = await electronApi.updateMarchio(marchio);
    await refresh();
    createToastEvent('Marchio aggiornato con successo!', 'success');
    return result;
  }, [refresh]);

  const deleteMarchio = useCallback(async (id: number) => {
    await electronApi.deleteMarchio(id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    await refresh();
    createToastEvent('Marchio eliminato', 'success');
  }, [refresh]);

  const testLink = useCallback(async (id: number, type: 'ita' | 'eng') => {
    const marchio = marchi.find(m => m.id === id);
    if (!marchio) return;
    const url = type === 'ita' ? marchio.link_ita : marchio.link_eng;
    
    if (!url) {
      setTestingLinks(prev => ({
        ...prev,
        [id]: { ...prev[id], [type]: { status: 'invalid', message: 'Link non presente' } }
      }));
      return;
    }
    
    setTestingLinks(prev => ({
      ...prev,
      [id]: { ...prev[id], [type]: { status: 'loading', message: 'Test in corso...' } }
    }));
    
    const result = await electronApi.testLink(url);
    setTestingLinks(prev => ({
      ...prev,
      [id]: { ...prev[id], [type]: result }
    }));
  }, [marchi]);

  const convertToTinyUrl = useCallback(async (id: number, type: 'ita' | 'eng') => {
    const marchio = marchi.find(m => m.id === id);
    if (!marchio) return;
    const currentUrl = type === 'ita' ? marchio.link_ita : marchio.link_eng;
    if (!currentUrl || !currentUrl.includes('bit.ly')) {
      createToastEvent('Il link attuale non è un URL bit.ly valido', 'error');
      return;
    }
    const result = await electronApi.convertTinyUrl(currentUrl);
    if (result.shortLink) {
      if (confirm(`Link convertito!\n\nOriginale: ${currentUrl}\nNuovo: ${result.shortLink}\n\nVuoi aggiornare il link?`)) {
        await electronApi.updateMarchio({ ...marchio, [type === 'ita' ? 'link_ita' : 'link_eng']: result.shortLink });
        await refresh();
        createToastEvent('Link aggiornato con successo!', 'success');
      }
    } else {
      createToastEvent(result.error || 'Errore durante la conversione', 'error');
    }
  }, [marchi, refresh]);

  const generateBitly = useCallback(async (id: number, type: 'ita' | 'eng') => {
    const marchio = marchi.find(m => m.id === id);
    if (!marchio) return;
    const url = type === 'ita' ? marchio.link_ita : marchio.link_eng;
    if (!url) return;
    const result = await electronApi.convertTinyUrl(url);
    if (result.shortLink) {
      await electronApi.updateMarchio({ ...marchio, [type === 'ita' ? 'link_ita' : 'link_eng']: result.shortLink });
      await refresh();
      createToastEvent('Link generato!', 'success');
    } else {
      createToastEvent(result.error || 'Errore conversione link', 'error');
    }
  }, [marchi, refresh]);

  return (
    <MarchiContext.Provider value={{
      marchi, loading, selectedIds, search, testingLinks,
      setSearch, toggleSelect, selectAll, deselectAll,
      refresh, addMarchio, updateMarchio, deleteMarchio,
      testLink, convertToTinyUrl, generateBitly,
      filteredMarchi, selectedCount
    }}>
      {children}
    </MarchiContext.Provider>
  );
}

export function useMarchi() {
  const context = useContext(MarchiContext);
  if (!context) throw new Error('useMarchi must be used within MarchiProvider');
  return context;
}