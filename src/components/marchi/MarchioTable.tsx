import React from 'react';
import { Marchio, LinkTestResults } from '../../types';

interface MarchioTableProps {
  marchi: Marchio[];
  selectedIds: Set<number>;
  testingLinks: Record<number, LinkTestResults>;
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
  onEdit: (marchio: Marchio) => void;
  onDelete: (id: number) => void;
  onTestLink: (id: number, type: 'ita' | 'eng') => void;
  onConvertTinyUrl: (id: number, type: 'ita' | 'eng') => void;
}

export function MarchioTable({
  marchi,
  selectedIds,
  testingLinks,
  onToggleSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onTestLink,
  onConvertTinyUrl,
}: MarchioTableProps) {
  const allSelected = marchi.length > 0 && selectedIds.size === marchi.length;

  return (
    <div className="bg-white rounded shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">
              <input type="checkbox" checked={allSelected} onChange={onSelectAll} />
            </th>
            <th className="p-3 text-left">Nome</th>
            <th className="p-3 text-left">Link ITA</th>
            <th className="p-3 text-left">Link ENG</th>
            <th className="p-3 text-right">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {marchi.map(m => {
            const testResults = testingLinks[m.id] || {};
            return (
              <tr key={m.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => onToggleSelect(m.id)} />
                </td>
                <td className="p-3 font-medium">{m.nome}</td>
                <td className="p-3">
                  <div className="text-sm text-gray-600 truncate max-w-xs" title={m.link_ita || undefined}>
                    {m.link_ita || '-'}
                  </div>
                  {testResults.ita && (
                    <div className={`text-xs mt-1 ${
                      testResults.ita.status === 'ok' ? 'text-green-600' : 
                      testResults.ita.status === 'loading' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {testResults.ita.status === 'loading' ? '⏳' : 
                       testResults.ita.status === 'ok' ? '✓' : '✗'} {testResults.ita.message}
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <div className="text-sm text-gray-600 truncate max-w-xs" title={m.link_eng || undefined}>
                    {m.link_eng || '-'}
                  </div>
                  {testResults.eng && (
                    <div className={`text-xs mt-1 ${
                      testResults.eng.status === 'ok' ? 'text-green-600' : 
                      testResults.eng.status === 'loading' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {testResults.eng.status === 'loading' ? '⏳' : 
                       testResults.eng.status === 'ok' ? '✓' : '✗'} {testResults.eng.message}
                    </div>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => onTestLink(m.id, 'ita')} className="p-1.5 text-purple-600 hover:bg-purple-100 rounded" title="Test link ITA">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </button>
                    {m.link_ita && !m.link_ita.includes('tinyurl.com') && (
                      <button onClick={() => onConvertTinyUrl(m.id, 'ita')} className="p-1.5 text-orange-600 hover:bg-orange-100 rounded" title="Converti a TinyURL ITA">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                        </svg>
                      </button>
                    )}
                    <button onClick={() => onTestLink(m.id, 'eng')} className="p-1.5 text-purple-600 hover:bg-purple-100 rounded" title="Test link ENG">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                      </svg>
                    </button>
                    {m.link_eng && !m.link_eng.includes('tinyurl.com') && (
                      <button onClick={() => onConvertTinyUrl(m.id, 'eng')} className="p-1.5 text-orange-600 hover:bg-orange-100 rounded" title="Converti a TinyURL ENG">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                        </svg>
                      </button>
                    )}
                    <button onClick={() => onEdit(m)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" title="Modifica">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button onClick={() => { if (confirm('Eliminare questo marchio?')) onDelete(m.id); }} className="p-1.5 text-red-600 hover:bg-red-100 rounded" title="Elimina">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {marchi.length === 0 && <div className="p-4 text-center text-gray-500">Nessun marchio trovato</div>}
    </div>
  );
}