# Secrets para `docker-compose.prod.yml`

Cada archivo aquí contiene **un solo valor**, sin salto de línea final necesario (se recorta al
leerlo). `docker-compose.prod.yml` los monta como [Docker secrets](https://docs.docker.com/compose/how-tos/use-secrets/)
en `/run/secrets/<nombre>` dentro de cada contenedor — nunca como variables de entorno planas.

Crea estos archivos antes de `docker compose -f docker-compose.prod.yml up` (ninguno se
commitea — `secrets/*.txt` está en `.gitignore`):

| Archivo | Contenido |
|---|---|
| `postgres_password.txt` | La contraseña de Postgres (coincide con lo que uses al crear la base) |
| `database_url.txt` | Connection string completo: `postgresql://<user>:<password>@postgres:5432/<db>` |
| `jwt_secret.txt` | Cadena aleatoria larga (ej. `openssl rand -base64 48`) |
| `google_client_secret.txt` | El "Client secret" de las credenciales OAuth de Google Cloud Console |

```bash
openssl rand -base64 48 > secrets/jwt_secret.txt
echo -n "tu-contraseña-de-postgres" > secrets/postgres_password.txt
echo -n "postgresql://mhpt:tu-contraseña-de-postgres@postgres:5432/mhpt" > secrets/database_url.txt
echo -n "tu-google-client-secret" > secrets/google_client_secret.txt
```
