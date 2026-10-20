# Docker cheat sheet

## Words

| Term | Meaning |
| --- | --- |
| **Image** | Read-only blueprint: app + dependencies + config, built in layers |
| **Container** | A running (or stopped) instance of an image. Many containers can come from one image |
| **Layer** | One step of an image build. Layers are cached and shared between images |
| **Tag** | A version label: `nginx:1.27`, `my-app:2.0`. No tag = `latest` |
| **Registry** | Where images are stored: Docker Hub (public), GHCR, AWS ECR, or private |
| **Dockerfile** | Text recipe for building an image |
| **Compose** | Run several containers together from one `compose.yaml` |
| **Volume** | Storage that outlives a container (databases!) |

Image name format: `registry/name:tag`, e.g. `docker.io/library/mongo:8`.

## Running containers

```bash
docker run hello-world                    # pull (if needed) + create + start
docker run -d nginx                       # -d: detached (background)
docker run -d --name web nginx            # give it a name
docker run -d -p 8080:80 nginx            # -p HOST:CONTAINER port mapping
docker run -d -e KEY=value nginx          # environment variable
docker run -d -v data:/data/db mongo      # named volume
docker run --rm -it alpine sh             # throwaway interactive container
```

## Managing containers

```bash
docker ps                                 # running containers
docker ps -a                              # all, including stopped
docker stop web                           # stop (container still exists)
docker start web                          # start it again
docker rm web                             # remove a stopped container
docker rm -f web                          # stop + remove
docker container prune                    # remove ALL stopped containers (every project!)
```

## Debugging

```bash
docker logs web                           # output of the container
docker logs -f web                        # follow live
docker exec -it web sh                    # open a shell inside (bash if available)
docker inspect web                        # all details as JSON
docker stats                              # live CPU / memory usage
```

## Images

```bash
docker images                             # local images
docker pull mongo:8                       # download without running
docker build -t my-app:1.0 .              # build from ./Dockerfile
docker history my-app:1.0                 # show layers
docker tag my-app:1.0 user/my-app:1.0     # add another name
docker login                              # log in to Docker Hub
docker push user/my-app:1.0               # upload to a registry
docker image rm my-app:1.0                # delete locally
```

## Compose

```bash
docker compose up -d                      # start everything in compose.yaml
docker compose up -d --build              # rebuild images first
docker compose ps                         # status
docker compose logs -f app                # logs of one service
docker compose down                       # stop + remove containers + network
docker compose down -v                    # ...and volumes (deletes data!)
```

## Dockerfile basics

```dockerfile
FROM node:22-alpine               # base image
WORKDIR /home/app                 # working directory (created if missing)
COPY package*.json ./             # copy dependency files first (caching!)
RUN npm ci                        # run a command at BUILD time
COPY . .                          # then copy the rest of the code
ENV PORT=3000                     # default environment variable (no secrets!)
EXPOSE 3000                       # documents the port
CMD ["node", "server.js"]         # command at RUN time
```

## Gotchas

- **`localhost` inside a container is the container itself.** Use the
  container/service name on a shared network instead (`mongodb:27017`).
- **Port already allocated?** Another container or app uses that host port. Pick another: `-p 8082:80`.
- **Data gone after `docker rm`?** Without a volume, data lives only as long as the container.
- **Changed code but nothing happened?** Rebuild the image (`docker compose up -d --build`).
- **Mac port 5000 busy?** That's AirPlay Receiver. Use 5001.
