import React, { useState } from 'react';
import { Marchio, Templates } from '../../types';

interface FileGeneratorProps {
  orderedMarchi: Marchio[];
  generatedFiles: { ita: string; eng: string } | null;
  generating: boolean;
  whatsappNumber: string;
  templates: Templates;
  selectedCount: number;
  onGenerate: () => void;
  onDownload: (filename: string) => void;
  onSendWhatsApp: (lang: 'ita' | 'eng') => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onNavigateToMarchi: () => void;
}

export function FileGenerator({
  orderedMarchi,
  generatedFiles,
  generating,
  whatsappNumber,
  templates,
  selectedCount,
  onGenerate,
  onDownload,
  onSendWhatsApp,
  onReorder,
  onNavigateToMarchi,
}: FileGeneratorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorder(draggedIndex, index);
      setDraggedIndex(index);
    }
  };
  const handleDrop = () => setDraggedIndex(null);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Genera File</h1>
      <div className="flex items-center justify-between bg-blue-50 p-4 rounded mb-6">
        <div>
          <span className="font-medium">Marchi selezionati: </span>
          <span className="text-blue-600 font-bold">{selectedCount}</span>
        </div>
        <button onClick={onNavigateToMarchi} className="text-blue-600 hover:underline">Modifica selezione</button>
      </div>
      <button
        onClick={onGenerate}
        disabled={selectedCount === 0 || generating}
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50 text-lg"
      >
        {generating ? 'Generazione...' : '⚡ Genera File'}
      </button>

      {generatedFiles && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">Ordina marchi (drag & drop)</h3>
            <div className="flex gap-4">
              <button onClick={() => onDownload('pipe-ita.txt')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Scarica ITA ↓
              </button>
              <button onClick={() => onDownload('pipe-en.txt')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Scarica ENG ↓
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold mb-3">pipe-ita.txt</h3>
              <ul className="space-y-1">
                {orderedMarchi.map((m, idx) => (
                  <li
                    key={m.id + '-ita-' + idx}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={handleDrop}
                    className={`p-2 rounded cursor-move flex items-center gap-2 ${
                      draggedIndex === idx ? 'opacity-50 bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-gray-400">☰</span>
                    <span className="font-medium">{m.nome}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold mb-3">pipe-en.txt</h3>
              <ul className="space-y-1">
                {orderedMarchi.map((m, idx) => (
                  <li key={m.id + '-eng-' + idx} className="p-2 rounded bg-gray-50 flex items-center gap-2">
                    <span className="text-gray-400">☰</span>
                    <span className="font-medium">{m.nome}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">Anteprima ITA</h3>
                {whatsappNumber && (
                  <button onClick={() => onSendWhatsApp('ita')} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">
                    📱 Invia a WhatsApp
                  </button>
                )}
              </div>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded max-h-64 overflow-auto">
                {templates.header_ita}
                {orderedMarchi.map(m => `_${m.nome}_\n${m.link_ita || ''}`).join('\n\n')}
                {templates.footer_ita}
              </pre>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">Anteprima ENG</h3>
                {whatsappNumber && (
                  <button onClick={() => onSendWhatsApp('eng')} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">
                    📱 Invia a WhatsApp
                  </button>
                )}
              </div>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded max-h-64 overflow-auto">
                {templates.header_eng}
                {orderedMarchi.map(m => `_${m.nome}_\n${m.link_eng || ''}`).join('\n\n')}
                {templates.footer_eng}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}