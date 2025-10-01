FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps \
 && npm install ajv@^8 ajv-keywords@^5 --legacy-peer-deps

COPY . .

RUN node node_modules/react-scripts/scripts/build.js

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
