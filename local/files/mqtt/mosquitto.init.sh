#!/bin/sh

echo "prepare folder and files..."
mkdir -p /mosquitto/config /mosquitto/plugins /mosquitto/new_data /mosquitto/new_log 2>/dev/null
mv -f /mosquitto/mosquitto.conf /mosquitto/config/mosquitto.conf 2>/dev/null

cp -f /mosquitto-go-auth/go-auth.so /mosquitto/plugins/go-auth.so 2>/dev/null
echo "preparing password file ..."
rm -f /mosquitto/config/mosquitto.passwd 2>/dev/null
mosquitto_passwd -c -b /mosquitto/config/mosquitto.passwd "mosquitto" "${MOSQUITTO_PASSWORD}"

#/usr/sbin/mosquitto --verbose --config-file /mosquitto/config/mosquitto.conf
