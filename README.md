# full-stack-adonisjs-master

Starter kit full-stack con autenticación por **access tokens**. Repo hilo conductor
del máster **AI4Devs** (LIDR). Monorepo con backend y frontend independientes.

```
full-stack-adonisjs-master/
├── backend/      AdonisJS 7 + Lucid + SQLite + VineJS + @adonisjs/auth
├── frontend/     React 19 + Vite + React Router + Tailwind v4 + shadcn/ui
├── openspec/     Configuración de OpenSpec (flujo /opsx:*)
├── docs/         Documentación del producto (PRD.md, ADRs, diagramas)
├── CLAUDE.md     Memoria de proyecto para copilotos de IA
└── README.md
```

## Requisitos

- **Node.js 24** o superior (AdonisJS 7 lo requiere). Comprueba con `node -v`.
- npm 10+.

## Arranque rápido

### 1. Backend (`http://localhost:3333`)

```bash
cd backend
npm install
cp .env.example .env
node ace generate:key      # rellena APP_KEY en .env
npm run migration:run      # crea las tablas users + auth_access_tokens
npm run dev                # servidor con HMR
```

### 2. Frontend (`http://localhost:5173`)

```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL ya apunta al backend
npm run dev
```

Abre `http://localhost:5173`, regístrate, entra al dashboard y cierra sesión.

## Endpoints del backend

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/v1/health` | — | Liveness (`{ status: 'ok' }`) |
| POST | `/api/v1/account/register` | — | Registro → `{ user, token }` |
| POST | `/api/v1/account/login` | — | Login → `{ user, token }` |
| POST | `/api/v1/account/logout` | Bearer | Revoca el token actual |
| GET | `/api/v1/account/profile` | Bearer | Usuario autenticado |
| GET | `/api/v1/users` | Bearer | Lista de usuarios |
| GET | `/api/v1/users/:id` | Bearer | Usuario por id |

> El endpoint `GET /api/v1/users/active` se implementa en vivo en la Sesión 3.

## Arquitectura

### Diagrama de contexto (C4)

Construido con [C4-PlantUML](https://github.com/plantuml-stdlib/C4-PlantUML).

```plantuml
@startuml C4_Context_FlowSync
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

LAYOUT_WITH_LEGEND()

title Diagrama de contexto - full-stack-adonisjs-master

Person(usuario, "Usuario", "Se registra, inicia sesión y consulta su perfil o la lista de usuarios.")

System(frontend, "Frontend", "React 19 + Vite + React Router", "SPA servida en localhost:5173. Guarda el access token y lo envía en cada petición.")

System(backend, "Backend", "AdonisJS 7 (Node.js)", "API JSON en /api/v1. Valida input con VineJS y autentica con @adonisjs/auth (access tokens). Expone documentación OpenAPI/Scalar en /api.")

SystemDb(db, "Base de datos", "SQLite (better-sqlite3)", "Archivo tmp/db.sqlite3. Persiste las tablas users y auth_access_tokens vía Lucid ORM.")

Rel(usuario, frontend, "Usa", "HTTPS (navegador)")
Rel(frontend, backend, "Consume la API REST", "HTTPS/JSON, Bearer token en Authorization")
Rel(backend, db, "Lee y escribe", "SQL vía Lucid ORM (better-sqlite3, embebido)")

@enduml
```

### Flujo de login (secuencia)

Verificado en [mermaid.live](https://mermaid.live/).

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Frontend (React)
    participant API as AccessTokensController
    participant AF as AuthFinder (verifyCredentials)
    participant DB as SQLite (users)
    participant AT as DbAccessTokensProvider

    U->>FE: Ingresa email y password
    FE->>API: POST /api/v1/account/login {email, password}
    API->>API: request.validateUsing(loginValidator)
    API->>AF: User.verifyCredentials(email, password)
    AF->>DB: SELECT * FROM users WHERE email = ?
    DB-->>AF: fila de usuario (password hasheado)
    AF->>AF: hash.verify(password, user.password)
    alt credenciales inválidas
        AF-->>API: throw InvalidCredentialsException
        API-->>FE: 400 Bad Request
        FE-->>U: Muestra error de login
    else credenciales válidas
        AF-->>API: instancia de User
        API->>DB: UPDATE users SET last_seen_at = now()
        API->>AT: User.accessTokens.create(user)
        AT->>DB: INSERT INTO auth_access_tokens
        DB-->>AT: token persistido
        AT-->>API: AccessToken (con .value)
        API-->>FE: 200 OK {user, token}
        FE-->>U: Redirige al dashboard
    end
```

## Workflow con OpenSpec

Flujo spec-driven con Claude Code o Cursor:

```
/opsx:propose "añadir endpoint X"   # genera proposal + specs + tasks
/opsx:apply                          # implementa según las tasks
/opsx:archive                        # archiva el cambio aplicado
```

La configuración vive en `openspec/config.yaml`. Los comandos y skills se
instalaron en `.claude/` y `.cursor/`.

<!-- TEST: check-links-source debe fallar por este link -->
[link de prueba roto](https://este-dominio-no-existe-zzz12345-abcxyz.com)

