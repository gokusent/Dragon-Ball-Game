FROM php:8.2-apache

# Instalar dependencias necesarias del sistema y extensiones PHP
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    curl \
    && docker-php-ext-install pdo_mysql pdo_pgsql zip mbstring exif pcntl bcmath xml

# Habilitar mod_rewrite de Apache
RUN a2enmod rewrite

# Evitar warning Apache ServerName
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copiar el código
COPY . /var/www/html

WORKDIR /var/www/html

# Instalar dependencias PHP del proyecto
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Limpiar cache Laravel para evitar problemas con configuración antigua
RUN php artisan config:clear && php artisan cache:clear && php artisan route:clear

# Enlazar storage (en caso que falte)
RUN php artisan storage:link || true

# Ajustar permisos (muy importante)
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Exponer puerto 80
EXPOSE 80

# Comando para correr migraciones y arrancar Apache
CMD ["bash", "-c", "php artisan migrate --force && apache2-foreground"]
