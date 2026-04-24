import React, { useEffect, useState } from 'react';
import { electronApi } from '../../api/electron';

const APP_VERSION = '1.0.47';

export function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState<{ version: string; releaseNotes?: string } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    electronApi.onUpdateAvailable((data) => {
      setMessage(null);
      setUpdateAvailable(data);
    });
    electronApi.onUpdateProgress((data) => {
      setDownloading(true);
      setProgress(data.percent);
    });
    electronApi.onUpdateDownloaded(() => {
      setDownloading(false);
      setReady(true);
    });
    electronApi.onUpdateNotAvailable(() => {
      setMessage('Applicazione aggiornata - sei già alla versione più recente');
      setTimeout(() => setMessage(null), 5000);
    });
    electronApi.onUpdateError((data) => {
      setMessage(data.message);
      setTimeout(() => setMessage(null), 5000);
    });
  }, []);

  if (updateAvailable && !ready) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
        <div className="flex justify-between items-start mb-2">
          <span className="font-bold">Nuovo aggiornamento disponibile!</span>
          <button onClick={() => setUpdateAvailable(null)} className="text-white hover:text-gray-200">✕</button>
        </div>
        <p className="text-sm mb-3">Versione {updateAvailable.version} è disponibile (attuale: {APP_VERSION})</p>
        {downloading && (
          <div className="mb-3">
            <div className="w-full bg-green-800 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-xs mt-1">Download: {Math.round(progress)}%</p>
          </div>
        )}
        <div className="flex gap-2">
          {!downloading && (
            <button
              onClick={() => electronApi.downloadUpdate()}
              className="bg-white text-green-600 px-3 py-1 rounded text-sm font-medium hover:bg-green-50"
            >
              Scarica
            </button>
          )}
          {ready && (
            <button
              onClick={() => electronApi.installUpdate()}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-600"
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
    );
  }

  if (message) {
    return (
      <div className="fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
        {message}
      </div>
    );
  }

  return null;
}