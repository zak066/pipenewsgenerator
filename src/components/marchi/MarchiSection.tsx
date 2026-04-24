import React, { useState, useMemo } from 'react';
import { Marchio, MarchioInput } from '../../types';
import { useMarchi } from '../../contexts/MarchiContext';
import { Button } from '../common/Button';
import { MarchioForm } from './MarchioForm';
import { MarchioTable } from './MarchioTable';
import { ConfirmDialog } from '../common/Modal';

interface MarchiSectionProps {
  onExport: () => Promise<void>;
}

export function MarchiSection({ onExport }: MarchiSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingMarchio, setEditingMarchio] = useState<Marchio | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [convertConfirm, setConvertConfirm] = useState<{ id: number; type: 'ita' | 'eng'; url: string; newUrl: string } | null>(null);

  const {
    marchi,
    loading,
    selectedIds,
    testingLinks,
    toggleSelect,
    deselectAll,
    addMarchio,
    updateMarchio,
    deleteMarchio,
    testLink,
    convertToTinyUrl,
    filteredMarchi,
    selectedCount,
    refresh,
  } = useMarchi();

  const filteredWithSearch = useMemo(() => {
    return filteredMarchi.filter(m => m.nome.toLowerCase().includes(searchValue.toLowerCase()));
  }, [filteredMarchi, searchValue]);

  const handleSelectAll = () => {
    if (selectedIds.size === filteredWithSearch.length) {
      deselectAll();
    } else {
      filteredWithSearch.forEach(m => {
        if (!selectedIds.has(m.id)) toggleSelect(m.id);
      });
    }
  };

  const handleEdit = (m: Marchio) => {
    setEditingMarchio(m);
    setShowForm(true);
  };

  const handleSaveForm = async (data: MarchioInput) => {
    try {
      if (editingMarchio) {
        await updateMarchio({ ...editingMarchio, ...data });
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Marchio aggiornato con successo!', type: 'success' } }));
      } else {
        await addMarchio(data);
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Marchio creato con successo!', type: 'success' } }));
      }
      setShowForm(false);
      setEditingMarchio(null);
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Errore durante il salvataggio', type: 'error' } }));
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingMarchio(null);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirm(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm !== null) {
      await deleteMarchio(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const handleConvertClick = async (id: number, type: 'ita' | 'eng') => {
    const marchio = marchi.find(m => m.id === id);
    if (!marchio) return;
    const currentUrl = type === 'ita' ? marchio.link_ita : marchio.link_eng;
    if (!currentUrl || !currentUrl.includes('bit.ly')) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Il link attuale non è un URL bit.ly valido', type: 'error' } }));
      return;
    }
    
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Conversione in corso...', type: 'info' } }));
    
    try {
      const result = await window.electronAPI.convertTinyUrl(currentUrl);
      if (result.shortLink) {
        setConvertConfirm({ id, type, url: currentUrl, newUrl: result.shortLink });
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: result.error || 'Errore durante la conversione', type: 'error' } }));
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Errore durante la conversione', type: 'error' } }));
    }
  };

  const handleConvertConfirm = async () => {
    if (convertConfirm) {
      const marchio = marchi.find(m => m.id === convertConfirm.id);
      if (marchio) {
        await window.electronAPI.updateMarchio({ 
          ...marchio, 
          [convertConfirm.type === 'ita' ? 'link_ita' : 'link_eng']: convertConfirm.newUrl 
        });
        await refresh();
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Link aggiornato con successo!', type: 'success' } }));
      }
      setConvertConfirm(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport();
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'File esportati con successo!', type: 'success' } }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Errore durante esportazione', type: 'error' } }));
    }
    setExporting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestione Marchi</h1>
        <div className="flex gap-2">
          <Button variant="success" onClick={handleExport} loading={exporting}>
            Esporta Lista
          </Button>
          <Button variant="primary" onClick={() => { setShowForm(true); setEditingMarchio(null); }}>
            + Aggiungi Marchio
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Cerca marchio..."
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded">
            <span className="font-medium">{selectedCount} selezionati</span>
            <button onClick={deselectAll} className="text-blue-600 hover:underline">Deseleziona</button>
          </div>
        )}
      </div>

      {showForm && (
        <MarchioForm
          editingMarchio={editingMarchio}
          onSave={handleSaveForm}
          onCancel={handleCancelForm}
        />
      )}

      <MarchioTable
        marchi={filteredWithSearch}
        selectedIds={selectedIds}
        testingLinks={testingLinks}
        onToggleSelect={toggleSelect}
        onSelectAll={handleSelectAll}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onTestLink={testLink}
        onConvertTinyUrl={handleConvertClick}
      />

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Conferma Eliminazione"
        message="Sei sicuro di voler eliminare questo marchio? L'azione non può essere annullata."
        confirmText="Elimina"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={convertConfirm !== null}
        onClose={() => setConvertConfirm(null)}
        onConfirm={handleConvertConfirm}
        title="Conferma Conversione"
        message={convertConfirm ? `Link convertito!\n\nOriginale: ${convertConfirm.url}\nNuovo: ${convertConfirm.newUrl}\n\nVuoi aggiornare il link?` : ''}
        confirmText="Aggiorna"
        variant="warning"
      />
    </div>
  );
}