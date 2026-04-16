const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getMarchi: () => ipcRenderer.invoke('get-marchi'),
  addMarchio: (marchio) => ipcRenderer.invoke('add-marchio', marchio),
  updateMarchio: (marchio) => ipcRenderer.invoke('update-marchio', marchio),
  deleteMarchio: (id) => ipcRenderer.invoke('delete-marchio', id),
  generateBitly: (url) => ipcRenderer.invoke('generate-bitly', url),
  testLink: (url) => ipcRenderer.invoke('test-link', url),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  getTemplates: () => ipcRenderer.invoke('get-templates'),
  saveTemplates: (templates) => ipcRenderer.invoke('save-templates', templates),
  generateFiles: (data) => ipcRenderer.invoke('generate-files', data),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  exportMarchi: () => ipcRenderer.invoke('export-marchi'),
});