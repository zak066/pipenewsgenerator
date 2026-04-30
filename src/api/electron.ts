import { ElectronAPI, Marchio, MarchioInput, Templates, GeneratedFiles } from '../types';

export const electronApi: ElectronAPI = {
  async getMarchi(): Promise<Marchio[]> {
    return window.electronAPI.getMarchi();
  },

  async addMarchio(marchio: MarchioInput): Promise<Marchio> {
    return window.electronAPI.addMarchio(marchio);
  },

  async updateMarchio(marchio: Marchio): Promise<Marchio> {
    return window.electronAPI.updateMarchio(marchio);
  },

  async deleteMarchio(id: number): Promise<{ success: boolean }> {
    return window.electronAPI.deleteMarchio(id);
  },

  async generateBitly(url: string): Promise<{ shortLink: string; error?: string }> {
    return window.electronAPI.generateBitly(url);
  },

  async convertTinyUrl(url: string): Promise<{ shortLink: string; error?: string }> {
    return window.electronAPI.convertTinyUrl(url);
  },

  async testLink(url: string) {
    return window.electronAPI.testLink(url);
  },

  async getSettings(): Promise<Record<string, string>> {
    return window.electronAPI.getSettings();
  },

  async setSetting(key: string, value: string): Promise<{ success: boolean }> {
    return window.electronAPI.setSetting(key, value);
  },

  async getTemplates(): Promise<Templates | null> {
    return window.electronAPI.getTemplates();
  },

  async saveTemplates(templates: Templates): Promise<{ success: boolean }> {
    return window.electronAPI.saveTemplates(templates);
  },

  async generateFiles(data: { marchi: Marchio[]; templates: Templates }): Promise<GeneratedFiles> {
    return window.electronAPI.generateFiles(data);
  },

  async saveFile(data: { filename: string; content: string }): Promise<{ success: boolean; path?: string }> {
    return window.electronAPI.saveFile(data);
  },

  async exportMarchi(): Promise<GeneratedFiles> {
    return window.electronAPI.exportMarchi();
  },

  async openExternal(url: string): Promise<{ success: boolean; error?: string }> {
    return window.electronAPI.openExternal(url);
  },

  async checkForUpdates(): Promise<{ success: boolean }> {
    return window.electronAPI.checkForUpdates();
  },

  async downloadUpdate(): Promise<{ success: boolean }> {
    return window.electronAPI.downloadUpdate();
  },

  async installUpdate(): Promise<{ success: boolean }> {
    return window.electronAPI.installUpdate();
  },

  onUpdateAvailable(callback: (data: { version: string; releaseNotes?: string }) => void) {
    window.electronAPI.onUpdateAvailable(callback);
  },

  onUpdateProgress(callback: (data: { percent: number }) => void) {
    window.electronAPI.onUpdateProgress(callback);
  },

  onUpdateDownloaded(callback: (data: { version: string }) => void) {
    window.electronAPI.onUpdateDownloaded(callback);
  },

  onUpdateNotAvailable(callback: () => void) {
    window.electronAPI.onUpdateNotAvailable(callback);
  },

  onUpdateError(callback: (data: { message: string }) => void) {
    window.electronAPI.onUpdateError(callback);
  },

  async backupDatabase(): Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }> {
    return window.electronAPI.backupDatabase();
  },

  async restoreDatabase(): Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }> {
    return window.electronAPI.restoreDatabase();
  },

  async resolveUrls(urls: string[]): Promise<{ success: boolean; urls?: string[]; error?: string }> {
    return window.electronAPI.resolveUrls(urls);
  },
};