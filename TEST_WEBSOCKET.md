# Test de Web Socket

Por favor sigue EXACTAMENTE estos pasos y compárteme TODO lo que veas:

## Paso 1: Abrir el navegador
1. Abre http://localhost:5173
2. Mantén la página abierta

## Paso 2: Abrir la consola
1. Click derecho en la página
2. Click en "Inspect" o "Inspeccionar"  
3. Click en la pestaña "Console" o "Consola"

## Paso 3: Capturar la información
1. **COPIA TODO** el texto que aparece en la consola
2. Especialmente busca mensajes que digan:
   - `[SocketStore]` 
   - `WS Connected`
   - `WS Disconnected`
   - Cualquier error en ROJO

## Paso 4: Ejecutar comando manual
En la consola del navegador (donde ves los mensajes), pega este comando y presiona Enter:

```javascript
window.testWebSocket = () => {
  const store = window.__ZUSTAND_STORES__?.socketStore || {};
  console.log('=== WEBSOCKET TEST ===');
  console.log('Store state:', store.getState?.());
  console.log('Calling connect...');
  store.getState?.().connect();
};
window.testWebSocket();
```

5. **COPIA TODA** la salida que aparezca después de ejecutar este comando

## ¿Qué espero ver?
Deberías ver mensajes como:
- `[SocketStore] Connect called { hasSocket: false, isConnected: false, hasUser: true, hasToken: true }`
- `[SocketStore] Attempting to connect to: ws://localhost:8000/api/v1/notifications/ws/...`
- `WS Connected`

Si ves algo diferente, cópiamelo TODO.
