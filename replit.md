# Kairon Systems Bot

Bot de Discord para el servidor Kairon Group. Gestiona registros de eventos, ascensos, sanciones y bienvenidas.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — arranca el servidor y el bot de Discord
- `pnpm run typecheck` — typecheck completo
- `pnpm run build` — typecheck + build

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Bot: discord.js v14
- Almacenamiento warns: JSON en `data/warns.json`

## Funcionalidades del Bot

### Panel (`¡KPanelG`)
- Solo usuarios con permiso **Manage Guild** pueden enviarlo
- Botón **Registro**: abre flujo por MD paso a paso; el resultado va al canal `1495096536768708639`
- Botón **Promoción**: requiere permiso **Manage Roles**; muestra selector de usuario, añade roles Aspirante y retira el de no-miembro; resultado al canal `1522063302803591288`

### Comandos Slash
- `/warn [usuario] [motivo]` — emite warn, envía MD al sancionado y embed al canal `1495096918097793244`
- `/delwarn [usuario]` — muestra los warns del usuario en un selector y permite eliminar uno
- `/historial [usuario]` — muestra todos los warns del usuario (ephemeral)
- Todos requieren permiso **Moderate Members**

### Bienvenida automática
- Cada nuevo miembro recibe mensaje en canal `1512573906958155866` + MD de bienvenida

## Requisitos en el Portal de Discord

- **Server Members Intent** → activado en Bot > Privileged Gateway Intents
- **Message Content Intent** → activado en Bot > Privileged Gateway Intents

## Where things live

- Bot: `artifacts/api-server/src/bot/`
- Configuración (IDs, color): `artifacts/api-server/src/bot/config.ts`
- Almacenamiento warns: `data/warns.json` (creado automáticamente)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Los slash commands globales tardan hasta 1 hora en propagarse por primera vez en Discord
- El color de todos los embeds es `0x9C1F1F`
- El bot necesita que el usuario tenga MDs habilitados para el flujo de registro
