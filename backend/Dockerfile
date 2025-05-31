FROM php:8.1-apache

# Instala dependencias necesarias para Laravel y composer
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    && docker-php-ext-install pdo_mysql zip mbstring exif pcntl bcmath xml

# Habilita mod_rewrite de apache
RUN a2enmod rewrite

# Instala composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copia el código Laravel
COPY . /var/www/html/

WORKDIR /var/www/html/

# Instala las dependencias composer sin dev y optimizando autoload
RUN composer install --no-dev --optimize-autoloader

# Genera la key de Laravel
RUN php artisan key:generate

# Cambia permisos (puedes ajustar según necesidad)
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Expone puerto 80 para apache
EXPOSE 80

CMD ["apache2-foreground"]
