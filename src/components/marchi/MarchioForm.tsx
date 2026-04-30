import React, { useState } from 'react';
import { MarchioInput } from '../../types';
import { validateMarchio } from '../../utils/validation';
import { electronApi } from '../../api/electron';

interface MarchioFormProps {
  editingMarchio?: { id: number; nome: string; link_ita: string | null; link_eng: string | null } | null;
  onSave: (data: MarchioInput) => Promise<void>;
  onCancel: () => void;
}

export function MarchioForm({ editingMarchio, onSave, onCancel }: MarchioFormProps) {
  const [formData, setFormData] = useState({
    nome: editingMarchio?.nome || '',
    link_ita: editingMarchio?.link_ita || '',
    link_eng: editingMarchio?.link_eng || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatingLink, setGeneratingLink] = useState<{ field: 'ita' | 'eng'; loading: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleGenerateBitly = async (field: 'ita' | 'eng') => {
    const url = field === 'ita' ? formData.link_ita : formData.link_eng;
    if (!url) return;
    setGeneratingLink({ field, loading: true });
    const result = await electronApi.convertTinyUrl(url);
    if (result.shortLink) {
      setFormData(prev => ({ ...prev, [field === 'ita' ? 'link_ita' : 'link_eng']: result.shortLink }));
    } else {
      alert(result.error || 'Errore conversione link');
    }
    setGeneratingLink(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateMarchio(formData);
    if (!validation.success) {
      const error = validation.error as any;
      const fieldErrors: Record<string, string> = {};
      error?.errors?.forEach((err: any) => {
        if (err.path?.[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    await onSave({
      nome: formData.nome.trim(),
      link_ita: formData.link_ita || null,
      link_eng: formData.link_eng || null,
    });
    setSaving(false);
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4 border">
      <h3 className="font-bold mb-3">{editingMarchio ? 'Modifica' : 'Nuovo'} Marchio</h3>
      <form onSubmit={handleSubmit} className="grid gap-3">
        <div>
          <input
            type="text"
            placeholder="Nome marchio"
            value={formData.nome}
            onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
            className={`w-full p-2 border rounded ${errors.nome ? 'border-red-500' : ''}`}
          />
          {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Link (Italiano)</label>
            <input
              type="text"
              placeholder="Link ITA"
              value={formData.link_ita}
              onChange={e => setFormData(prev => ({ ...prev, link_ita: e.target.value }))}
              className={`w-full p-2 border rounded ${errors.link_ita ? 'border-red-500' : ''}`}
            />
          <button
            type="button"
            onClick={() => handleGenerateBitly('ita')}
            disabled={!formData.link_ita || generatingLink?.field === 'ita' || formData.link_ita.includes('tinyurl.com')}
            className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {generatingLink?.field === 'ita' ? '...' : '🔗 TinyURL'}
          </button>
        </div>
          {errors.link_ita && <p className="text-red-500 text-xs -mt-2">{errors.link_ita}</p>}
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Link (English)</label>
            <input
              type="text"
              placeholder="Link ENG"
              value={formData.link_eng}
              onChange={e => setFormData(prev => ({ ...prev, link_eng: e.target.value }))}
              className={`w-full p-2 border rounded ${errors.link_eng ? 'border-red-500' : ''}`}
            />
          <button
            type="button"
            onClick={() => handleGenerateBitly('eng')}
            disabled={!formData.link_eng || generatingLink?.field === 'eng' || formData.link_eng.includes('tinyurl.com')}
            className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {generatingLink?.field === 'eng' ? '...' : '🔗 TinyURL'}
          </button>
        </div>
          {errors.link_eng && <p className="text-red-500 text-xs -mt-2">{errors.link_eng}</p>}
        </div>
        <div className="flex gap-2 mt-2">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Annulla</button>
        </div>
      </form>
    </div>
  );
}