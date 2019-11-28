#!/bin/sh

TYPE=$( file $1 | cut -d':' -f2 )
echo "`date`: $UPLOAD_VUSER has upload file $1 with size $TYPE" >> /var/log/uploadscript.log
