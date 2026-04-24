import React, { createContext, useContext, useState, useCallback } from 'react';
import { Marchio, Templates, GeneratedFiles } from '../types';
import { electronApi } from '../api/electron';

interface GeneratorContextType {
  orderedMarchi: Marchio[];
  generatedFiles: GeneratedFiles | null;
  generating: boolean;
  setOrderedMarchi: (marchi: Marchio[]) => void;
  generate: (marchi: Marchio[], templates: Templates) => Promise<void>;
  download: (content: string, filename: string, templates: Templates, marchi: Marchio[]) => Promise<void>;
  sendWhatsApp: (lang: 'ita' | 'eng', templates: Templates, whatsappNumber: string) => Promise<void>;
  reorder: (fromIndex: number, toIndex: number, templates: Templates) => void;
  exportAll: () => Promise<void>;
}

const GeneratorContext = createContext<GeneratorContextType | null>(null);

export function GeneratorProvider({ children }: { children: React.ReactNode }) {
  const [orderedMarchi, setOrderedMarchi] = useState<Marchio[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFiles | null>(null);
  const [generating, setGenerating] = useState(false);

  const generate = useCallback(async (marchi: Marchio[], templates: Templates) => {
    setGenerating(true);
    try {
      setOrderedMarchi(marchi);
      const result = await electronApi.generateFiles({ marchi, templates });
      setGeneratedFiles(result);
    } catch (err) {
      console.error('Error generating files:', err);
    }
    setGenerating(false);
  }, []);

  const buildContent = useCallback((lang: 'ita' | 'eng', templates: Templates, marchi: Marchio[]): string => {
    const header = lang === 'ita' ? templates.header_ita : templates.header_eng;
    const footer = lang === 'ita' ? templates.footer_ita : templates.footer_eng;
    const linkField = lang === 'ita' ? 'link_ita' : 'link_eng';
    
    let body = '';
    marchi.forEach(m => {
      body += `_${m.nome}_\n${m[linkField] || ''}\n\n`;
    });
    
    return `${header}\n\n${body}${footer}`;
  }, []);

  const download = useCallback(async (content: string, filename: string, templates: Templates, marchi: Marchio[]) => {
    const isIta = filename.includes('ita');
    const finalContent = buildContent(isIta ? 'ita' : 'eng', templates, marchi);
    await electronApi.saveFile({ filename, content: finalContent });
  }, [buildContent]);

  const sendWhatsApp = useCallback(async (lang: 'ita' | 'eng', templates: Templates, whatsappNumber: string) => {
    if (!whatsappNumber) {
      alert('Configura il numero WhatsApp nelle impostazioni');
      return;
    }
    const message = buildContent(lang, templates, orderedMarchi);
    const encodedMessage = encodeURIComponent(message);
    const whatsappDesktopUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodedMessage}`;
    const result = await electronApi.openExternal(whatsappDesktopUrl);
    if (!result.success) {
      const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
      await electronApi.openExternal(whatsappWebUrl);
    }
  }, [orderedMarchi, buildContent]);

  const reorder = useCallback((fromIndex: number, toIndex: number, templates: Templates) => {
    const newOrder = [...orderedMarchi];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setOrderedMarchi(newOrder);
    const itaContent = buildContent('ita', templates, newOrder);
    const engContent = buildContent('eng', templates, newOrder);
    setGeneratedFiles(prev => prev ? { ...prev, ita: itaContent, eng: engContent } : null);
  }, [orderedMarchi, buildContent]);

  const exportAll = useCallback(async () => {
    try {
      const result = await electronApi.exportMarchi();
      await electronApi.saveFile({ filename: result.filenameIta, content: result.ita });
      await electronApi.saveFile({ filename: result.filenameEng, content: result.eng });
      alert('File esportati con successo!');
    } catch (err) {
      console.error('Error exporting marchi:', err);
    }
  }, []);

  return (
    <GeneratorContext.Provider value={{
      orderedMarchi, generatedFiles, generating,
      setOrderedMarchi, generate, download, sendWhatsApp, reorder, exportAll
    }}>
      {children}
    </GeneratorContext.Provider>
  );
}

export function useGenerator() {
  const context = useContext(GeneratorContext);
  if (!context) throw new Error('useGenerator must be used within GeneratorProvider');
  return context;
}