FROM node:alpine AS build
ARG BACKEND_HOSTNAME="localhost:5000"
ENV REACT_APP_BACKEND_HOSTNAME=${BACKEND_HOSTNAME}
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . ./
RUN npm run build

FROM nginx:alpine AS release
COPY --from=build /app/build /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]