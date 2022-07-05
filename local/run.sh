#!/bin/bash

if [ ! -f .env ];then
  echo "Check .env file...create..."
  cp .env.template .env 2>/dev/null
  passwords=$(cat .env.template|sed 's/^ *\(.*_PASSWORD\)= *$/\1/')
  for password in $passwords;do
    sed -i "s/^$password= *\$/$password=$(gdate +%s.%N|md5|base64)/" .env
  done
  echo "######### .env #########"
  cat .env
  echo "########################"
  echo ""
else
  echo "Check .env file...OK"
fi

. .env

if [ "$1" == "cleanup" ];then
  echo "Cleanup local docker environment..."
  docker rm -f $(docker ps -aq) 2>/dev/null
  docker volume rm nodered_pgadmin4 nodered_pgadmin_data nodered_pgadmin_files nodered_postgres_data nodered_postgres_init nodered_mqtt_data 2>/dev/null
else
  echo "Try to stop previous started docker-compose..."
  docker-compose down 2>/dev/null
fi
echo "Copy data into docker context..."
docker container create --name nodered_init -v nodered_pgadmin_files:/pgadmin -v nodered_mqtt_data:/mqtt hello-world
docker cp ./files/pgadmin/. nodered_init:/pgadmin/
docker cp ./files/mqtt/. nodered_init:/mqtt/
docker rm nodered_init
echo "Init pgadmin, adjust permissions...run as root..."
docker run --name nodered_init \
  --entrypoint "" \
  --user root \
  -v nodered_pgadmin_files:/pgadmin \
  -v nodered_pgadmin4:/pgadmin4-modified \
  -v nodered_pgadmin_data:/var/lib/pgadmin/data \
  dpage/pgadmin4:5.2 \
  /bin/sh -c "chown -R 5050:5050 /pgadmin /pgadmin4-modified /var/lib/pgadmin/data"
docker rm nodered_init
echo "Init pgadmin, setup..."
docker run --name nodered_init \
  -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
  -e POSTGRES_USER=${POSTGRES_USER} \
  -e POSTGRES_DB=${POSTGRES_DB} \
  --entrypoint "" \
  -v nodered_pgadmin_files:/pgadmin \
  -v nodered_pgadmin4:/pgadmin4-modified \
  -v nodered_pgadmin_data:/var/lib/pgadmin/data \
  dpage/pgadmin4:5.2 \
  /bin/sh -c "cd /pgadmin;chmod 0755 *.sh;./pgadmin.init.sh"
docker rm nodered_init
echo "Init mqtt, setup..."
docker run --name nodered_init \
  -e MOSQUITTO_PASSWORD=${MOSQUITTO_PASSWORD} \
  --entrypoint "" \
  -v nodered_mqtt_data:/mosquitto \
  eclipse-mosquitto:2.0.14 \
  /bin/sh -c "cd /mosquitto;chmod 0755 *.sh;./mosquitto.init.sh"
docker rm nodered_init
echo "Start pgadmin + postgres ..."
echo "################################################"
echo "# pgadmin       http://localhost:5050          #"
echo "# postgraphile  http://localhost:5001/graphiql #"
echo "# mqtt ws       http://localhost:1884          #"
echo "# mqtt          http://localhost:1883          #"
echo "# mqtt pwd      '$(cat .env|grep MOSQUITTO_PASSWORD|sed 's/^[^=]*=//')'"
echo "# node RED      http://localhost:1880          #"
echo "################################################"
# TODO: To get pg_tools running in pgadmin4-context installation needs to be added: apk add --no-cache postgresql-client;
# docker-compose up --build 2>/dev/null 1>/dev/null &
docker-compose up --build
