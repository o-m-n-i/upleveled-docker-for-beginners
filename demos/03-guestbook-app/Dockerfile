# Each instruction below creates a layer. Docker caches layers, so we put the
# things that change least (base image, dependencies) first and our source
# code (changes most) last.

# 1. Start from an official base image: Alpine Linux + Node.js 22
FROM node:22-alpine

# 2. All following commands run inside this folder (created if missing)
WORKDIR /home/app

# 3. Copy only the dependency manifests first...
COPY package.json package-lock.json ./

# 4. ...and install. This layer is reused from cache until package*.json changes.
RUN npm ci --omit=dev

# 5. Now copy the rest of the source code (see .dockerignore for what's skipped)
COPY . .

# 6. Default config. Never bake passwords into an image: pass them at runtime
#    with `docker run -e ...` or the `environment:` block in compose.yaml.
ENV PORT=3000

# 7. Documentation: the app listens on 3000. Publishing still needs `-p`.
EXPOSE 3000

# 8. Don't run as root inside the container
USER node

# 9. Let Docker check the app is actually healthy, not just "running"
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# 10. The command that starts the container
CMD ["node", "server.js"]
