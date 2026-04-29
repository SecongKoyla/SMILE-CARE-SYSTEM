# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# build React app
RUN npm run build


# ---- Runtime stage ----
FROM node:20-alpine

WORKDIR /app

# install lightweight static server
RUN npm install -g serve

# copy build output
COPY --from=build /app/dist ./dist

# expose your custom port
EXPOSE 8085

# serve the build folder on port 8085
CMD ["serve", "-s", "dist", "-l", "8085"]