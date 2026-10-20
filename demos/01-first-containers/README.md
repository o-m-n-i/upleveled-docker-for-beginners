# Demo 01: First containers (mob exercise)

**Format:** mob programming. One student shares their screen and types (the
*driver*), everyone else tells them what to type (the *navigators*). Swap
the driver every ~7 minutes or at each ✋ checkpoint.

**Prerequisite:** Docker Desktop installed and running (whale icon in the menu bar / system tray).

---

## Part A: Docker Desktop tour (3 min)

Open Docker Desktop and look at the left sidebar:

- **Containers:** running and stopped containers
- **Images:** images downloaded or built on this machine
- **Volumes:** persistent data (we'll get to this later)
- **Docker Hub search** (top bar): look up `nginx` and point out *Docker Official Image*

---

## Part B: Hello World (5 min)

```bash
docker --version
docker run hello-world
```

Read the output together. It explains exactly what happened:

1. The Docker **client** (your terminal) talked to the Docker **daemon** (engine)
2. The daemon didn't have the image, so it **pulled** it from Docker Hub
3. The daemon **created a container** from the image and ran it
4. The output streamed back to your terminal, and the container **exited**

```bash
docker ps        # nothing! The container already finished
docker ps -a     # -a = all, including stopped containers
docker images    # the hello-world image is now stored locally
```

Run `docker run hello-world` a second time. It's faster because there's no pull. ✋

---

## Part C: A container that keeps running (10 min)

```bash
docker pull nginx:alpine          # download only, don't run yet
docker images                     # image name + TAG (version)

docker run nginx:alpine           # runs in the FOREGROUND, blocks your terminal
# Ctrl+C to stop it
```

Run it in the background (**d**etached) and give it a name:

```bash
docker run -d --name web nginx:alpine
docker ps
```

Open http://localhost:80 ... **it doesn't work.** Why? ✋

> The container has its own network. nginx listens on port 80 *inside* the
> container, but nothing on your laptop is connected to it.

### Port mapping: `-p HOST:CONTAINER`

```bash
docker stop web
docker rm web                     # remove the stopped container (name is free again)

docker run -d --name web -p 8080:80 nginx:alpine
```

Open http://localhost:8080. Welcome to nginx! 🎉

Now run a **second** nginx on a different host port:

```bash
docker run -d --name web2 -p 8081:80 nginx:alpine
docker ps                         # look at the PORTS column
```

What happens if you try `-p 8080:80` again for a third container? ✋

> `port is already allocated`. Many containers can use the same *container*
> port (80), but each *host* port can only be used once (slides 99–104).

---

## Part D: Looking inside: logs and exec (10 min)

```bash
docker logs web                   # refresh localhost:8080 a few times, run again
docker logs -f web                # follow (live tail). Ctrl+C to stop following
```

Open a shell **inside** the running container:

```bash
docker exec -it web sh            # -i interactive, -t terminal
```

Inside the container:

```bash
ls /                              # its own (virtual) file system
cat /etc/os-release               # Alpine Linux, even if you're on macOS or Windows!
hostname                          # the container ID
cd /usr/share/nginx/html
echo '<h1>Hello UpLeveled! 👋</h1>' > index.html
exit
```

Refresh http://localhost:8080: the page changed. ✋

Now break it and recover:

```bash
docker stop web
docker start web                  # same container, your edit is still there
docker rm -f web                  # -f = stop + remove in one go
docker run -d --name web -p 8080:80 nginx:alpine
```

Refresh: **your edit is gone.** Why? ✋

> A new container starts fresh from the image. Changes inside a container
> live only as long as that container. To keep data you need **volumes**
> (end of the lesson), to keep code changes you need a **Dockerfile** (next).

---

## Part E: Clean up

```bash
docker rm -f web web2
docker ps -a
docker container prune            # remove all stopped containers
```

## Bonus (if the group is fast)

```bash
docker stats                      # live CPU / memory per container (observability!)
docker inspect web                # everything Docker knows about a container (JSON)
docker run -d -p 8080:80 -v "$(pwd)":/usr/share/nginx/html:ro nginx:alpine
# ^ serve the current folder with nginx (a bind mount). Edit a file, refresh.
```
