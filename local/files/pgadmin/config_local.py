import os
SERVER_MODE = False
MASTER_PASSWORD_REQUIRED = False
ENHANCED_COOKIE_PROTECTION = False
DESKTOP_USER = 'admin@test.org'
UPGRADE_CHECK_ENABLED = True
DATA_DIR = '/var/lib/pgadmin/data'
_BASEDIR = '/var/lib/pgadmin/data'
LOG_FILE = os.path.join(_BASEDIR, 'pgadmin4.log')
SQLITE_PATH = os.path.join(_BASEDIR, 'sqlite.db')
STORAGE_DIR = os.path.join(_BASEDIR, 'storage')
SESSION_DB_PATH = os.path.join(_BASEDIR, 'sessions')
DEFAULT_BINARY_PATHS = {
    "pg":   "/usr/bin"
}
