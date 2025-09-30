## Bibliofinder Frontend

Aplicación React (Create React App + CRACO) para la interfaz de Bibliofinder.

### Requisitos

- Node.js 18+ (recomendado LTS)
- npm 9/10 u opcionalmente Yarn 1.x

### Instalación

- Si usas npm (recomendado en este repo):

```bash
npm install --legacy-peer-deps
```

- Alternativa con Yarn 1.x (si prefieres respetar `packageManager`):

```bash
npm i -g yarn@1.22.22
yarn install --non-interactive
```

### Desarrollo

```bash
npm start
```

Se abrirá en `http://localhost:3000`.

Notas de configuración:
- CRACO añade alias `@` a `src/` y permite desactivar HMR con la variable `DISABLE_HOT_RELOAD=true`.

### Build de producción

```bash
npm run build
```

Genera la carpeta `build/` optimizada para producción.

### Scripts disponibles

- `npm start`: inicia el servidor de desarrollo (CRACO + react-scripts)
- `npm run build`: crea el build de producción
- `npm test`: ejecuta los tests (si están configurados)

---

## Solución de problemas (Troubleshooting)

### Error: `npm run install` → Missing script: "install"

En este proyecto no existe un script llamado `install`. Para instalar dependencias usa:

```bash
npm install --legacy-peer-deps
```

o bien Yarn 1.x:

```bash
yarn install --non-interactive
```

### Error de dependencias: `ERESOLVE could not resolve` (react-scripts 5 y TypeScript 5)

`react-scripts@5` declara `typescript@^3 || ^4` como peer optional. Con npm 10 y TypeScript 5 puede aparecer un conflicto. Opciones:

- Usar `npm install --legacy-peer-deps` (recomendado para este repo).
- O fijar TypeScript 4.x:

```bash
npm i -D typescript@4.9.5
```

- O instalar y usar Yarn 1.x, que resuelve peer deps de forma más laxa:

```bash
npm i -g yarn@1.22.22
yarn install --non-interactive
```

### Error de permisos de caché npm (`EACCES: permission denied, rename ... _cacache`)

Si aparece un error de permisos de la caché global de npm en macOS:

```bash
npm cache clean --force
mkdir -p .npm-cache
npm install --legacy-peer-deps --cache ./.npm-cache
```

### `npm ci` falla pidiendo sincronizar lockfile

Si `npm ci` se queja de que `package.json` y `package-lock.json` no están sincronizados, ejecuta primero `npm install` (o Yarn) para regenerar el lockfile:

```bash
npm install --legacy-peer-deps
```

---

## Notas

- Este proyecto usa Tailwind CSS y componentes Radix UI/Shadcn.
- El alias `@` apunta a `src/` y se configura en `craco.config.js`.
