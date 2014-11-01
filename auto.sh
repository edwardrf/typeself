#!/bin/bash
node pictureOutNew.js "$1" 425 90
./typeself.sh
node nameOut.js "$2"
