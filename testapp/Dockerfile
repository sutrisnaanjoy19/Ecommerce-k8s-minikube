# Use a minimal Nginx image
FROM nginx:alpine

# Copy your HTML content into the Nginx web root
COPY src/index.html /usr/share/nginx/html/index.html

# Expose port 80 (Nginx default)
EXPOSE 80

# Nginx starts by default when the container runs
CMD ["nginx", "-g", "daemon off;"]