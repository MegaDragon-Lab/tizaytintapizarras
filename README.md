# Tiza & Tinta — Pizarras

Portfolio de arte en pizarra con panel de administración protegido por Basic Auth via Vercel.

## Arquitectura

- **`/`** — Galería pública (sin restricción)
- **`/admin`** — Panel del artista (protegido por Basic Auth)
- **`middleware.js`** — Intercepta `/admin` y valida credenciales contra variables de entorno

## Deploy en Vercel

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/tiza-y-tinta.git
git push -u origin main
```

### 2. Importar en Vercel

1. Ve a [vercel.com](https://vercel.com) → **Add New Project**
2. Importa tu repositorio de GitHub
3. Framework: **Next.js** (se detecta automáticamente)
4. Pulsa **Deploy**

### 3. Configurar variables de entorno

En Vercel → Tu proyecto → **Settings → Environment Variables**, agrega:

| Variable | Valor | Entornos |
|---|---|---|
| `ADMIN_USER` | `artista` (o el usuario que prefieras) | Production, Preview |
| `ADMIN_PASSWORD` | Tu contraseña segura | Production, Preview |

> ⚠️ Nunca pongas las credenciales en el código. Solo en variables de entorno de Vercel.

### 4. Redesplegar

Después de agregar las variables, ve a **Deployments → Redeploy** para que tomen efecto.

## Uso local

```bash
cp .env.example .env.local
# Edita .env.local con tus credenciales
npm install
npm run dev
```

Luego accede a:
- `http://localhost:3000` — Galería
- `http://localhost:3000/admin` — Panel (pedirá usuario/contraseña)

## Notas

- Las obras se guardan en `localStorage` del navegador del artista.
- Para producción con múltiples dispositivos, se puede extender con una base de datos (Vercel KV, PlanetScale, etc.).
