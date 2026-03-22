# Tiza & Tinta — Pizarras

Portfolio de arte en pizarra con almacenamiento en la nube (Vercel Blob + KV) y panel de administración protegido por Basic Auth.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                        Vercel Edge                       │
│                                                          │
│   middleware.js ──► /admin  →  Basic Auth               │
│                     /       →  Público (sin auth)        │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                     Next.js App                          │
│                                                          │
│   GET  /api/arts         ←──► Vercel KV (Redis)         │
│   POST /api/arts         ──►  Vercel Blob (imagen CDN)  │
│                          ──►  Vercel KV  (metadatos)    │
│   DELETE /api/arts/[id]  ──►  Blob + KV                 │
└─────────────────────────────────────────────────────────┘
```

**Variables de entorno requeridas:**

| Variable | Origen |
|---|---|
| `ADMIN_USER` | Tú lo defines |
| `ADMIN_PASSWORD` | Tú lo defines |
| `BLOB_READ_WRITE_TOKEN` | Auto-generado por Vercel Blob |
| `KV_URL` | Auto-generado por Vercel KV |
| `KV_REST_API_URL` | Auto-generado por Vercel KV |
| `KV_REST_API_TOKEN` | Auto-generado por Vercel KV |
| `KV_REST_API_READ_ONLY_TOKEN` | Auto-generado por Vercel KV |
| `NEXT_PUBLIC_BASE_URL` | Tu URL de producción |

---

## 🚀 Deploy paso a paso

### Paso 1 — Subir el código a GitHub

```bash
cd tiza-y-tinta
git init
git add .
git commit -m "Initial commit"
```

Crea un repositorio nuevo en [github.com/new](https://github.com/new) (puede ser privado), luego:

```bash
git remote add origin https://github.com/TU_USUARIO/tiza-y-tinta.git
git branch -M main
git push -u origin main
```

---

### Paso 2 — Importar en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Elige **"Import Git Repository"** y selecciona `tiza-y-tinta`
3. Framework: **Next.js** (se detecta automáticamente)
4. Pulsa **Deploy** (fallará porque aún no tiene las variables — está bien, continuamos)

---

### Paso 3 — Crear Vercel Blob Store

1. En tu proyecto en Vercel → pestaña **Storage**
2. Clic en **Create Database** → elige **Blob**
3. Nombre: `tiza-tinta-images` → **Create**
4. En la página del store → pestaña **Settings** → **Connect to Project**
5. Selecciona tu proyecto `tiza-y-tinta` → **Connect**

✅ Esto añade automáticamente `BLOB_READ_WRITE_TOKEN` a tus variables de entorno.

---

### Paso 4 — Crear Vercel KV Store

1. En tu proyecto → pestaña **Storage**
2. Clic en **Create Database** → elige **KV (Redis)**
3. Nombre: `tiza-tinta-db` → Región: la más cercana a ti → **Create**
4. En la página del store → pestaña **Settings** → **Connect to Project**
5. Selecciona `tiza-y-tinta` → **Connect**

✅ Esto añade automáticamente `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` y `KV_REST_API_READ_ONLY_TOKEN`.

---

### Paso 5 — Agregar variables de entorno personalizadas

En Vercel → tu proyecto → **Settings → Environment Variables**

Agrega estas (marcando los 3 entornos: Production, Preview, Development):

| Variable | Valor |
|---|---|
| `ADMIN_USER` | El usuario que quieras, ej: `artista` |
| `ADMIN_PASSWORD` | Una contraseña segura |
| `NEXT_PUBLIC_BASE_URL` | `https://tiza-y-tinta.vercel.app` (tu URL real) |

> ⚠️ `NEXT_PUBLIC_BASE_URL` lo sabrás después del primer deploy. Puedes dejarlo vacío en el primer deploy y actualizarlo después.

---

### Paso 6 — Redesplegar

1. Ve a **Deployments** en tu proyecto
2. Clic en los tres puntos del último deploy → **Redeploy**
3. Espera ~1 min ✅

---

### Paso 7 — Verificar

- **Galería pública:** `https://tu-proyecto.vercel.app/`
- **Panel artista:** `https://tu-proyecto.vercel.app/admin`
  - El navegador pedirá usuario y contraseña (Basic Auth nativo)
  - Usa los valores que configuraste en `ADMIN_USER` / `ADMIN_PASSWORD`

---

## 💻 Desarrollo local

```bash
cp .env.example .env.local
# Rellena los valores copiándolos desde Vercel Dashboard → Storage → cada store → .env.local tab
npm install
npm run dev
```

La app estará en `http://localhost:3000`.

---

## 📝 Notas técnicas

- **Imágenes:** Se almacenan en Vercel Blob CDN con URLs públicas permanentes. Se eliminan del CDN al borrar la obra.
- **Metadatos:** Se guardan en una lista Redis (Vercel KV), ordered newest-first con `LPUSH`.
- **Autenticación:** Vercel Edge Middleware intercepta `/admin/*` antes de que llegue a Next.js. Credenciales comparadas contra env vars, nunca en código.
- **Escalabilidad:** Este stack soporta cómodamente miles de obras sin cambios. Para millones de imágenes considera paginar la API con `LRANGE offset count`.
