# receiptprinter

This is a node app and pile of utilities for hooking a thermal receipt printer up to a website, Azure queue, Google Home, and more. When you've got the receipt printer hooked up, you can use it for creating lists, creating task sheets, or just printing text receipts.

## Hardware

The canonical hardware setup is a raspberry pi running the source in this repo, and an Epson TM-T20II attached over USB. The Pi doesn't have to be very powerful -- any modern Pi from the last five years should work. The TM-T20II can be found on eBay for around $100 and uses standard thermal printer paper, which is extremely inexpensive.

Other printers may work but I've only tried the TM-T20II.

## "Architecture" lol

This project includes a single Node.js app that runs on a raspi and sends properly-formatted text messages to a USB-connected Epson printer.

There are two ways for the Node.js app to get your text strings to print:
1. **Direct** (*enabled by default*): If you're able to expose the Pi to the internet (and are comfortable doing so), it can expose a webpage and HTTP POST endpoint directly. Just point a browser to the webpage or an IFTTT integration to the endpoint.
2. **Remote** (*enabled with connection string*): If you're unable to expose the Pi directly, or feel safer with some indirection, you can run an included Node app on an internet-facing website, which adds text items to print into a queue, which is monitored by the Pi.

In addition to the core printing functionality, the repo includes some useful utilities:
- An **init.d** script to start the printer code on boot
- A **"quotes" sample** with example contents and curl string to print memorable quotes
- Tools to **restart** the raspi and **reload the printer's code from git**

## Setup

1. Clone this project into a user directory on your raspi
2. Edit `receipt.js`, `init.d/receipt.sh` and replace any ALL_CAPS text with your own
3. `npm install`
4. Copy `init.d/receipt.sh` to `/etc/init.d` and link in from init levels
5. If using **remote** mode,
    1. Log in to https://portal.azure.com and create an Azure Storage account, and get your connection string
    2. Rename `remotesite/QUEUENAME` to your own name (e.g. `remotesite/home`)
    3. Edit `remotesite/app.js` and replace an ALL_CAPS text with your own
    4. `npm install`
    5. Publish everything in the `remotesite/` directory to your internet-facing website
6. If you want **reload/restart** functionality, cd into `restart` and `make restart`
    - You may also need to edit `reload.sh` to make it work

## Routes

| Path | Description |
|---|---|
| `GET http://PI_HOSTNAME/receipt` | Webpage with text form to print |
| `POST http://PI_HOSTNAME/receipt` | Post text to print |
| `POST http://PI_HOSTNAME/receipt/ifttt` | Endpoint for posting text from IFTTT to print |
| `POST http://PI_HOSTNAME/receipt/today` | Print receipt with today's date formatted across a bunch of lines |
| `POST http://PI_HOSTNAME/receipt/quote` | Load a random quote from `quotes/quotes.txt` and print it |
| `POST http://PI_HOSTNAME/receipt/reload` | `git pull` and restart pi |
| `POST http://PI_HOSTNAME/receipt/restart` | restart pi |
| `GET http://REMOTE_SITE/receipt/QUEUENAME` | Webpage with text form to enqueue to QUEUENAME |
| `POST http://REMOTE_SITE/receipt/queue/QUEUENAME` | Post text to enqueue to QUEUENAME |
| `POST http://REMOTE_SITE/receipt/queue/QUEUENAME/ifttt` | Endpoint for posting text from IFTTT to print |

## Manifest

| File | Description |
|---|---|
| `init.d/recipt.sh` | init.d script to start Node.js app |
| `restart/` | Utility to restart the host OS remotely, if you want that |
| `remotesite/` | Standalone website to run on cloud host to queue up text snips for non-NAT printer |
| `remotesite/app.js` | Node.js server app |
| `remotesite/web.config` | IISNode for running on Azure Web Apps |
| `remotesite/QUEUENAME` | Webpage to post to queue called `QUEUENAME` |
| `web/` | Webpage exposed by Node.js app to accept text to print |
| `quotes/` | Example illustrating how to print quotes with curl |
| `receipt.js` | Node.js app to print to pi |
| `reload.sh` | Script to reload source code from git and restart for headless operation |

