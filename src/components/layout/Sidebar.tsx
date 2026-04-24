import React from 'react';
import { Page } from '../../types';

const APP_VERSION = '1.0.47';

const navItems = [
  { id: 'marchi' as Page, label: 'Marchi', icon: '📋' },
  { id: 'templates' as Page, label: 'Template', icon: '📝' },
  { id: 'generate' as Page, label: 'Genera File', icon: '⚡' },
  { id: 'settings' as Page, label: 'Impostazioni', icon: '⚙️' },
  { id: 'updates' as Page, label: 'Aggiornamenti', icon: '🔄' },
];

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-56 bg-gray-800 text-white flex flex-col">
      <div className="p-4 font-bold text-lg border-b border-gray-700">Pipe Link Generator</div>
      <nav className="flex-1 py-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full text-left px-4 py-3 hover:bg-gray-700 ${
              currentPage === item.id ? 'bg-gray-700 border-l-4 border-blue-400' : ''
            }`}
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
  );
}