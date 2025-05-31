FROM php:8.2-apache

# Instalar extensiones necesarias
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip unzip git curl \
    && docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copiar archivos del proyecto Laravel
COPY . /var/www/html

WORKDIR /var/www/html

# Dar permisos
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage

# Habilitar .htaccess y modificar Apache
RUN a2enmod rewrite
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf

# Instalar dependencias y comandos Laravel
RUN composer install --no-dev --optimize-autoloader \
    && php artisan key:generate \
    && php artisan migrate --force \
    && php artisan storage:link

EXPOSE 80

CMD ["apache2-foreground"]
