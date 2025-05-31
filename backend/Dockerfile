FROM php:8.2-apache

# Instalar dependencias del sistema y extensiones PHP necesarias
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    libssl-dev \                 # necesario para openssl
    && docker-php-ext-install pdo_mysql pdo_pgsql zip mbstring exif pcntl bcmath xml openssl \
    && a2enmod rewrite

# Instalar Composer manualmente
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Copiar el código al contenedor
COPY . /var/www/html

# Definir directorio de trabajo
WORKDIR /var/www/html

# Instalar dependencias PHP con Composer
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Generar clave APP_KEY (forzar para evitar problemas)
RUN php artisan key:generate --force

# Limpiar y cachear configuración para evitar errores de encrypter
RUN php artisan config:clear
RUN php artisan config:cache

# Enlazar storage (opcional, evita error si ya existe)
RUN php artisan storage:link || true

# Cambiar DocumentRoot para que Apache sirva desde /public
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf

# Ajustar permisos para Apache (lectura y escritura)
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public \
    && chmod -R 755 /var/www/html/public

# Exponer puerto 80 para HTTP
EXPOSE 80

# Ejecutar migraciones y arrancar Apache en primer plano
CMD ["bash", "-c", "php artisan migrate --force && apache2-foreground"]
