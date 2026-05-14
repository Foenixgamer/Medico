#!/bin/bash
# =============================================================================
# MedSecure - Script de Backup de PostgreSQL
# Capa 8: Backups cifrados con AES
# =============================================================================
# Mitiga: Pérdida de datos por desastre, violación de datos en backups
# Artículo HIPAA: 164.308(a)(7)(ii)(A) - Data Backup Plan
# =============================================================================
# Configuración
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-medsecure}"
DB_USER="${DB_USER:-medsecure_admin}"
DB_PASSWORD="${DB_PASSWORD}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

# Fecha del backup
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"

# Crear directorio de backups
mkdir -p "${BACKUP_DIR}"

# Verificar variables
if [ -z "$DB_PASSWORD" ]; then
    echo "ERROR: DB_PASSWORD no está configurada"
    exit 1
fi

if [ -z "$ENCRYPTION_KEY" ]; then
    echo "ERROR: BACKUP_ENCRYPTION_KEY no está configurada"
    exit 1
fi

echo "[Backup] Iniciando backup de ${DB_NAME}..."

# Realizar dump de PostgreSQL
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    --format=plain \
    > "${BACKUP_FILE}"

if [ $? -ne 0 ]; then
    echo "ERROR: Falló pg_dump"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Cifrar backup con AES-256-CBC
openssl enc -aes-256-cbc \
    -salt \
    -pbkdf2 \
    -iter 100000 \
    -in "${BACKUP_FILE}" \
    -out "${ENCRYPTED_FILE}" \
    -pass pass:"${ENCRYPTION_KEY}"

if [ $? -ne 0 ]; then
    echo "ERROR: Falló cifrado del backup"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Eliminar archivo plano
rm -f "${BACKUP_FILE}"

# Calcular tamaño y hash
FILESIZE=$(stat -c%s "${ENCRYPTED_FILE}")
SHA256=$(sha256sum "${ENCRYPTED_FILE}" | cut -d' ' -f1)

echo "[Backup] Backup completado: ${ENCRYPTED_FILE}"
echo "[Backup] Tamaño: ${FILESIZE} bytes"
echo "[Backup] SHA256: ${SHA256}"

# Limpiar backups antiguos
find "${BACKUP_DIR}" -name "*.enc" -type f -mtime +${RETENTION_DAYS} -delete
echo "[Backup] Backups con más de ${RETENTION_DAYS} días eliminados"

# Log
echo "[$(date)] BACKUP_OK file=${ENCRYPTED_FILE} size=${FILES_SIZE} sha256=${SHA256}" >> "${BACKUP_DIR}/backup.log"

exit 0
