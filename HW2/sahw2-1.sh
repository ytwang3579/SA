#!/bin/sh

ls -ARl | awk '/^d|^l|^-/' | sort -nk 5 | awk 'BEGIN{size=0; dir=0; file=0; cnt=0;} {cnt++; if(cnt<=7) print $5 " " $9; if($1~/^l/) dir++; if($1~/^-/) file++; size+=$5;} END{print "Link num: "dir; print "File num: "file; print "Total: "size}'
