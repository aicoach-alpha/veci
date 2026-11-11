#!/bin/sh
# Read-only VeCI modem evidence, intended for manual invocation on a real incident.
# Never resets LTE, changes SIM, reads identifiers or touches APN configuration.
set -u

printf 'epoch=%s\n' "$(date +%s)"
printf 'time='; date
printf 'lte_gateway='; ip -4 route show default dev usb0 | awk '/^default via /{print $3;exit}'

if ping -I usb0 -c 1 -W 2 192.168.7.1 >/dev/null 2>&1; then
  echo 'local_gateway=reachable'
else
  echo 'local_gateway=unreachable'
fi
for target in 1.1.1.1 8.8.8.8; do
  if ping -I usb0 -c 1 -W 2 "$target" >/dev/null 2>&1; then
    printf 'public_%s=reachable\n' "$target"
  else
    printf 'public_%s=unreachable\n' "$target"
  fi
done

# The selected ttyUSB function is verified for this router; never probe ttyUSB3.
port=/dev/ttyUSB2
if [ ! -c "$port" ]; then
  echo 'at_port=unavailable'
  exit 0
fi

( flock -n -x 9 || { echo 'at_lock=busy'; exit 0; }
  for cmd in 'AT+CGATT?' 'AT+CGACT?' 'AT+CEER'; do
    printf '\nquery=%s\n' "$cmd"
    /usr/sbin/we5927-at "$port" "$cmd" 1500 2>/dev/null || echo 'at_query=unavailable'
  done
) 9>/var/lock/we5927-at.lock
