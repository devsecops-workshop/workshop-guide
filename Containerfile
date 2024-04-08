FROM --platform=linux/amd64 klakegg/hugo:alpine-onbuild AS hugo

FROM --platform=linux/amd64 quay.io/nginx/nginx-unprivileged:alpine3.18
COPY --from=hugo /target /usr/share/nginx/html