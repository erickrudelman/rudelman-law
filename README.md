# Rudelman Law Firm & Associates — Sitio web

Sitio web bilingüe (EN/ES) del bufete, con:

- **Sitio público** (`/`): inicio, nosotros, servicios, 15 áreas de práctica, cobertura, equipo, contacto y mapa.
- **Base de datos** (SQLite, archivo `data/rudelman.db`) con dos tablas: `team_members` y `messages`.
- **Panel de administración** (`/admin`), protegido con contraseña:
  - **Equipo**: agregar, editar, ocultar, reordenar o eliminar miembros, con foto.
  - **Mensajes**: cada mensaje que envía un cliente desde el formulario queda guardado aquí (leído / no leído, responder, eliminar).
- **Aviso por correo**: si se configura SMTP, cada mensaje nuevo también se envía a `NOTIFY_TO` (por defecto `recepcion@rudelmanlaw.com`). El correo trae "Responder a" con el email del cliente, así que basta con darle *Responder*.

## Correr en su computadora

```bash
npm install
cp .env.example .env     # y edite ADMIN_PASSWORD, SESSION_SECRET y SMTP
npm start
```

Abra http://localhost:3000 y el panel en http://localhost:3000/admin.

La primera vez que arranca, la base de datos se crea sola con los 11 miembros del equipo que aparecen en el sitio actual.

## Recibir los mensajes por correo

Complete en `.env`:

| Proveedor | SMTP_HOST | SMTP_PORT | Notas |
|---|---|---|---|
| Google Workspace / Gmail | `smtp.gmail.com` | `465` | Use una "contraseña de aplicación", no la normal |
| Microsoft 365 / Outlook | `smtp.office365.com` | `587` | Requiere SMTP AUTH habilitado en la cuenta |
| Resend (recomendado) | `smtp.resend.com` | `465` | `SMTP_USER=resend`, `SMTP_PASS=<API key>`; verificar el dominio rudelmanlaw.com |

Si el correo falla o no está configurado, **el mensaje nunca se pierde**: queda guardado en `/admin`. El panel indica arriba si el envío por correo está activo.

## Versión demo (GitHub Pages)

Cada `push` a `main` publica una versión estática en GitHub Pages (`.github/workflows/pages.yml`) para revisar el diseño:
el equipo se muestra desde un `team.json` generado de la base de datos inicial, y el formulario abre el correo del visitante dirigido a recepcion@. El panel `/admin` no funciona ahí porque Pages no tiene servidor.

## Publicarlo (hosting)

En Render se puede desplegar con un clic usando `render.yaml` (New → Blueprint → este repositorio).

Como usa una base de datos en archivo, necesita un hosting con **disco persistente**:

- **Render** (Web Service + Persistent Disk montado en `/var/data`, y `DATA_DIR=/var/data`)
- **Railway** (servicio Node + Volume, `DATA_DIR` apuntando al volumen)
- Cualquier VPS (DigitalOcean, Hetzner, etc.) con `npm start` detrás de Nginx/Caddy

Comando de inicio: `npm start`. Defina las mismas variables del `.env` en el panel del hosting. Luego apunte el dominio `rudelmanlaw.com` (DNS) al nuevo servidor.

**Respaldo:** todo (equipo, mensajes y fotos) vive en la carpeta `DATA_DIR`. Copiar esa carpeta = respaldo completo.

## Estructura

```
server.js            API + servidor (Express)
db.js                Base de datos SQLite y datos iniciales del equipo
public/index.html    Sitio público
public/css/          Estilos
public/js/main.js    Traducciones EN/ES, áreas de práctica, equipo, formulario
public/admin/        Panel de administración
public/img/          Logo (original) e imagen principal
```

Para editar textos o áreas de práctica: `public/js/main.js` (objeto `I18N` y lista `PRACTICE_AREAS`).
