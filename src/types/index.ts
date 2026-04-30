export interface Marchio {
  id: number;
  nome: string;
  link_ita: string | null;
  link_eng: string | null;
  created_at?: string;
}

export type MarchioInput = Omit<Marchio, 'id' | 'created_at'>;

export interface Templates {
  header_ita: string;
  header_eng: string;
  footer_ita: string;
  footer_eng: string;
}

export interface Settings {
  bitly_token?: string;
  whatsapp_number?: string;
  tinyurl_token?: string;
}

export type Page = 'marchi' | 'templates' | 'generate' | 'settings' | 'updates';

export interface LinkTestResult {
  status: 'ok' | 'invalid' | 'error' | 'loading';
  message: string;
  statusCode?: number;
}

export interface LinkTestResults {
  ita?: LinkTestResult;
  eng?: LinkTestResult;
}

export interface GeneratedFiles {
  ita: string;
  eng: string;
  filenameIta: string;
  filenameEng: string;
}

export interface ElectronAPI {
  getMarchi: () => Promise<Marchio[]>;
  addMarchio: (marchio: MarchioInput) => Promise<Marchio>;
  updateMarchio: (marchio: Marchio) => Promise<Marchio>;
  deleteMarchio: (id: number) => Promise<{ success: boolean }>;
  generateBitly: (url: string) => Promise<{ shortLink: string; error?: string }>;
  convertTinyUrl: (url: string) => Promise<{ shortLink: string; error?: string }>;
  testLink: (url: string) => Promise<LinkTestResult>;
  getSettings: () => Promise<Record<string, string>>;
  setSetting: (key: string, value: string) => Promise<{ success: boolean }>;
  getTemplates: () => Promise<Templates | null>;
  saveTemplates: (templates: Templates) => Promise<{ success: boolean }>;
  generateFiles: (data: { marchi: Marchio[]; templates: Templates }) => Promise<GeneratedFiles>;
  saveFile: (data: { filename: string; content: string }) => Promise<{ success: boolean; path?: string }>;
  exportMarchi: () => Promise<GeneratedFiles>;
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
  checkForUpdates: () => Promise<{ success: boolean }>;
  downloadUpdate: () => Promise<{ success: boolean }>;
  installUpdate: () => Promise<{ success: boolean }>;
  onUpdateAvailable: (callback: (data: { version: string; releaseNotes?: string }) => void) => void;
  onUpdateProgress: (callback: (data: { percent: number }) => void) => void;
  onUpdateDownloaded: (callback: (data: { version: string }) => void) => void;
  onUpdateNotAvailable: (callback: () => void) => void;
  onUpdateError: (callback: (data: { message: string }) => void) => void;
  backupDatabase: () => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
  restoreDatabase: () => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};