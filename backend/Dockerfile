FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    && docker-php-ext-install pdo_mysql zip mbstring exif pcntl bcmath xml

RUN a2enmod rewrite

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY . /var/www/html/

WORKDIR /var/www/html/

# Cambiar DocumentRoot a public y permitir .htaccess
RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|g' /etc/apache2/sites-available/000-default.conf
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s|AllowOverride None|AllowOverride All|' /etc/apache2/apache2.conf

# Instalar dependencias composer sin dev, optimizando autoload
RUN php -d memory_limit=-1 /usr/bin/composer install --no-dev --optimize-autoloader

# Ejecutar migraciones sin confirmación (produce error si no hay cambios, pero es ok)
RUN php artisan migrate --force

# Crear enlace simbólico para storage
RUN php artisan storage:link

# Dar permisos adecuados
RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 80

CMD ["apache2-foreground"]
