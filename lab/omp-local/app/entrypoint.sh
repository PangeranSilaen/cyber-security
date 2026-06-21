#!/usr/bin/env bash
set -euo pipefail

APP_ROOT=/var/www/html
STATE_DIR=/var/www/local
CONF_TEMPLATE="$APP_ROOT/config.TEMPLATE.inc.php"
CONF_PERSISTED="$STATE_DIR/config.inc.php"
CONF_ACTIVE="$APP_ROOT/config.inc.php"

wait_for_db() {
  local retries=60
  until mysqladmin ping -h"${DB_HOST}" -u"${DB_USER}" -p"${DB_PASSWORD}" --silent >/dev/null 2>&1; do
    retries=$((retries - 1))
    if [ "$retries" -le 0 ]; then
      echo "Database did not become ready in time" >&2
      return 1
    fi
    sleep 2
  done
}

seed_config() {
  mkdir -p "$STATE_DIR" /var/www/files /var/www/html/public

  if [ ! -f "$CONF_PERSISTED" ]; then
    cp "$CONF_TEMPLATE" "$CONF_PERSISTED"
  fi

  cp "$CONF_PERSISTED" "$CONF_ACTIVE"

  sed -i \
    -e 's#^base_url = ".*"#base_url = "'"${OMP_BASE_URL}"'"#' \
    -e 's#^driver = .*#driver = mysqli#' \
    -e 's#^host = .*#host = '"${DB_HOST}"'#' \
    -e 's#^username = .*#username = '"${DB_USER}"'#' \
    -e 's#^password = .*#password = '"${DB_PASSWORD}"'#' \
    -e 's#^name = .*#name = '"${DB_NAME}"'#' \
    -e 's#^files_dir = .*#files_dir = /var/www/files#' \
    -e 's#^public_files_dir = .*#public_files_dir = public#' \
    -e 's#^restful_urls = Off#restful_urls = On#' \
    -e 's#^enable_beacon = On#enable_beacon = Off#' \
    -e 's#^force_ssl = Off#force_ssl = Off#' \
    -e 's#^allow_url_fopen = Off#allow_url_fopen = On#' \
    -e "s#^allowed_hosts = .*#allowed_hosts = ''#" \
    "$CONF_ACTIVE"

  chown www-data:www-data "$CONF_ACTIVE"
  chown -R www-data:www-data /var/www/files /var/www/html/public /var/www/local
}

auto_install_if_needed() {
  if ! grep -q '^installed = Off' "$CONF_ACTIVE"; then
    cp "$CONF_ACTIVE" "$CONF_PERSISTED"
    return 0
  fi

  apache2ctl -D FOREGROUND &
  local apache_pid=$!
  trap 'kill ${apache_pid} >/dev/null 2>&1 || true' EXIT

  local retries=60
  until curl -fsS http://127.0.0.1/index/install/install >/dev/null 2>&1; do
    retries=$((retries - 1))
    if [ "$retries" -le 0 ]; then
      echo "Local OMP installer endpoint did not become ready" >&2
      return 1
    fi
    sleep 2
  done

  curl -fsS "http://127.0.0.1/index/install/install" \
    --data-urlencode "installing=0" \
    --data-urlencode "adminUsername=${OMP_ADMIN_USER}" \
    --data-urlencode "adminPassword=${OMP_ADMIN_PASSWORD}" \
    --data-urlencode "adminPassword2=${OMP_ADMIN_PASSWORD}" \
    --data-urlencode "adminEmail=${OMP_ADMIN_EMAIL}" \
    --data-urlencode "locale=en_US" \
    --data-urlencode "additionalLocales[]=en_US" \
    --data-urlencode "clientCharset=utf-8" \
    --data-urlencode "connectionCharset=utf8" \
    --data-urlencode "databaseCharset=utf8" \
    --data-urlencode "filesDir=/var/www/files" \
    --data-urlencode "databaseDriver=mysqli" \
    --data-urlencode "databaseHost=${DB_HOST}" \
    --data-urlencode "databaseUsername=${DB_USER}" \
    --data-urlencode "databasePassword=${DB_PASSWORD}" \
    --data-urlencode "databaseName=${DB_NAME}" \
    --data-urlencode "oaiRepositoryId=localhost" \
    --data-urlencode "enableBeacon=0" \
    >/tmp/omp-install-response.html

  sleep 3
  cp "$CONF_ACTIVE" "$CONF_PERSISTED"

  kill "$apache_pid" >/dev/null 2>&1 || true
  wait "$apache_pid" || true
  trap - EXIT
}

wait_for_db
seed_config
auto_install_if_needed

exec "$@"
