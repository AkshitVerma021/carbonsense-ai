FROM nginx:alpine

# Copy default.conf.template to nginx templates directory for environment variable substitution
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Copy application files to nginx public HTML directory
COPY . /usr/share/nginx/html

# Set default PORT environment variable if not provided (Cloud Run will override this)
ENV PORT=8080
