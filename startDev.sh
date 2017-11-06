#!/bin/bash
code ./ &

openport=8000
check_avail_port() {
  result=$(lsof -i | grep LISTEN | grep :$openport)
  if [ -z "$result" ]
  then
    echo "$openport is available"
  else
    ((openport++))
    check_avail_port
  fi
}

check_avail_port

/opt/firefox-dev/firefox --devtools -P Test --new-window localhost:$openport &
python -m SimpleHTTPServer $openport
