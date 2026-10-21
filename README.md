# pichangaYa

Backend NestJS con Fastify, TypeORM y PostgreSQL/PostGIS. Requiere Node.js 22+ y Docker Compose.

## Inicio local

```bash
cp .env.example .env
npm ci
docker --context default compose up -d db
npm run migration:run
npm run start:dev
```

La API escucha en `http://127.0.0.1:3000`. PostgreSQL se publica en `127.0.0.1:55434`; puedes cambiar `DB_PORT` en Compose y ajustar `DATABASE_URL`. Las migraciones son explícitas; `synchronize` está desactivado. En producción, configura credenciales propias y ejecuta las migraciones con un rol que pueda crear las extensiones `postgis` y `btree_gist`.

## Endpoints

| Método | Ruta | Datos |
|---|---|---|
| POST | `/users` | `name`, `email` |
| POST | `/venues` | `name`, `address`, `latitude`, `longitude` |
| POST | `/courts` | `name`, `venueId` |
| GET | `/courts/nearby` | Query: `latitude`, `longitude`, `radiusMeters` (1–100000) |
| POST | `/bookings` | `courtId`, `userId`, `startsAt`, `endsAt` |
| GET | `/courts/:id/availability` | Query: `startsAt`, `endsAt` |

Ejemplo de reserva (reemplazar los UUID por los obtenidos al crear usuario y cancha):

```bash
curl -X POST http://127.0.0.1:3000/bookings \
  -H 'Content-Type: application/json' \
  -d '{"courtId":"UUID_CANCHA","userId":"UUID_USUARIO","startsAt":"2026-11-01T18:00:00-05:00","endsAt":"2026-11-01T19:00:00-05:00"}'

curl 'http://127.0.0.1:3000/courts/nearby?latitude=-15.4997&longitude=-70.1333&radiusMeters=3000'
```

Los timestamps requieren `Z` u offset explícito; las respuestas usan UTC. La disponibilidad devuelve `available` para todo el intervalo y `freeIntervals` con sus tramos libres. No se presupone un horario comercial: se consulta cualquier ventana solicitada. La consulta es una instantánea; la confirmación de reserva puede responder `409` si otra solicitud ocupó el horario.

Las reservas usan intervalos `[inicio, fin)`: 18:00–19:00 y 19:00–20:00 son compatibles. Una restricción de exclusión GiST en PostgreSQL evita cruces incluso ante inserciones concurrentes; cada inserción se ejecuta en la transacción de TypeORM. Otras canchas pueden reservarse al mismo tiempo. Identificadores inexistentes responden `404`, datos inválidos `400`, cruces o emails duplicados `409`.

Las ubicaciones se guardan como `geography(Point,4326)` en orden **longitud, latitud**. La búsqueda usa `ST_DWithin`, índice GiST y `ST_Distance`, con metros reales; devuelve hasta 100 canchas ordenadas por distancia.

Este núcleo aún no incorpora autenticación, roles, pagos ni cancelaciones. `userId` lo proporciona el cliente; antes de exponer la API públicamente debe vincularse a la identidad autenticada.

## Verificación

```bash
npm run build
npm test
```

Integración con una base exclusiva para pruebas (no usar una base de producción):

```bash
docker --context default compose exec -T db createdb -U pichanga pichanga_test
DATABASE_URL=postgresql://pichanga:pichanga@127.0.0.1:55434/pichanga_test npm run test:integration
```

La suite aplica las migraciones, usa HTTP real mediante Fastify inject y elimina únicamente sus propios registros. Comprueba competencia entre dos usuarios, reservas contiguas, cruces parciales y completos, tramos libres, radio geográfico y validación HTTP. `npm test` omite esta suite salvo que `RUN_DB_TESTS=1`.

## Git

El entorno de creación montó `.git` en solo lectura, por lo que no fue posible inicializar Git, crear commits/ramas ni publicar en GitHub. Cuando `.git` sea escribible, ejecutar desde esta carpeta:

```bash
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/RONAL545/pichangaYa.git
git push -u origin main
git checkout -b feature/backend-core
git add .gitignore .env.example package.json package-lock.json tsconfig.json compose.yaml src test
git commit -m "feat: backend core with PostGIS and conflict-free bookings"
git push -u origin feature/backend-core
```

## Referencias

- [Adaptador Fastify de NestJS](https://docs.nestjs.com/techniques/performance)
- [Restricciones de exclusión y rangos PostgreSQL](https://www.postgresql.org/docs/15/rangetypes.html)
- [ST_DWithin y distancias en metros](https://postgis.net/docs/manual-3.5/en/ST_DWithin.html)
