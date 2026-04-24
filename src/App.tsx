import { useState, useCallback } from 'react';
import { Page } from './types';
import { MarchiProvider, useMarchi } from './contexts/MarchiContext';
import { TemplatesProvider, useTemplates } from './contexts/TemplatesContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { GeneratorProvider, useGenerator } from './contexts/GeneratorContext';
import { ToastProvider, ToastContainer } from './components/layout/Toast';
import { Sidebar } from './components/layout/Sidebar';
import { UpdateNotifier } from './components/layout/UpdateNotifier';
import { MarchiSection } from './components/marchi/MarchiSection';
import { TemplateEditor } from './components/templates/TemplateEditor';
import { FileGenerator } from './components/generator/FileGenerator';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { UpdatesPage } from './components/UpdatesPage';

function AppContent() {
  const [page, setPage] = useState<Page>('marchi');

  const { marchi, selectedIds, selectedCount } = useMarchi();
  const { templates, updateTemplate, save: saveTemplates } = useTemplates();
  const { settings, updateSetting, saveSetting } = useSettings();
  const {
    orderedMarchi,
    generatedFiles,
    generating,
    generate,
    sendWhatsApp,
    reorder,
    exportAll,
  } = useGenerator();

  const handleGenerate = useCallback(() => {
    const selected = marchi.filter(m => selectedIds.has(m.id));
    generate(selected, templates);
  }, [marchi, selectedIds, generate, templates]);

  const handleDownload = useCallback((filename: string) => {
    const isIta = filename.includes('ita');
    const header = isIta ? templates.header_ita : templates.header_eng;
    const footer = isIta ? templates.footer_ita : templates.footer_eng;
    const linkField = isIta ? 'link_ita' : 'link_eng';

    let body = '';
    orderedMarchi.forEach(m => {
      body += `_${m.nome}_\n${m[linkField] || ''}\n\n`;
    });

    const content = `${header}\n\n${body}${footer}`;
    window.electronAPI.saveFile({ filename, content });
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: `File ${filename} salvato!`, type: 'success' } }));
  }, [orderedMarchi, templates]);

  const handleSendWhatsApp = useCallback((lang: 'ita' | 'eng') => {
    sendWhatsApp(lang, templates, settings.whatsapp_number || '');
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Apertura WhatsApp per versione ${lang === 'ita' ? 'italiana' : 'inglese'}...`, type: 'info' } }));
  }, [sendWhatsApp, templates, settings.whatsapp_number]);

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    reorder(fromIndex, toIndex, templates);
  }, [reorder, templates]);

  const handleExportMarchi = useCallback(async () => {
    await exportAll();
  }, [exportAll]);

  return (
    <div className="flex h-screen">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <UpdateNotifier />
      <ToastContainer />

      <main className="flex-1 overflow-auto p-6">
        {page === 'marchi' && (
          <MarchiSection onExport={handleExportMarchi} />
        )}

        {page === 'templates' && (
          <TemplateEditor
            templates={templates}
            onUpdate={updateTemplate}
            onSave={saveTemplates}
          />
        )}

        {page === 'generate' && (
          <FileGenerator
            orderedMarchi={orderedMarchi}
            generatedFiles={generatedFiles}
            generating={generating}
            whatsappNumber={settings.whatsapp_number || ''}
            templates={templates}
            selectedCount={selectedCount}
            onGenerate={handleGenerate}
            onDownload={handleDownload}
            onSendWhatsApp={handleSendWhatsApp}
            onReorder={handleReorder}
            onNavigateToMarchi={() => setPage('marchi')}
          />
        )}

        {page === 'settings' && (
          <SettingsPanel
            settings={settings}
            onUpdate={updateSetting}
            onSave={saveSetting}
          />
        )}

        {page === 'updates' && <UpdatesPage />}
      </main>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <TemplatesProvider>
          <MarchiProvider>
            <GeneratorProvider>
              <AppContent />
            </GeneratorProvider>
          </MarchiProvider>
        </TemplatesProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}

export default App;