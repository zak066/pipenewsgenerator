import React, { useState } from 'react';
import { Templates } from '../../types';
import { Button } from '../common/Button';

interface TemplateEditorProps {
  templates: Templates;
  onUpdate: (field: keyof Templates, value: string) => void;
  onSave: () => Promise<boolean>;
}

export function TemplateEditor({ templates, onUpdate, onSave }: TemplateEditorProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const success = await onSave();
    setSaving(false);
    if (success) {
      const event = new CustomEvent('toast', { detail: { message: 'Template salvato!', type: 'success' } });
      window.dispatchEvent(event);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Editor Template</h1>
        <Button variant="success" onClick={handleSave} loading={saving}>
          Salva Template
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-3">Header Italiano</h3>
          <textarea
            value={templates.header_ita}
            onChange={e => onUpdate('header_ita', e.target.value)}
            className="w-full h-32 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Messaggio promozionale ITA..."
          />
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-3">Header English</h3>
          <textarea
            value={templates.header_eng}
            onChange={e => onUpdate('header_eng', e.target.value)}
            className="w-full h-32 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Promotional message ENG..."
          />
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-3">Footer Italiano</h3>
          <textarea
            value={templates.footer_ita}
            onChange={e => onUpdate('footer_ita', e.target.value)}
            className="w-full h-48 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Footer ITA..."
          />
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-3">Footer English</h3>
          <textarea
            value={templates.footer_eng}
            onChange={e => onUpdate('footer_eng', e.target.value)}
            className="w-full h-48 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
  );
}