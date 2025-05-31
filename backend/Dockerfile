# Usa una imagen oficial de PHP con Apache
FROM php:8.2-apache

# Instala extensiones necesarias para Laravel y MySQL
RUN apt-get update && apt-get install -y \
    libzip-dev zip unzip git curl libonig-dev libpng-dev libjpeg-dev libfreetype6-dev libxml2-dev \
    && docker-php-ext-install pdo_mysql zip mbstring exif pcntl bcmath gd xml

# Habilita mod_rewrite de Apache
RUN a2enmod rewrite

# Directorio de trabajo
WORKDIR /var/www/html

# Copia composer y código fuente
COPY . /var/www/html

# Copia el archivo .env para que Laravel tenga la configuración correcta en el contenedor
COPY .env /var/www/html/.env

# Instala dependencias PHP con Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --no-dev --optimize-autoloader

# Da permisos adecuados
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Limpia caches y configuración de Laravel para evitar problemas
RUN php artisan config:clear
RUN php artisan cache:clear
RUN php artisan route:clear

# Expone el puerto 80 para el servidor Apache
EXPOSE 80

# Ejecuta Apache en primer plano
CMD ["apache2-foreground"]
