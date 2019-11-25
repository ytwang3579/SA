#!/bin/sh
#echo 'HI' >> /tmp/hi
echo "`date`: $UPLOAD_VUSER has upload file $1 with size $UPLOAD_SIZE" >> /var/log/uploadscript.log
