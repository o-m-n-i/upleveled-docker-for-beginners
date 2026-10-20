# Demo 03: Guestbook (Node.js + MongoDB)

A small Express app where students can sign a guestbook, stored in MongoDB.
It replaces the demo project in the slides (106–223) and follows the same story:

| Step | What | Slides |
| --- | --- | --- |
| 1 | Run MongoDB + mongo-express with `docker run` on a Docker network | 120–129 |
| 2 | Same thing with Docker Compose | 130–144 |
| 3 | Develop the app on your laptop against the containerized DB | 121–124 |
| 4 | Write a Dockerfile and build the app image | 145–163 |
| 5 | Run the whole stack with Compose | 175–187 |
| 6 | Push the image to a registry | 164–174 |
| 7 | Volumes: keep the data | 188–223 |
| + | Debugging: when it doesn't work | 105 |

The page shows which **container** served it (the container ID is the
hostname).

```
server.js              Express API + static files
public/index.html      the UI
package.json           dependencies (express, mongodb)
Dockerfile             how to build the app image
.dockerignore          what NOT to send into the build
mongo-compose.yaml     step 2: just MongoDB + mongo-express
compose.yaml           step 5: the full stack (app + db + UI + volume)
.github/workflows/     CI/CD example: build + push on every commit
```

---

## Step 1: The manual way: `docker run` + a network

```bash
docker network create mongo-network

docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  --net mongo-network \
  mongo:8

docker run -d \
  --name mongo-express \
  -p 8081:8081 \
  -e ME_CONFIG_MONGODB_ADMINUSERNAME=admin \
  -e ME_CONFIG_MONGODB_ADMINPASSWORD=password \
  -e ME_CONFIG_MONGODB_SERVER=mongodb \
  -e ME_CONFIG_BASICAUTH=false \
  --net mongo-network \
  mongo-express:1
```

Open http://localhost:8081 and create a database called `guestbook`.

> ⚠️ The original slides write `MONGO-INITDB_ROOT_USERNAME` with a **hyphen**.
> That's a typo: the real variable uses underscores. With the hyphen Mongo
> silently starts **without** a password. Copy the commands from here, not the slides.

Things to notice:

- `ME_CONFIG_MONGODB_SERVER=mongodb`: on a user-defined network, **container
  names work as hostnames**.
- If mongo-express exits right away: `docker logs mongo-express`. Usually
  Mongo wasn't ready yet; `docker start mongo-express` again.
- That's a lot of typing. Imagine 10 services. → Compose.

Clean up:

```bash
docker rm -f mongodb mongo-express
docker network rm mongo-network
```

## Step 2: The same with Docker Compose

Compare `mongo-compose.yaml` with the two `docker run` commands above: each
flag maps to a YAML line (`-p` → `ports`, `-e` → `environment`, `--name` →
service name). The network is gone: **Compose creates one for you**.

```bash
docker compose -f mongo-compose.yaml up -d
docker compose -f mongo-compose.yaml ps
docker network ls                       # 03-guestbook-app_default, made by Compose
docker compose -f mongo-compose.yaml logs -f mongo-express
```

Leave it running for step 3.

## Step 3: Develop with containers

The DB runs in Docker, the app runs on your laptop like normal (needs Node.js):

```bash
npm install
npm start
```

Open http://localhost:3000 and sign the guestbook. Then check the
`guestbook` → `messages` collection in mongo-express (http://localhost:8081).

> No MongoDB installed on the laptop, no version clash with other projects,
> and every developer gets the exact same DB with one command.

Stop the app (Ctrl+C) and the DB:

```bash
docker compose -f mongo-compose.yaml down
```

## Step 4: Dockerfile → image

Read through the `Dockerfile` (every line is commented). Compared with the version on slide 159:

| Slide 159 | Our Dockerfile | Why |
| --- | --- | --- |
| `FROM node` | `FROM node:22-alpine` | Pin a version; alpine is much smaller |
| `ENV MONGO_DB_PWD=password` | (not in the image) | Secrets don't belong in images: anyone who pulls it can read them |
| `RUN mkdir -p /home/app` | `WORKDIR /home/app` | Creates the folder *and* `cd`s into it |
| `COPY . /home/app` | `COPY package*.json` → `npm ci` → `COPY . .` | Layer caching: dependencies are only reinstalled when they change |
| (none) | `USER node` | Don't run as root |
| (none) | `HEALTHCHECK` | Docker knows if the app actually works |

```bash
docker build -t guestbook:1.0 .
docker images guestbook
docker history guestbook:1.0            # one layer per instruction
```

**Show layer caching:** change some text in `server.js` (or `public/index.html`) and build again:

```bash
docker build -t guestbook:1.1 .
```

The `npm ci` step says `CACHED`: only the last `COPY` layer was rebuilt.
Question: what would happen if `COPY . .` came *before* `npm ci`?

## Step 5: The whole stack with Compose

`compose.yaml` adds our app to the stack. `build: .` tells Compose to build
the image from the Dockerfile in this folder.

```bash
docker compose up -d --build
docker compose ps                       # look for (healthy)
docker compose logs -f app
```

- App: http://localhost:3000. The info bar shows a container ID now, and DB host `mongodb`
- mongo-express: http://localhost:8081

**Observability corner:**

```bash
docker compose ps                       # health status from HEALTHCHECK
docker stats                            # live CPU / memory per container
docker inspect --format '{{json .State.Health}}' 03-guestbook-app-app-1
docker compose logs -f                  # all services, colour-coded
```

## Step 6: Push the image to a registry

See [demo 02](../02-my-first-image/README.md#push-to-a-registry) for the
commands (Docker Hub or a local `registry:2`). Replace `my-website` with
`guestbook`.

Then have a look at `.github/workflows/docker-image.yml`. This is what CI does
for you on every commit: checkout → login → build → push. A server then only
needs `docker compose pull && docker compose up -d` to deploy the new version.

## Step 7: Volumes

Sign the guestbook a few times, then:

```bash
docker compose down                     # containers removed...
docker compose up -d                    # ...and recreated
```

Messages are **still there**, because `compose.yaml` mounts the named volume
`db-data` at `/data/db`.

```bash
docker volume ls
docker volume inspect 03-guestbook-app_db-data
```

Now the destructive version:

```bash
docker compose down -v                  # -v also deletes the volumes
docker compose up -d
```

Messages are **gone**. The three volume types (slides 205–217):

```bash
-v /home/mount/data:/data/db            # host (bind) mount: you choose the host folder
-v /data/db                             # anonymous volume: Docker picks a random folder
-v db-data:/data/db                     # named volume: Docker manages it, you name it ✅
```

## Debugging scenario: "it works on my machine"

Run the app image on its own, without telling it where the DB is:

```bash
docker compose up -d mongodb
docker run -d --name broken -p 3001:3000 guestbook:1.0
```

Open http://localhost:3001: the page loads but shows "Database not reachable".
Debug it:

```bash
docker ps                               # after ~30s: (unhealthy)
docker logs broken                      # "MongoDB host: localhost"
curl localhost:3001/health              # "connect ECONNREFUSED 127.0.0.1:27017"
docker exec -it broken sh
  env | grep MONGO                      # nothing set → app defaults to localhost
  exit
```

> **`localhost` inside a container means the container itself**, not your
> laptop and not the other containers. Containers find each other by name on
> a shared network.

Fix: put it on the Compose network and point it at the `mongodb` service:

```bash
docker rm -f broken
docker run -d --name fixed -p 3001:3000 \
  --network 03-guestbook-app_default \
  -e MONGO_DB_HOST=mongodb \
  guestbook:1.0
docker rm -f fixed
```

## Clean up everything

```bash
docker compose down -v
docker image rm guestbook:1.0 guestbook:1.1
```
