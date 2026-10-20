# Demo 02: My first image

The smallest possible Dockerfile: the official `nginx:alpine` image plus one
layer with our own `index.html`. It shows **image vs container**,
**layers**, and **tags** before the bigger demo project.

## Build and run

```bash
cd demos/02-my-first-image

docker build -t my-website:1.0 .      # -t name:tag, "." = build context (this folder)
docker images my-website
docker run -d --name site -p 8080:80 my-website:1.0
```

Open http://localhost:8080.

## Layers

```bash
docker history my-website:1.0
```

The top line is our `COPY`. Everything below it comes from `nginx:alpine`,
which itself is built on `alpine` (slides 160–162). Pull another nginx-based
image later and Docker reuses those layers instead of downloading them again.

## New version = new tag

1. Edit `index.html` (change "Version 1.0" to "Version 2.0")
2. Rebuild with a new tag and run it next to the old one:

```bash
docker build -t my-website:2.0 .      # watch: the FROM layer is CACHED
docker run -d --name site2 -p 8081:80 my-website:2.0
```

http://localhost:8080 still shows 1.0, http://localhost:8081 shows 2.0.
Same image name, two tags, two containers. This is how you roll back: just
run the old tag.

## Push to a registry

**Option A: Docker Hub** (needs a free account)

```bash
docker login
docker tag my-website:1.0 <your-dockerhub-username>/my-website:1.0
docker push <your-dockerhub-username>/my-website:1.0
```

**Option B: your own private registry, running locally** (no account needed)

```bash
# Port 5001 because macOS uses 5000 for AirPlay
docker run -d --name registry -p 5001:5000 registry:2

docker tag my-website:1.0 localhost:5001/my-website:1.0
docker push localhost:5001/my-website:1.0
curl localhost:5001/v2/_catalog       # {"repositories":["my-website"]}
```

The image name tells Docker **where** to push: `registry/imageName:tag`
(slide 169). No registry in the name means Docker Hub (`docker.io/library/...`).

Prove it works by deleting the local copy and pulling it back:

```bash
docker image rm localhost:5001/my-website:1.0
docker pull localhost:5001/my-website:1.0
```

## Clean up

```bash
docker rm -f site site2 registry
```
