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

# Copiar composer desde la imagen oficial
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copiar el código al contenedor
COPY . /var/www/html

# Cambiar el directorio de trabajo
WORKDIR /var/www/html

# Instalar dependencias PHP del proyecto con composer
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Enlazar storage (opcional, evita error si ya existe)
RUN php artisan storage:link || true

# Cambiar DocumentRoot para que Apache sirva desde /public
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf

# Ajustar permisos para Apache (lectura y escritura)
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public
RUN chmod -R 755 /var/www/html/public

# Exponer el puerto 80 para HTTP
EXPOSE 80

# Ejecutar migraciones y arrancar Apache
CMD ["bash", "-c", "php artisan migrate --force && apache2-foreground"]
