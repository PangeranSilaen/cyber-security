ARG OMP_VERSION=3_3_0-12

FROM php:7.4-apache-bullseye AS builder
ARG OMP_VERSION

ENV DEBIAN_FRONTEND=noninteractive \
    COMPOSER_ALLOW_SUPERUSER=1

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    ca-certificates curl git unzip zip nodejs npm \
    libfreetype6-dev libjpeg62-turbo-dev libpng-dev \
    libicu-dev libxml2-dev libxslt1-dev libzip-dev libonig-dev zlib1g-dev \
 && docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install -j"$(nproc)" gd mysqli pdo_mysql intl mbstring xml xsl zip gettext opcache \
 && curl -fsSL https://getcomposer.org/installer -o /tmp/composer-setup.php \
 && php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /build

RUN git clone --depth 1 --branch "${OMP_VERSION}" https://github.com/pkp/omp.git /build \
 && git submodule update --init --recursive \
 && composer install --no-dev --optimize-autoloader --working-dir=/build/lib/pkp \
 && composer install --no-dev --optimize-autoloader --working-dir=/build/plugins/paymethod/paypal \
 && npm ci --prefix /build \
 && npm run build --prefix /build

FROM php:7.4-apache-bullseye

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    ca-certificates curl mariadb-client \
    libfreetype6 libjpeg62-turbo libpng16-16 libicu67 libxml2 libxslt1.1 libzip4 zlib1g \
 && a2enmod rewrite headers expires \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/bin/composer /usr/local/bin/composer
COPY --from=builder /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=builder /build /var/www/html

RUN docker-php-ext-enable gd mysqli pdo_mysql intl mbstring xml xsl zip gettext opcache

COPY php.ini /usr/local/etc/php/conf.d/zz-omp-local.ini
COPY apache-vhost.conf /etc/apache2/sites-available/000-default.conf
COPY entrypoint.sh /usr/local/bin/omp-entrypoint

RUN chmod +x /usr/local/bin/omp-entrypoint \
 && mkdir -p /var/www/files /var/www/local /var/log/apache2 \
 && chown -R www-data:www-data /var/www/html /var/www/files /var/www/local

WORKDIR /var/www/html
ENTRYPOINT ["omp-entrypoint"]
CMD ["apache2-foreground"]
