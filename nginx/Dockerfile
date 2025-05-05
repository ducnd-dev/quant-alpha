FROM nginx:1.25-alpine

# Copy custom Nginx configuration
COPY ./nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

# Expose ports
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1