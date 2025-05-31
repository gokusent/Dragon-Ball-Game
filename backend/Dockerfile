FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    build-essential \
    autoconf \
    pkg-config \
    curl \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    libssl-dev \
    && docker-php-ext-install pdo_mysql pdo_pgsql zip mbstring exif pcntl bcmath xml \
    && a2enmod rewrite

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

COPY . /var/www/html
WORKDIR /var/www/html

RUN composer install --no-interaction --prefer-dist --optimize-autoloader

RUN php artisan storage:link || true

RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public \
    && chmod -R 755 /var/www/html/public

EXPOSE 80

CMD ["bash", "-c", "php artisan config:clear && php artisan migrate --force && apache2-foreground"]
