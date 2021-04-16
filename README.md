# receiptprinter

This is a node app and pile of utilities for hooking a thermal receipt printer up to a website, Azure queue, Google Home, and more. When you've got the receipt printer hooked up, you can use it for creating lists, creating task sheets, or just printing text receipts.

## Hardware

The canonical hardware setup is a raspberry pi running the source in this repo, and an Epson TM-T20II attached over USB. The Pi doesn't have to be very powerful -- any modern Pi from the last five years should work. The TM-T20II can be found on eBay for around $100 and uses standard thermal printer paper, which is extremely inexpensive.

## "Architecture" lol

The software has two operating modes:
1. **Direct**: If you're able to expose the Pi to the internet (and are comfortable doing so), it can expose a webpage and HTTP POST endpoint directly. Just point a browser to the webpage or an IFTTT integration to the endpoint.
2. **Queue**: If you're unable to expose the Pi directly, or feel safer with some indirection, the Pi can read from an Azure queue, which is populated by similar webpage software running on a cloud endpoint you configure.
