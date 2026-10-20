# The smallest useful Dockerfile: take the official nginx web server image
# and add our own web page on top of it. That's a new layer on a base image.
FROM nginx:alpine

COPY index.html /usr/share/nginx/html/index.html
