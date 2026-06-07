const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Aquí definirán las funciones para comunicarse con el backend más adelante
  enviarLogin: (datos) => ipcRenderer.invoke('auth:login', datos),
  guardarInquilino: (datos) => ipcRenderer.invoke('db:guardarInquilino', datos)
});