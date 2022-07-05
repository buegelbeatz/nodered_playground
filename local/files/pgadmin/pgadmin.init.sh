#!/usr/bin/env sh

# prepare the password file
# copy over the servers.json for left side treeview preparation
# take care with the '/var/lib/pgadmin/data/servers.initialized' flag that this is only done once.
# move the code over to a volume so that it could be manipulated on the fly.

PGADMIN_DATA_PATH="/var/lib/pgadmin/data"
if [ -f $PGADMIN_DATA_PATH/servers.initialized ];then
  echo "Initialization has been done in a previous run..."
  if [ -f $PGADMIN_DATA_PATH/servers.json ];then
    echo "remove the server.json file from the data folder..."
    rm $PGADMIN_DATA_PATH/servers.json 2>/dev/null
  fi
  exit 0
fi

echo "creating folder for passwordfile, create file and adjust permissions..."
mkdir -p -m 700 $PGADMIN_DATA_PATH/storage/admin@test.org 2>/dev/null
echo "oncox-postgres:5432:${POSTGRES_DB}:${POSTGRES_USER}:${POSTGRES_PASSWORD}" > $PGADMIN_DATA_PATH/storage/admin@test.org/pgpassfile 2>/dev/null
chmod 600 $PGADMIN_DATA_PATH/storage/admin@test.org/pgpassfile 2>/dev/null

echo "copy server.json template to the data folder..."
cat  ./pgadmin.servers.template.json | sed "s/POSTGRES_USER/${POSTGRES_USER}/g;s/POSTGRES_DB/${POSTGRES_DB}/g;" > $PGADMIN_DATA_PATH/servers.json 2>/dev/null
touch $PGADMIN_DATA_PATH/servers.initialized 2>/dev/null

echo "copy the pgadmin code from the readonly /pgadmin4 folder to some mounted folder..."
cp -fR /pgadmin4/. /pgadmin4-modified/
mv /pgadmin4-modified/config_local.py /pgadmin4-modified/config_local.py.bak 2>/dev/null
cp -f ./config_local.py /pgadmin4-modified/ 2>/dev/null
echo "...done";
exit 0
