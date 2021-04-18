#!/bin/sh
### BEGIN INIT INFO
# Provides:          receipt.sh
# Required-Start:    $all
# Required-Stop:
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Run receipt
### END INIT INFO

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/opt/bin
PIDFILE=/var/run/receipt.pid
NODE_PATH=/usr/local/lib/node_modules
# Set JSPATH and LOGPATH to your own directories
JSPATH=~USER/receipt
LOGPATH=~USER

. /lib/init/vars.sh
. /lib/lsb/init-functions
# If you need to source some other scripts, do it here

case "$1" in
  start)
    log_begin_msg "Starting receipt service"
    start-stop-daemon --start --quiet --pidfile $PIDFILE --chdir $JSPATH --background --exec /usr/bin/node $JSPATH/receipt.js >> $LOGPATH/out.txt 2>> $LOGPATH/error.txt
    log_end_msg $?
    exit 0
    ;;
  stop)
    log_begin_msg "Stopping the coolest service ever unfortunately"
    start-stop-daemon --stop --quiet --retry=TERM/30/KILL/5 --pidfile $PIDFILE
    log_end_msg $?
    exit 0
    ;;
  *)
    echo "Usage: /etc/init.d/receipt.sh {start|stop}"
    exit 1
    ;;
esac
