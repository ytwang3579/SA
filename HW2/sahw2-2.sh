#!/bin/sh

trap "echo 'trapped!!!!'; exit -1" 1 2 3
while true; do
	CHOOSE=$(dialog --title "SYS INFO" --menu "" 15 50 6 \
		"1" "CPU INFO" \
		"2" "MEMORY INFO" \
		"3" "NETWORK INFO" \
		"4" "FILE BROWSER" \
		"5" "CPU USAGE"\
		"6" "STUDENT ID"\
		3>&1 1>&2 2>&3)
	EXIT=$?
	

	if [ $EXIT = 0 ]; then
		echo "You choose option: $CHOOSE"
		case $CHOOSE in
			1)
				FLAG=""
				MSG=$(sysctl -a | grep -E '^hw.(model:|machine:|ncpu:)' | awk -F: '{\
					if( $1 ~ /^hw.model/ ) CPU_MODEL=$2;\
					if( $1 ~ /^hw.machine/ ) CPU_MACHINE=$2;\
					if( $1 ~ /^hw.ncpu/ ) CPU_CORE=$2}\
				END{printf "CPU Info\n\nCPU Model="CPU_MODEL"\nCPU Machine="CPU_MACHINE"\nCPU Core="CPU_CORE"\n"}')
				dialog --title "" --msgbox "$MSG" 10 60;
				;;
			2)
				FLAG=""
				while true; do
				MSG=$(sysctl -a | grep -E '^vm.kmem_(map_free:|map_size:|size:)' | awk -F: 'BEGIN{\
				FREECNT=0; USEDCNT=0; TOTALCNT=0;\
				SIZE[0]=" B"; SIZE[1]=" KB"; SIZE[2]=" MB"; SIZE[3]=" GB"; SIZE[4]=" TB";}\
				{if( $1 ~ /^vm.kmem_map_free/ ) FREE=$2; while ( FREE > 1024 ) {FREE=FREE/1024; FREECNT++;}\
				 if( $1 ~ /^vm.kmem_map_size/ ) {USED=$2;UB=$2} while ( USED > 1024 ) {USED=USED/1024; USEDCNT++;}\
				 if( $1 ~ /^vm.kmem_size/ ) {TOTAL=$2;UT=$2} while ( TOTAL > 1024 ) {TOTAL=TOTAL/1024; TOTALCNT++;}}\
				END{printf "Memory Info & Usage\n\nTotal: "TOTAL SIZE[TOTALCNT]"\nUsed: "USED SIZE[USEDCNT]"\nFree: "FREE SIZE[FREECNT]"\n%.0g",(100*UB/UT)}')
				PERCENT=$(printf "$MSG" | grep ^[0-9])
				MSG=$(printf "$MSG" | grep -E '^$|^[^0-9]')
				dialog --timeout 1 --mixedgauge "$MSG" 15 60 $PERCENT 
				
				read -t 1 key
				VALID=$?
				if [ $VALID = 0 ]; then break; fi
				
				done
				
				;;
			3)
				FLAG=""
				while true; do
				DEVICES=$(ifconfig | grep -E 'flags' | awk -F: '{print $1" "++cnt}')
				echo "$DEVICES"
				N=$(printf "$DEVICES\n" | wc -l)
				
				CHOOSE_DEVICE=$(dialog --title "" --menu "Network Interfaces" 10 60 $N $DEVICES 3>&1 1>&2 2>&3)
				EXIT=$?
				if [ $EXIT = 0 ]; then
					MSG=$(ifconfig $CHOOSE_DEVICE | grep -E 'inet |ether' | awk '{\
					if( $1 ~ /^ether/   ) MAC=$2;\
					if( $1 ~ /^inet/    ) IPV4=$2;\
					if( $3 ~ /^netmask/ ) NETMASK=$4}\
					END{printf "IPv4___: "IPV4"\nNetmask: "NETMASK"\nMac____: "MAC}')
					
					MSG=$(printf "Interface Name: $CHOOSE_DEVICE \n\n$MSG")
					dialog --title "" --msgbox "$MSG" 10 60;
					
				else
					break
				fi
				done
				
				;;
			4)
				FLAG=""
				while true; do
					FILES=$(ls -a | xargs file --mime-type | awk '{printf $1"\t"$2;\
						for(i=3;i<NF;i++) printf "_"$i; printf "\n"}')
					N=$(printf "$FILES\n" | wc -l)
					
					
					#exit 0
					CHOOSE=$(dialog --title "" --menu "File Browser: `pwd`" 30 100 $N $FILES 3>&1 1>&2 2>&3)
					EXIT=$?

					if [ $EXIT = 0 ]; then
						TYPE=$(printf "$FILES" | grep -E "^$CHOOSE" | cut -f2)
						CHOOSE=$(echo $CHOOSE | tr -d ":")
						case $TYPE in
							"inode/directory"*)
								cd $CHOOSE
								;;
							"text/"*)
								while true; do
								INFO=$(file -b $CHOOSE)
								SIZE=$(ls -l $CHOOSE | awk '{cnt=0;\
						SIZE[0]=" B"; SIZE[1]=" KB"; SIZE[2]=" MB"; SIZE[3]=" GB"; SIZE[4]=" TB";\
						FSIZE=$5; while( FSIZE > 1024 ) {FSIZE/=1024; cnt++;} printf FSIZE SIZE[cnt]}')

						MSG=$(printf "<File Name>: $CHOOSE\n\n<File Info>: $INFO\n\n<File Size>: $SIZE\n")
						dialog --yes-label 'OK' --no-label 'Edit' --yesno "$MSG" 10 60
								EXIT=$?
								if [ $EXIT = 1 ]; then
									$EDITOR $CHOOSE
									
								else
									break
								fi
								done
								;;
							*)
								while true; do
								INFO=$(file -b $CHOOSE)
								SIZE=$(ls -l $CHOOSE | awk '{cnt=0;\
						SIZE[0]=" B"; SIZE[1]=" KB"; SIZE[2]=" MB"; SIZE[3]=" GB"; SIZE[4]=" TB";\
						FSIZE=$5; while( FSIZE > 1024 ) {FSIZE/=1024; cnt++;} printf FSIZE SIZE[cnt]}')
								ACCESSTIME=$(stat -f %Sa $CHOOSE)	
						MSG=$(printf "<File Name>: $CHOOSE\n\n<File Info>: $INFO\n\n<File Size>: $SIZE\n\n<Access Time>: $ACCESSTIME")
								dialog --yes-label 'OK' --no-label 'touch' --yesno "$MSG" 12 60
								EXIT=$?
								if [ $EXIT = 1 ]; then
									touch $CHOOSE
								else
									break
								fi
								done
								;;
						esac
						
					else
						break
					fi
				done
				;;
			5)
				while true; do
				if [ "$FLAG" = "" ]; then
					FLAG=1
					
				MSG=$(top -P | grep ^CPU | awk 'BEGIN{USED=0; printf "CPU Loading\n\n";}\
				{printf $1" "$2" USER: %04.1f%%%% SYST: %04.1f%%%% IDLE: %04.1f%%%%\n",$3,($5+$7+$9),$11; USED+=($3+$5+$7+$9)/4;}\
				END{printf "%.0g",USED}')
				PERCENT=$(printf "$MSG" | grep ^[0-9])
				MSG=$(printf "$MSG" | grep -E '^$|^[^0-9]')
				dialog --timeout 1 --mixedgauge "$MSG" 15 60 $PERCENT;
				fi

				dialog --timeout 1 --mixedgauge "$MSG" 15 60 $PERCENT 
				MSG=$(top -d 2 -P | grep ^CPU | awk 'BEGIN{cnt=0; USED=0; printf "CPU Loading\n\n";}\
				{cnt++; if(cnt>4){printf $1" "$2" USER: %04.1f%%%% SYST: %04.1f%%%% IDLE: %04.1f%%%%\n",$3,($5+$7+$9),$11; USED+=($3+$5+$7+$9)/4;}}\
				END{printf "%.0g",USED}') 
				
				PERCENT=$(printf "$MSG" | grep ^[0-9])
				MSG=$(printf "$MSG" | grep -E '^$|^[^0-9]')

				read -t 3 key
				VALID=$?
				if [ $VALID = 0 ]; then break; fi
				
				done
				;;
			6)
				dialog --msgbox "A081056" 10 60
				EXIT=$?
				if [ $EXIT = 255 ]; then
					exit 0
				fi
				;;
			*)
				echo "Something went wrong QQ"
				exit -1
				;;
		esac
	else
		echo "You choose cancel, bye~"
		exit 0
	fi
done
