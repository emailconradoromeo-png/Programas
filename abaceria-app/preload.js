const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('appConfig', {
  apiURL: 'http://localhost:3456/api',
});
