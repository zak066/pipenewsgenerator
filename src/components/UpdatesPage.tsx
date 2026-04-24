import React, { useState } from 'react';
import { Button } from './common/Button';

const APP_VERSION = '1.0.47';

export function UpdatesPage() {
  const [checking, setChecking] = useState(false);

  const handleCheck = () => {
    setChecking(true);
    window.electronAPI.checkForUpdates().finally(() => setTimeout(() => setChecking(false), 3000));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Aggiornamenti</h1>
      <div className="bg-white p-6 rounded shadow max-w-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            v{APP_VERSION}
          </div>
          <p className="text-sm text-gray-600">Versione attuale installata</p>
        </div>
        <Button
          variant="primary"
          onClick={handleCheck}
          loading={checking}
        >
          {checking ? 'Verifica in corso...' : 'Verifica aggiornamenti'}
        </Button>
      </div>
    </div>
  );
}