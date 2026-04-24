import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Templates } from '../types';
import { electronApi } from '../api/electron';

interface TemplatesContextType {
  templates: Templates;
  loading: boolean;
  updateTemplate: (field: keyof Templates, value: string) => void;
  save: () => Promise<boolean>;
}

const defaultTemplates: Templates = {
  header_ita: '',
  header_eng: '',
  footer_ita: '',
  footer_eng: '',
};

const TemplatesContext = createContext<TemplatesContextType | null>(null);

export function TemplatesProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = useState<Templates>(defaultTemplates);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await electronApi.getTemplates();
        if (data) {
          setTemplates(data);
        }
      } catch (err) {
        console.error('Error loading templates:', err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const updateTemplate = useCallback((field: keyof Templates, value: string) => {
    setTemplates(prev => ({ ...prev, [field]: value }));
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    try {
      await electronApi.saveTemplates(templates);
      return true;
    } catch (err) {
      console.error('Error saving templates:', err);
      return false;
    }
  }, [templates]);

  return (
    <TemplatesContext.Provider value={{ templates, loading, updateTemplate, save }}>
      {children}
    </TemplatesContext.Provider>
  );
}

export function useTemplates() {
  const context = useContext(TemplatesContext);
  if (!context) throw new Error('useTemplates must be used within TemplatesProvider');
  return context;
}