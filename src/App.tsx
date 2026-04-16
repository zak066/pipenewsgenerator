import { useState, useEffect } from 'react';

// Get version - this will be replaced during build
const APP_VERSION = '1.0.0';

interface Marchio {
  id: number;
  nome: string;
  link_ita: string;
  link_eng: string;
  created_at?: string;
}

interface ElectronAPI {
  getMarchi: () => Promise<Marchio[]>;
  addMarchio: (marchio: Omit<Marchio, 'id'>) => Promise<Marchio>;
  updateMarchio: (marchio: Marchio) => Promise<Marchio>;
  deleteMarchio: (id: number) => Promise<{ success: boolean }>;
  generateBitly: (url: string) => Promise<{ shortLink: string; error?: string }>;
  testLink: (url: string) => Promise<{ status: string; statusCode?: number; message: string }>;
  getSettings: () => Promise<Record<string, string>>;
  setSetting: (key: string, value: string) => Promise<{ success: boolean }>;
  getTemplates: () => Promise<{ header_ita: string; header_eng: string; footer_ita: string; footer_eng: string } | null>;
  saveTemplates: (templates: { header_ita: string; header_eng: string; footer_ita: string; footer_eng: string }) => Promise<{ success: boolean }>;
  generateFiles: (data: { marchi: Marchio[]; templates: { header_ita: string; header_eng: string; footer_ita: string; footer_eng: string } }) => Promise<{ ita: string; eng: string; filenameIta: string; filenameEng: string }>;
  saveFile: (data: { filename: string; content: string }) => Promise<{ success: boolean; path?: string }>;
  exportMarchi: () => Promise<{ ita: string; eng: string; filenameIta: string; filenameEng: string }>;
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
  checkForUpdates: () => Promise<{ success: boolean }>;
  downloadUpdate: () => Promise<{ success: boolean }>;
  installUpdate: () => Promise<{ success: boolean }>;
  onUpdateAvailable: (callback: (data: { version: string; releaseNotes?: string }) => void) => void;
  onUpdateProgress: (callback: (data: { percent: number }) => void) => void;
  onUpdateDownloaded: (callback: (data: { version: string }) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

type Page = 'marchi' | 'templates' | 'generate' | 'settings';

function App() {
  const [page, setPage] = useState<Page>('marchi');
  const [marchi, setMarchi] = useState<Marchio[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMarchio, setEditingMarchio] = useState<Marchio | null>(null);

  const [templates, setTemplates] = useState({
    header_ita: '',
    header_eng: '',
    footer_ita: '',
    footer_eng: '',
  });

  const [settings, setSettings] = useState<Record<string, string>>({ bitly_token: '', whatsapp_number: '' });
  const [generatedFiles, setGeneratedFiles] = useState<{ ita: string; eng: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [orderedMarchi, setOrderedMarchi] = useState<Marchio[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const [formData, setFormData] = useState({ nome: '', link_ita: '', link_eng: '' });
  const [generatingLink, setGeneratingLink] = useState<{ field: 'ita' | 'eng'; loading: boolean } | null>(null);
  const [testingLinks, setTestingLinks] = useState<Record<number, { ita?: { status: string; message: string }; eng?: { status: string; message: string } }>>({});
  
  const [updateAvailable, setUpdateAvailable] = useState<{ version: string; releaseNotes?: string } | null>(null);
  const [updateDownloading, setUpdateDownloading] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    loadData();
    
    if (window.electronAPI?.onUpdateAvailable) {
      window.electronAPI.onUpdateAvailable((data) => {
        setUpdateAvailable(data);
      });
      window.electronAPI.onUpdateProgress((data) => {
        setUpdateDownloading(true);
        setUpdateProgress(data.percent);
      });
      window.electronAPI.onUpdateDownloaded((data) => {
        setUpdateDownloading(false);
        setUpdateReady(true);
      });
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [marchiData, templatesData, settingsData] = await Promise.all([
        window.electronAPI.getMarchi(),
        (window as any).electronAPI?.getTemplates?.() || Promise.resolve(null),
        window.electronAPI.getSettings(),
      ]);
      setMarchi(marchiData);
      if (templatesData) {
        setTemplates({
          header_ita: templatesData.header_ita || '',
          header_eng: templatesData.header_eng || '',
          footer_ita: templatesData.footer_ita || '',
          footer_eng: templatesData.footer_eng || '',
        });
      }
      setSettings(settingsData as any);
    } catch (err) {
      console.error('Error loading data:', err);
    }
    setLoading(false);
  };

  const filteredMarchi = marchi.filter(m => m.nome.toLowerCase().includes(search.toLowerCase()));

  const handleSelectAll = () => {
    if (selectedIds.size === filteredMarchi.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMarchi.map(m => m.id)));
    }
  };

  const handleToggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSaveMarchio = async () => {
    if (!formData.nome.trim()) return;
    try {
      if (editingMarchio) {
        await window.electronAPI.updateMarchio({ ...editingMarchio, ...formData });
      } else {
        await window.electronAPI.addMarchio(formData);
      }
      await loadData();
      setShowForm(false);
      setEditingMarchio(null);
      setFormData({ nome: '', link_ita: '', link_eng: '' });
    } catch (err) {
      console.error('Error saving marchio:', err);
    }
  };

  const handleEditMarchio = (m: Marchio) => {
    setEditingMarchio(m);
    setFormData({ nome: m.nome, link_ita: m.link_ita || '', link_eng: m.link_eng || '' });
    setShowForm(true);
  };

  const handleDeleteMarchio = async (id: number) => {
    if (confirm('Eliminare questo marchio?')) {
      await window.electronAPI.deleteMarchio(id);
      setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      await loadData();
    }
  };

  const handleGenerateBitly = async (field: 'ita' | 'eng') => {
    const url = field === 'ita' ? formData.link_ita : formData.link_eng;
    if (!url) return;
    setGeneratingLink({ field, loading: true });
    const result = await window.electronAPI.generateBitly(url);
    if (result.shortLink) {
      setFormData(prev => ({ ...prev, [field === 'ita' ? 'link_ita' : 'link_eng']: result.shortLink }));
    } else {
      alert(result.error || 'Errore generazione link');
    }
    setGeneratingLink(null);
  };

  const handleTestLink = async (id: number, type: 'ita' | 'eng') => {
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
    
    const result = await window.electronAPI.testLink(url);
    setTestingLinks(prev => ({
      ...prev,
      [id]: { ...prev[id], [type]: result }
    }));
  };

  const handleSaveTemplates = async () => {
    try {
      await (window as any).electronAPI?.saveTemplates?.(templates);
      alert('Template salvato!');
    } catch (err) {
      console.error('Error saving templates:', err);
    }
  };

  const handleSaveSetting = async (key: string, value: string) => {
    await window.electronAPI.setSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (selectedIds.size === 0) {
      alert('Seleziona almeno un marchio');
      return;
    }
    setGenerating(true);
    try {
      const selectedMarchi = marchi.filter(m => selectedIds.has(m.id));
      setOrderedMarchi(selectedMarchi);
      const result = await (window as any).electronAPI?.generateFiles?.({ marchi: selectedMarchi, templates });
      setGeneratedFiles(result);
    } catch (err) {
      console.error('Error generating files:', err);
    }
    setGenerating(false);
  };

  const handleDownload = async (content: string, filename: string) => {
    let finalContent = content;
    if (orderedMarchi.length > 0) {
      const isIta = filename.includes('ita');
      let body = '';
      orderedMarchi.forEach(m => {
        body += '_' + m.nome + '_\n' + (isIta ? (m.link_ita || '') : (m.link_eng || '')) + '\n\n';
      });
      finalContent = templates.header_ita + '\n\n' + body + templates.footer_ita;
      if (!isIta) {
        finalContent = templates.header_eng + '\n\n' + body + templates.footer_eng;
      }
    }
    await (window as any).electronAPI?.saveFile?.({ filename, content: finalContent });
  };

  const handleExportMarchi = async () => {
    try {
      const result = await window.electronAPI.exportMarchi();
      await (window as any).electronAPI?.saveFile?.({ filename: result.filenameIta, content: result.ita });
      await (window as any).electronAPI?.saveFile?.({ filename: result.filenameEng, content: result.eng });
      alert('File esportati con successo!');
    } catch (err) {
      console.error('Error exporting marchi:', err);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedItem === null) return;
    const newOrder = [...orderedMarchi];
    const [removed] = newOrder.splice(draggedItem, 1);
    newOrder.splice(index, 0, removed);
    setOrderedMarchi(newOrder);
    setDraggedItem(null);
    
    let itaContent = templates.header_ita + '\n\n';
    let engContent = templates.header_eng + '\n\n';
    newOrder.forEach(m => {
      itaContent += '_' + m.nome + '_\n' + (m.link_ita || '') + '\n\n';
      engContent += '_' + m.nome + '_\n' + (m.link_eng || '') + '\n\n';
    });
    itaContent += templates.footer_ita;
    engContent += templates.footer_eng;
    setGeneratedFiles({ ita: itaContent, eng: engContent });
  };

  const sendToWhatsApp = async (lang: 'ita' | 'eng') => {
    if (!settings.whatsapp_number) {
      alert('Configura il numero WhatsApp nelle impostazioni');
      return;
    }
    
    let message = '';
    if (lang === 'ita') {
      message = templates.header_ita + '\n\n';
      orderedMarchi.forEach(m => {
        message += '_' + m.nome + '_\n' + (m.link_ita || '') + '\n\n';
      });
      message += templates.footer_ita;
    } else {
      message = templates.header_eng + '\n\n';
      orderedMarchi.forEach(m => {
        message += '_' + m.nome + '_\n' + (m.link_eng || '') + '\n\n';
      });
      message += templates.footer_eng;
    }
    
    const encodedMessage = encodeURIComponent(message);
    
    // Prova prima con l'app desktop WhatsApp usando il deep link
    const whatsappDesktopUrl = `whatsapp://send?phone=${settings.whatsapp_number}&text=${encodedMessage}`;
    
    // Prova ad aprire l'app desktop
    const result = await window.electronAPI.openExternal(whatsappDesktopUrl);
    
    // Se non funziona, usa WhatsApp Web
    if (!result.success) {
      const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${settings.whatsapp_number}&text=${encodedMessage}`;
      await window.electronAPI.openExternal(whatsappWebUrl);
    }
  };

  const selectedCount = selectedIds.size;

  if (loading) return <div className="flex items-center justify-center h-screen">Caricamento...</div>;

  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-gray-800 text-white flex flex-col">
        <div className="p-4 font-bold text-lg border-b border-gray-700">Pipe Link Generator</div>
        <nav className="flex-1 py-2">
          {[
            { id: 'marchi', label: 'Marchi', icon: '📋' },
            { id: 'templates', label: 'Template', icon: '📝' },
            { id: 'generate', label: 'Genera File', icon: '⚡' },
            { id: 'settings', label: 'Impostazioni', icon: '⚙️' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id as Page)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-700 ${page === item.id ? 'bg-gray-700 border-l-4 border-blue-400' : ''}`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 text-xs text-gray-400 border-t border-gray-700">
          v{APP_VERSION}
        </div>
      </aside>

      {updateAvailable && !updateReady && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold">Nuova versione disponibile!</span>
            <button onClick={() => setUpdateAvailable(null)} className="text-white hover:text-gray-200">✕</button>
          </div>
          <p className="text-sm mb-3">Versione {updateAvailable.version} disponibile</p>
          {updateDownloading && (
            <div className="mb-3">
              <div className="w-full bg-blue-800 rounded-full h-2">
                <div className="bg-white h-2 rounded-full" style={{ width: `${updateProgress}%` }}></div>
              </div>
              <p className="text-xs mt-1">Download: {Math.round(updateProgress)}%</p>
            </div>
          )}
          <div className="flex gap-2">
            {!updateDownloading && (
              <button 
                onClick={() => window.electronAPI.downloadUpdate()} 
                className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50"
              >
                Scarica
              </button>
            )}
            {updateReady && (
              <button 
                onClick={() => window.electronAPI.installUpdate()} 
                className="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-600"
              >
                Installa e Riavvia
              </button>
            )}
            <button 
              onClick={() => setUpdateAvailable(null)} 
              className="text-white text-sm hover:underline"
            >
              Più tardi
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto p-6">
        {page === 'marchi' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Gestione Marchi</h1>
              <div className="flex gap-2">
                <button onClick={handleExportMarchi} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Esporta Lista
                </button>
                <button onClick={() => { setShowForm(true); setEditingMarchio(null); setFormData({ nome: '', link_ita: '', link_eng: '' }); }} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  + Aggiungi Marchio
                </button>
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Cerca marchio..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              {selectedCount > 0 && (
                <div className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded">
                  <span>{selectedCount} selezionati</span>
                  <button onClick={() => setSelectedIds(new Set())} className="text-blue-600 hover:underline">Deseleziona</button>
                </div>
              )}
            </div>

            {showForm && (
              <div className="bg-white p-4 rounded shadow mb-4 border">
                <h3 className="font-bold mb-3">{editingMarchio ? 'Modifica' : 'Nuovo'} Marchio</h3>
                <div className="grid gap-3">
                  <input
                    type="text"
                    placeholder="Nome marchio"
                    value={formData.nome}
                    onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="p-2 border rounded"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Link ITA"
                      value={formData.link_ita}
                      onChange={e => setFormData(prev => ({ ...prev, link_ita: e.target.value }))}
                      className="flex-1 p-2 border rounded"
                    />
                    <button
                      onClick={() => handleGenerateBitly('ita')}
                      disabled={!formData.link_ita || generatingLink?.field === 'ita'}
                      className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {generatingLink?.field === 'ita' ? '...' : '🔗 bit.ly'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Link ENG"
                      value={formData.link_eng}
                      onChange={e => setFormData(prev => ({ ...prev, link_eng: e.target.value }))}
                      className="flex-1 p-2 border rounded"
                    />
                    <button
                      onClick={() => handleGenerateBitly('eng')}
                      disabled={!formData.link_eng || generatingLink?.field === 'eng'}
                      className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {generatingLink?.field === 'eng' ? '...' : '🔗 bit.ly'}
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleSaveMarchio} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Salva</button>
                    <button onClick={() => { setShowForm(false); setEditingMarchio(null); }} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Annulla</button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">
                      <input type="checkbox" checked={selectedCount === filteredMarchi.length && filteredMarchi.length > 0} onChange={handleSelectAll} />
                    </th>
                    <th className="p-3 text-left">Nome</th>
                    <th className="p-3 text-left">Link ITA</th>
                    <th className="p-3 text-left">Link ENG</th>
                    <th className="p-3 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarchi.map(m => {
                    const testResults = testingLinks[m.id] || {};
                    return (
                    <tr key={m.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => handleToggleSelect(m.id)} />
                      </td>
                      <td className="p-3 font-medium">{m.nome}</td>
                      <td className="p-3">
                        <div className="text-sm text-gray-600 truncate max-w-xs" title={m.link_ita}>{m.link_ita || '-'}</div>
                        {testResults.ita && (
                          <div className={`text-xs mt-1 ${testResults.ita.status === 'ok' ? 'text-green-600' : testResults.ita.status === 'loading' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {testResults.ita.status === 'loading' ? '⏳' : testResults.ita.status === 'ok' ? '✓' : '✗'} {testResults.ita.message}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-600 truncate max-w-xs" title={m.link_eng}>{m.link_eng || '-'}</div>
                        {testResults.eng && (
                          <div className={`text-xs mt-1 ${testResults.eng.status === 'ok' ? 'text-green-600' : testResults.eng.status === 'loading' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {testResults.eng.status === 'loading' ? '⏳' : testResults.eng.status === 'ok' ? '✓' : '✗'} {testResults.eng.message}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex flex-col gap-1 items-end">
                          <div>
                            <button onClick={() => handleTestLink(m.id, 'ita')} className="text-xs text-purple-600 hover:underline mr-2" title="Test link ITA">Test ITA</button>
                            <button onClick={() => handleTestLink(m.id, 'eng')} className="text-xs text-purple-600 hover:underline mr-2" title="Test link ENG">Test ENG</button>
                            <button onClick={() => handleEditMarchio(m)} className="text-blue-600 hover:underline mr-2">Modifica</button>
                            <button onClick={() => handleDeleteMarchio(m.id)} className="text-red-600 hover:underline">Elimina</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
              {filteredMarchi.length === 0 && <div className="p-4 text-center text-gray-500">Nessun marchio trovato</div>}
            </div>
          </div>
        )}

        {page === 'templates' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Editor Template</h1>
              <button onClick={handleSaveTemplates} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Salva Template</button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-bold mb-3">Header Italiano</h3>
                <textarea
                  value={templates.header_ita}
                  onChange={e => setTemplates(prev => ({ ...prev, header_ita: e.target.value }))}
                  className="w-full h-32 p-2 border rounded"
                  placeholder="Messaggio promozionale ITA..."
                />
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-bold mb-3">Header English</h3>
                <textarea
                  value={templates.header_eng}
                  onChange={e => setTemplates(prev => ({ ...prev, header_eng: e.target.value }))}
                  className="w-full h-32 p-2 border rounded"
                  placeholder="Promotional message ENG..."
                />
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-bold mb-3">Footer Italiano</h3>
                <textarea
                  value={templates.footer_ita}
                  onChange={e => setTemplates(prev => ({ ...prev, footer_ita: e.target.value }))}
                  className="w-full h-48 p-2 border rounded"
                  placeholder="Footer ITA..."
                />
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-bold mb-3">Footer English</h3>
                <textarea
                  value={templates.footer_eng}
                  onChange={e => setTemplates(prev => ({ ...prev, footer_eng: e.target.value }))}
                  className="w-full h-48 p-2 border rounded"
                  placeholder="Footer ENG..."
                />
              </div>
            </div>
            <div className="mt-6 bg-gray-100 p-4 rounded">
              <h3 className="font-bold mb-2">Anteprima</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                  <pre className="whitespace-pre-wrap">{templates.header_ita}</pre>
                  <hr className="my-2" />
                  <pre className="whitespace-pre-wrap">{templates.footer_ita}</pre>
                </div>
                <div className="bg-white p-3 rounded border">
                  <pre className="whitespace-pre-wrap">{templates.header_eng}</pre>
                  <hr className="my-2" />
                  <pre className="whitespace-pre-wrap">{templates.footer_eng}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {page === 'generate' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Genera File</h1>
            <div className="flex items-center justify-between bg-blue-50 p-4 rounded mb-6">
              <div>
                <span className="font-medium">Marchi selezionati: </span>
                <span className="text-blue-600 font-bold">{selectedCount}</span>
              </div>
              <button onClick={() => setPage('marchi')} className="text-blue-600 hover:underline">Modifica selezione</button>
            </div>
            <button
              onClick={handleGenerate}
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
                    <button onClick={() => handleDownload(generatedFiles.ita, 'pipe-ita.txt')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                      Scarica ITA ↓
                    </button>
                    <button onClick={() => handleDownload(generatedFiles.eng, 'pipe-en.txt')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
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
                          onDrop={() => handleDrop(idx)}
                          className={`p-2 rounded cursor-move flex items-center gap-2 ${draggedItem === idx ? 'opacity-50 bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'}`}
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
                        <li
                          key={m.id + '-eng-' + idx}
                          className="p-2 rounded bg-gray-50 flex items-center gap-2"
                        >
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
                      {settings.whatsapp_number && (
                        <button 
                          onClick={() => sendToWhatsApp('ita')}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                        >
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
                      {settings.whatsapp_number && (
                        <button 
                          onClick={() => sendToWhatsApp('eng')}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                        >
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
        )}

        {page === 'settings' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Impostazioni</h1>
            <div className="bg-white p-6 rounded shadow max-w-xl mb-4">
              <h3 className="font-bold mb-3">API Bit.ly</h3>
              <p className="text-sm text-gray-600 mb-3">Inserisci il tuo API token bit.ly per generare link corti automaticamente.</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Token API bit.ly"
                  value={settings.bitly_token || ''}
                  onChange={e => setSettings(prev => ({ ...prev, bitly_token: e.target.value }))}
                  className="flex-1 p-2 border rounded"
                />
                <button onClick={() => handleSaveSetting('bitly_token', settings.bitly_token)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salva</button>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <a href="https://bitly.com/a/oauth_apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ottieni il token da bit.ly →</a>
              </div>
            </div>
            <div className="bg-white p-6 rounded shadow max-w-xl">
              <h3 className="font-bold mb-3">WhatsApp</h3>
              <p className="text-sm text-gray-600 mb-3">Numero WhatsApp per inviare i messaggi (con prefisso internazionale, es. 393401234567)</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Numero WhatsApp (es. 393401234567)"
                  value={settings.whatsapp_number || ''}
                  onChange={e => setSettings(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  className="flex-1 p-2 border rounded"
                />
                <button onClick={() => handleSaveSetting('whatsapp_number', settings.whatsapp_number || '')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Salva</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;