#!/bin/sh

# Add git login details here if required
git checkout -- .
git pull
cp init.d/receipt.sh /etc/init.d/receipt.sh
./restart