# Docker for Beginners: UpLeveled guest lecture

Demo code for the *Docker for Beginners* session at UpLeveled.

| Folder | What |
| --- | --- |
| [CHEATSHEET.md](CHEATSHEET.md) | All commands from the lesson on one page |
| [demos/01-first-containers](demos/01-first-containers/README.md) | Mob exercise: hello-world, nginx, port mapping, logs, exec |
| [demos/02-my-first-image](demos/02-my-first-image/README.md) | 3-line Dockerfile, layers, tags, pushing to a registry |
| [demos/03-guestbook-app](demos/03-guestbook-app/README.md) | Node.js + MongoDB app: networks, Compose, Dockerfile, CI, volumes, debugging |

Each demo folder has a README with the commands, step by step.

## Before class

1. Install **Docker Desktop**: https://docs.docker.com/get-started/get-docker/
2. Start it and run `docker run hello-world` in a terminal
3. (Optional) Create a free **Docker Hub** account: https://hub.docker.com/signup
4. (Optional, for demo 03 step 3) Node.js 20+

## Tested with

Docker Engine 29.8, Docker Compose v5.5, macOS (Apple Silicon). Images used:
`hello-world`, `nginx:alpine`, `node:22-alpine`, `mongo:8`, `mongo-express:1`, `registry:2`.
