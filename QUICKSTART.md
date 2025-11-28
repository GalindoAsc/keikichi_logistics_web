# 🚀 Guía de Inicio Rápido - Keikichi Logistics

Esta guía te llevará paso a paso desde cero hasta tener la aplicación corriendo en tu computadora. No asume ningún conocimiento previo.

---

## 📋 Antes de Empezar

### ¿Qué necesitas tener instalado?

1. **Docker Desktop** - Para correr la aplicación en contenedores
   - Descarga: https://www.docker.com/products/docker-desktop
   - Versión mínima: 24.0+

2. **Git** - Para descargar el código
   - Descarga: https://git-scm.com/downloads
   - Versión mínima: 2.40+

3. **Un editor de texto** (opcional, pero útil)
   - Visual Studio Code: https://code.visualstudio.com/
   - O cualquier editor de texto simple (nano, notepad, etc.)

### ¿Cómo verificar si ya los tienes instalados?

Abre una **Terminal** (Mac/Linux) o **PowerShell** (Windows) y ejecuta:

```bash
docker --version
```
**Debes ver algo como:** `Docker version 24.0.x, build ...`

```bash
git --version
```
**Debes ver algo como:** `git version 2.40.x`

Si alguno da error "command not found" o similar, necesitas instalarlo primero.

---

## 🎯 Paso 1: Descargar el Proyecto

### 1.1 Abre tu Terminal

- **En Mac:** Presiona `Cmd + Espacio`, escribe "Terminal" y presiona Enter
- **En Windows:** Presiona `Win + R`, escribe "powershell" y presiona Enter
- **En Linux:** Presiona `Ctrl + Alt + T`

### 1.2 Navega a donde quieres guardar el proyecto

Ejemplo (cámbialo por tu carpeta preferida):

```bash
cd ~
```

**¿Qué hace este comando?**
- `cd` significa "change directory" (cambiar carpeta)
- `~` es tu carpeta de usuario (ej: /Users/tunombre)

### 1.3 Descarga el código del proyecto

Copia y pega este comando:

```bash
git clone https://github.com/GalindoAsc/keikichi_logistics_web.git
```

**¿Qué hace este comando?**
- Descarga todo el código del proyecto desde GitHub a tu computadora

**Verás algo como:**
```
Clonando en 'keikichi_logistics_web'...
remote: Enumerating objects: 340, done.
remote: Counting objects: 100% (340/340), done.
Recibiendo objetos: 100% (340/340), listo.
```

### 1.4 Entra a la carpeta del proyecto

```bash
cd keikichi_logistics_web
```

**¿Qué hace este comando?**
- Entra a la carpeta que acabas de descargar

### 1.5 Cambia a la rama correcta (donde está el código actualizado)

```bash
git checkout claude/keikichi-logistics-app-01X28hvdbJLTa6iEePksh4JB
```

**¿Qué hace este comando?**
- Cambia a la rama de desarrollo donde está el código más reciente

**Verás algo como:**
```
Rama 'claude/keikichi-logistics-app-01X28hvdbJLTa6iEePksh4JB' configurada para hacer seguimiento a la rama remota...
```

### 1.6 Asegúrate de tener los últimos cambios

```bash
git pull
```

**¿Qué hace este comando?**
- Descarga las últimas actualizaciones del código

**Verás algo como:**
```
Already up to date.
```
O si hay cambios nuevos, verás una lista de archivos actualizados.

---

## 🎯 Paso 2: Configurar Variables de Entorno

### 2.1 Crear el archivo .env

Ejecuta este comando:

```bash
cp .env.example .env
```

**¿Qué hace este comando?**
- `cp` = copiar
- Copia el archivo `.env.example` (que es una plantilla) a `.env` (que usará la aplicación)

**No verás ningún mensaje**, eso es normal. El comando se ejecuta en silencio.

### 2.2 Verificar que se creó correctamente

```bash
ls -la | grep .env
```

**Debes ver algo como:**
```
-rw-r--r--   1 tunombre  staff  1234 Nov 28 10:00 .env
-rw-r--r--   1 tunombre  staff  1456 Nov 28 10:00 .env.example
```

Ambos archivos deben aparecer.

### 2.3 (Opcional) Ver el contenido del archivo .env

```bash
cat .env
```

**Verás algo como:**
```
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=dev-secret-key-not-for-production...
...
```

**No necesitas cambiar nada por ahora.** Los valores por defecto funcionan para desarrollo local.

---

## 🎯 Paso 3: Iniciar Docker Desktop

### 3.1 Abre Docker Desktop

- **En Mac:** Busca "Docker" en tus aplicaciones y ábrelo
- **En Windows:** Busca "Docker Desktop" en el menú inicio y ábrelo

### 3.2 Espera a que Docker Desktop esté listo

Verás un ícono de ballena 🐳 en tu barra de tareas/menú superior.

**Espera hasta que diga:** "Docker Desktop is running"

Esto puede tomar 30-60 segundos la primera vez.

---

## 🎯 Paso 4: Iniciar la Aplicación

### 4.1 Navega a la carpeta infra

Desde la raíz del proyecto (donde ya estás), ejecuta:

```bash
cd infra
```

**¿Qué hace este comando?**
- Entra a la carpeta `infra` donde está la configuración de Docker

### 4.2 Verificar que estás en la carpeta correcta

```bash
pwd
```

**Debes ver algo como:**
```
/Users/tunombre/keikichi_logistics_web/infra
```

El path debe terminar en `/infra`

### 4.3 Verificar que el archivo docker-compose.dev.yml existe

```bash
ls -la docker-compose.dev.yml
```

**Debes ver:**
```
-rw-r--r--  1 tunombre  staff  3456 Nov 28 10:00 docker-compose.dev.yml
```

### 4.4 INICIAR LA APLICACIÓN (¡Este es el comando importante!)

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

**¿Qué hace este comando?**
- `docker compose` = herramienta para gestionar múltiples contenedores
- `-f docker-compose.dev.yml` = usa este archivo de configuración
- `up` = inicia los servicios
- `-d` = corre en segundo plano (detached)
- `--build` = construye las imágenes desde cero

**⏱️ IMPORTANTE: Este comando tomará entre 3-5 MINUTOS la primera vez.**

### 4.5 ¿Qué verás durante este proceso?

**Fase 1: Descarga de imágenes (1-2 minutos)**
```
[+] Pulling 12/12
 ✔ keikichi_db Pulled
 ✔ keikichi_backend Pulling
 ✔ keikichi_frontend Pulling
```

**Fase 2: Construcción de contenedores (2-3 minutos)**
```
[+] Building 23.9s (20/21)
 => [keikichi_backend] RUN pip install...
 => [keikichi_frontend] RUN npm install...
```

**Fase 3: Inicio de servicios (10-20 segundos)**
```
[+] Running 3/3
 ✔ Container keikichi_db_dev         Started
 ✔ Container keikichi_backend_dev    Started
 ✔ Container keikichi_frontend_dev   Started
```

### 4.6 Verificar que todo está corriendo

Ejecuta:

```bash
docker compose -f docker-compose.dev.yml ps
```

**Debes ver algo como:**
```
NAME                    IMAGE                          STATUS              PORTS
keikichi_db_dev         postgres:15-alpine             Up 2 minutes        0.0.0.0:5432->5432/tcp
keikichi_backend_dev    infra-keikichi_backend         Up 2 minutes (healthy)  0.0.0.0:8000->8000/tcp
keikichi_frontend_dev   infra-keikichi_frontend        Up 2 minutes        0.0.0.0:5173->5173/tcp
```

**✅ Si todos dicen "Up" y "healthy" (o solo "Up"), ¡está funcionando!**

**❌ Si alguno dice "Exit 1" o "Exited", hay un problema.** Ve a la sección de "¿Algo salió mal?" al final.

---

## 🎯 Paso 5: Ver la Aplicación en tu Navegador

### 5.1 Abre tu navegador web favorito (Chrome, Firefox, Safari, etc.)

### 5.2 Prueba el Frontend (Interfaz visual)

En la barra de direcciones, escribe:

```
http://localhost:5173
```

**Debes ver:**
- Una página con el título "🚚 Keikichi Logistics"
- "Plataforma de Gestión Logística"
- Un contador con botones + y -
- Una lista de módulos completados con checkmarks verdes ✓

**Si ves esto, ¡el frontend está funcionando! 🎉**

### 5.3 Prueba el Backend (API)

En otra pestaña del navegador, escribe:

```
http://localhost:8000
```

**Debes ver:**
Un mensaje en formato JSON como:
```json
{
  "message": "Keikichi Logistics API",
  "version": "1.0.0",
  "status": "running",
  "docs": "/docs"
}
```

**Si ves esto, ¡el backend está funcionando! 🎉**

### 5.4 Prueba la Documentación de la API

En otra pestaña del navegador, escribe:

```
http://localhost:8000/docs
```

**Debes ver:**
- Una página con título "Keikichi Logistics API"
- Una interfaz de "Swagger UI" con endpoints interactivos
- Puedes expandir secciones y ver los endpoints disponibles

**Si ves esto, ¡la documentación de la API está funcionando! 🎉**

---

## 🎯 Paso 6: Probar que Hot Reload Funciona

"Hot reload" significa que cuando cambias el código, la aplicación se actualiza automáticamente sin tener que reiniciar todo.

### 6.1 Abre el archivo App.tsx del frontend

Si tienes Visual Studio Code:

```bash
# Desde la carpeta infra, vuelve a la raíz
cd ..

# Abre el proyecto en VS Code
code .
```

Luego navega a: `frontend/src/App.tsx`

**O con cualquier editor de texto:**

```bash
cd ..
nano frontend/src/App.tsx
```

### 6.2 Cambia el título

Busca la línea que dice:

```tsx
🚚 Keikichi Logistics
```

Y cámbiala a:

```tsx
🚚 Keikichi Logistics - ¡FUNCIONA!
```

### 6.3 Guarda el archivo

- **En VS Code:** `Cmd+S` (Mac) o `Ctrl+S` (Windows)
- **En nano:** `Ctrl+O`, luego Enter, luego `Ctrl+X`

### 6.4 Vuelve a tu navegador (http://localhost:5173)

**En 1-3 segundos, la página se actualizará automáticamente** y verás el nuevo título:

```
🚚 Keikichi Logistics - ¡FUNCIONA!
```

**Si esto sucede, el hot reload está funcionando correctamente! 🎉**

---

## 🎯 Paso 7: Ver los Logs (Opcional pero Útil)

Los logs te muestran qué está pasando dentro de cada servicio.

### 7.1 Ver logs de todos los servicios

```bash
cd infra
docker compose -f docker-compose.dev.yml logs -f
```

**¿Qué hace este comando?**
- `logs` = muestra los mensajes de los contenedores
- `-f` = "follow" (sigue mostrando nuevos mensajes en tiempo real)

**Verás un montón de mensajes**, algo como:

```
keikichi_backend_dev  | INFO:     Application startup complete.
keikichi_frontend_dev | VITE ready in 523 ms
keikichi_db_dev       | database system is ready to accept connections
```

**Para salir:** Presiona `Ctrl+C`

### 7.2 Ver logs de un solo servicio

Si solo quieres ver los logs del backend:

```bash
docker compose -f docker-compose.dev.yml logs -f keikichi_backend
```

Para el frontend:

```bash
docker compose -f docker-compose.dev.yml logs -f keikichi_frontend
```

Para la base de datos:

```bash
docker compose -f docker-compose.dev.yml logs -f keikichi_db
```

---

## 🛑 Paso 8: Detener la Aplicación

Cuando termines de trabajar, puedes detener todo.

### 8.1 Detener los servicios (manteniendo los datos)

```bash
cd infra
docker compose -f docker-compose.dev.yml down
```

**¿Qué hace este comando?**
- Detiene todos los contenedores
- Elimina los contenedores
- **NO elimina** la base de datos ni los volúmenes

**Verás:**
```
[+] Running 3/3
 ✔ Container keikichi_frontend_dev  Removed
 ✔ Container keikichi_backend_dev   Removed
 ✔ Container keikichi_db_dev        Removed
```

### 8.2 Detener y ELIMINAR TODO (incluyendo base de datos)

⚠️ **CUIDADO:** Esto borra la base de datos. Solo hazlo si quieres empezar desde cero.

```bash
docker compose -f docker-compose.dev.yml down -v
```

El `-v` significa "volumes" (elimina también los volúmenes donde está la base de datos).

---

## 🔄 Paso 9: Volver a Iniciar (Días Siguientes)

Para volver a trabajar en días posteriores:

### 9.1 Abre Docker Desktop

Asegúrate de que Docker Desktop esté corriendo (ballena 🐳 en la barra de tareas).

### 9.2 Navega a la carpeta del proyecto

```bash
cd ~/keikichi_logistics_web/infra
```

(Ajusta el path según donde hayas clonado el proyecto)

### 9.3 Inicia los servicios

```bash
docker compose -f docker-compose.dev.yml up -d
```

**Nota:** No necesitas `--build` si no has cambiado las dependencias. Esto hace que sea mucho más rápido (10-20 segundos).

### 9.4 Si hay cambios nuevos del repositorio

```bash
# Vuelve a la raíz del proyecto
cd ~/keikichi_logistics_web

# Descarga los cambios
git pull

# Reinicia con rebuild (por si cambiaron dependencias)
cd infra
docker compose -f docker-compose.dev.yml up -d --build
```

---

## ❌ ¿Algo salió mal? Troubleshooting

### Problema 1: "docker: command not found"

**Solución:**
- Docker Desktop no está instalado o no está corriendo
- Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop
- Ábrelo y espera a que inicie completamente

### Problema 2: "Cannot connect to the Docker daemon"

**Solución:**
- Docker Desktop no está corriendo
- Abre Docker Desktop y espera a que diga "Docker Desktop is running"

### Problema 3: Un contenedor dice "Exit 1" o "Exited"

**Solución:**
Ver qué pasó:

```bash
docker compose -f docker-compose.dev.yml logs keikichi_backend
```

(Reemplaza `keikichi_backend` por el nombre del contenedor que falló)

Busca líneas que digan `ERROR` o muestra el error completo.

**Soluciones comunes:**
- Si es error de dependencias: `docker compose -f docker-compose.dev.yml up -d --build`
- Si es error de puerto ocupado: Detén cualquier otra aplicación usando los puertos 5432, 8000 o 5173

### Problema 4: "port is already allocated"

**Significa:** Otra aplicación está usando el puerto.

**Solución:**

Para encontrar qué está usando el puerto (ejemplo: puerto 5432):

**En Mac/Linux:**
```bash
lsof -i :5432
```

**En Windows:**
```powershell
netstat -ano | findstr :5432
```

Detén esa aplicación o cambia el puerto en `docker-compose.dev.yml`.

### Problema 5: El navegador no carga http://localhost:5173

**Solución:**

1. Verifica que el contenedor esté corriendo:
   ```bash
   docker compose -f docker-compose.dev.yml ps
   ```

2. Ve los logs del frontend:
   ```bash
   docker compose -f docker-compose.dev.yml logs -f keikichi_frontend
   ```

3. Busca el mensaje que dice: `VITE ready in XXX ms`

4. Si no lo ves, espera 30-60 segundos más (puede tardar en instalar dependencias la primera vez)

### Problema 6: Cambios en el código no se reflejan

**Solución:**

1. Verifica que estás editando el archivo correcto (dentro de tu carpeta del proyecto)

2. Reinicia el servicio específico:
   ```bash
   docker compose -f docker-compose.dev.yml restart keikichi_frontend
   ```

3. Verifica los volúmenes están montados:
   ```bash
   docker inspect keikichi_frontend_dev | grep -A 5 Mounts
   ```

### Problema 7: Error "No space left on device"

**Solución:**

Docker está ocupando mucho espacio. Limpia imágenes viejas:

```bash
docker system prune -a
```

**⚠️ Esto eliminará todas las imágenes no usadas.** Confirma con `y`.

---

## 📞 ¿Necesitas Ayuda?

Si nada de esto funciona, comparte:

1. **El error exacto** que ves
2. **El output de estos comandos:**
   ```bash
   docker --version
   docker compose -f docker-compose.dev.yml ps
   docker compose -f docker-compose.dev.yml logs
   ```
3. **Tu sistema operativo** (Mac, Windows, Linux)

---

## ✅ Checklist Final

Marca todo lo que funciona:

- [ ] Docker Desktop está instalado y corriendo
- [ ] Clonaste el repositorio
- [ ] Creaste el archivo `.env`
- [ ] Ejecutaste `docker compose -f docker-compose.dev.yml up -d --build`
- [ ] Los 3 contenedores dicen "Up" en `docker compose ps`
- [ ] http://localhost:5173 muestra el frontend
- [ ] http://localhost:8000 muestra el backend
- [ ] http://localhost:8000/docs muestra la documentación
- [ ] El hot reload funciona (cambios se reflejan automáticamente)

**Si marcaste todos, ¡estás listo para desarrollar! 🎉**

---

## 🎯 Próximos Pasos

Ahora que tienes todo corriendo, los próximos módulos serán:

1. **Base de Datos** - Crear tablas y modelos
2. **Autenticación** - Sistema de login
3. **Viajes** - Gestión de viajes
4. **Espacios** - Mapa visual de tarimas
5. **Reservaciones** - Sistema de reservas
6. Y más...

---

**¡Bienvenido al proyecto Keikichi Logistics! 🚚**
