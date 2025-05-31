FROM php:8.2-apache

RUN composer install --no-dev --optimize-autoloader \
    && php artisan key:generate
