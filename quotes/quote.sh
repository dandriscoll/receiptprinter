#!/bin/bash
# quote.sh
# Example script to pick a random quote from the file and print it out via a remote website
curl -X POST https://WEBSITE/receipt/print --data "`shuf -n 1 ~USER/receipt/quotes/quotes.txt`"$'\n\n\n\n'
