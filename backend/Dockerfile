FROM php:8.2-apache

# Instalar dependencias del sistema y extensiones PHP necesarias
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

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copiar el código fuente al contenedor
COPY . /var/www/html

WORKDIR /var/www/html

# Instalar dependencias PHP del proyecto
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Crear enlace simbólico para storage (si no existe)
RUN php artisan storage:link || true

# Ajustar permisos para storage y cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Exponer puerto 80 para Apache
EXPOSE 80

# Ejecutar migraciones y arrancar Apache en primer plano
CMD php artisan migrate --force && apache2-foreground
