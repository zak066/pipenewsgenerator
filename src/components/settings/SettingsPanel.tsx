import React, { useState } from 'react';
import { Settings as SettingsType } from '../../types';
import { Button } from '../common/Button';
import { electronApi } from '../../api/electron';

interface SettingsPanelProps {
  settings: SettingsType;
  onUpdate: (key: keyof SettingsType, value: string) => void;
  onSave: (key: keyof SettingsType) => Promise<boolean>;
}

export function SettingsPanel({ settings, onUpdate, onSave }: SettingsPanelProps) {
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleBackup = async () => {
    setBacking(true);
    try {
      const result = await electronApi.backupDatabase();
      if (result.success) {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Backup salvato in: ${result.path}`, type: 'success' } }));
      } else if (!result.canceled) {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: result.error || 'Errore durante il backup', type: 'error' } }));
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Errore durante il backup', type: 'error' } }));
    }
    setBacking(false);
  };

  const handleRestore = async () => {
    const confirmed = confirm(
      'ATTENZIONE: Il ripristino sostituirà il database corrente con il backup selezionato.\n\n' +
      'Assicurati di aver fatto un backup dei dati attuali prima di procedere.\n\n' +
      'Continuare?'
    );
    if (!confirmed) return;

    setRestoring(true);
    try {
      const result = await electronApi.restoreDatabase();
      if (result.success) {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Database ripristinato! Riavvia l\'app per applicare le modifiche.', type: 'success' } }));
      } else if (!result.canceled) {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: result.error || 'Errore durante il ripristino', type: 'error' } }));
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Errore durante il ripristino', type: 'error' } }));
    }
    setRestoring(false);
  };

  return (
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
            onChange={e => onUpdate('bitly_token', e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button variant="primary" onClick={() => onSave('bitly_token')}>Salva</Button>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <a href="https://bitly.com/a/oauth_apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Ottieni il token da bit.ly →
          </a>
        </div>
      </div>
      <div className="bg-white p-6 rounded shadow max-w-xl mb-4">
        <h3 className="font-bold mb-3">API TinyURL</h3>
        <p className="text-sm text-gray-600 mb-3">Inserisci il tuo API token TinyURL (opzionale, necessario per alcune funzionalità).</p>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="Token API TinyURL"
            value={settings.tinyurl_token || ''}
            onChange={e => onUpdate('tinyurl_token', e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button variant="warning" onClick={() => onSave('tinyurl_token')}>Salva</Button>
        </div>
      </div>
      <div className="bg-white p-6 rounded shadow max-w-xl mb-4">
        <h3 className="font-bold mb-3">WhatsApp</h3>
        <p className="text-sm text-gray-600 mb-3">Numero WhatsApp per inviare i messaggi (con prefisso internazionale, es. 393401234567)</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Numero WhatsApp (es. 393401234567)"
            value={settings.whatsapp_number || ''}
            onChange={e => onUpdate('whatsapp_number', e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button variant="success" onClick={() => onSave('whatsapp_number')}>Salva</Button>
        </div>
      </div>
      <div className="bg-white p-6 rounded shadow max-w-xl">
        <h3 className="font-bold mb-3">Backup Database</h3>
        <p className="text-sm text-gray-600 mb-3">Crea una copia di backup del database o ripristina da un backup esistente.</p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleBackup}
            loading={backing}
          >
            💾 Crea Backup
          </Button>
          <Button
            variant="danger"
            onClick={handleRestore}
            loading={restoring}
          >
            🔄 Ripristina Backup
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Il backup crea una copia del database SQLite che può essere ripristinata in qualsiasi momento.
        </p>
      </div>
    </div>
  );
}