# base-image for node on any machine using a template variable,
# see more about dockerfile templates here: https://www.balena.io/docs/learn/develop/dockerfile/#dockerfile-templates
# and about balena base images here: https://www.balena.io/docs/reference/base-images/base-images/
FROM node:14-alpine as base

# SQLite node package requires python?
RUN apk add --update --no-cache \
	g++ \
	git \
	make \
	python2 \
	curl \
	binutils \
	libgcc \
	libstdc++ \
	libuv \
	sqlite-libs \
	sqlite-dev

# Defines our working directory in container
WORKDIR /usr/src/app

# Copies the package.json first for better cache on later pushes
COPY package*.json ./

# This install npm dependencies on the balena build server,
# making sure to clean up the artifacts it creates in order to reduce the image size.
RUN JOBS=MAX npm ci --unsafe-perm --build-from-source --sqlite=/usr/lib && npm cache verify && rm -rf /tmp/*

# -- Build step --
FROM base as build
# This will copy all necessary files in our root to the working directory in the container
COPY server/ server/ client/
COPY .env.prod tsconfig*.json webpack.config.js ./
# Build dist
RUN npm run build

COPY ./static/ ./build/static/

# server.js will run when container starts up on the device
CMD ["npm", "start"]