const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  enviarLogin: (datos) => ipcRenderer.invoke('auth:login', datos),
  obtenerInquilinos: () => ipcRenderer.invoke('inquilinos:listar'),
  guardarInquilino: (datos) => ipcRenderer.invoke('inquilinos:crear', datos),
  eliminarInquilino: (id) => ipcRenderer.invoke('inquilinos:borrar', id),
  guardarRecibosMes: (listaRecibos) => ipcRenderer.invoke('recibos:guardar-mes', listaRecibos),
  actualizarInquilino: (id, datos) => ipcRenderer.invoke('inquilinos:actualizar', { id, ...datos })
});