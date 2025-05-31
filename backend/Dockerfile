# Usa una imagen base oficial con PHP 8.1 y extensiones comunes para Laravel
FROM php:8.1-fpm

# Instala dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    curl \
    && docker-php-ext-install pdo pdo_mysql zip mbstring exif pcntl bcmath gd

# Instala Composer globalmente
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Establece directorio de trabajo
WORKDIR /var/www/html

# Copia archivos de la aplicación al contenedor
COPY . .

# Instala dependencias de PHP con composer, sin dev, optimizando autoload
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Genera la key de la aplicación (opcional, si ya tienes la APP_KEY en .env puedes saltarlo)
RUN php artisan key:generate

# Crea enlace simbólico para el storage
RUN php artisan storage:link

# Otorga permisos adecuados (puedes ajustar según tu configuración)
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Expone el puerto 9000 para PHP-FPM
EXPOSE 9000

# Inicia PHP-FPM
CMD ["php-fpm"]
