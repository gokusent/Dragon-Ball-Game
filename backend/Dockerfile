FROM php:8.2-apache

# Instalar dependencias necesarias del sistema y extensiones PHP
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \                  # ← Necesaria para PostgreSQL
    zip \
    curl \
    && docker-php-ext-install pdo_mysql pdo_pgsql zip mbstring exif pcntl bcmath xml

# Habilitar mod_rewrite de Apache
RUN a2enmod rewrite

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copiar el código
COPY . /var/www/html

WORKDIR /var/www/html

# Instalar dependencias PHP del proyecto
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Enlazar storage
RUN php artisan storage:link || true

# Permisos correctos para Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Exponer puerto
EXPOSE 80

# Ejecutar migraciones y levantar apache
CMD ["bash", "-c", "php artisan migrate --force && apache2-foreground"]
