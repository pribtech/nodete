
commandRunner.COMMAND_SET["default"] = {
	CAUSE_HARDWARE_FAILURE: "rsh ?HOSTNAME? -l root ifconfig ib0 inet down;echo \"Bringing infiniband interface down\";",
	DB2CLUSTER_CLEAR_ALERTS: 'db2cluster -clear -alert -instance ?HOSTNAME?',
	FIX_HARDWARE_FAILURE: "rsh ?HOSTNAME? -l root ifconfig ib0 inet up;echo \"Restoring infiniband interface\";",
	FAIL_CF: "hostname | read HOSTNAME;whoami | read USER;ps -u $USER -f|grep \"ca-server -i ?HOSTID?\"|grep -v grep|while read junk PID junk; do echo \"Found CF, Performing kill:\"; echo \"kill -9 $PID\"; kill -9 $PID; echo \"CF terminated\";done;",
	FAIL_MEMBER: "hostname | read HOSTNAME;whoami | read USER;ps -u $USER -f|grep \"db2sysc ?HOSTID?\"|grep -v grep|while read junk PID junk; do echo \"Found DB2 member, Performing kill:\"; echo \"kill -9 $PID\"; kill -9 $PID; echo \"Member terminated\";done;",
	DB2_STOP_FORCE_MEMBER: "db2stop ?HOSTID? force",
	DB2_STOP_MEMBER: "db2stop ?HOSTID?",
	DB2_START_MEMBER: "db2start ?HOSTID?",
	DB2CLUSTER_CLEAR_ALERTS_MEMBER: "db2cluster -clear -alert -member ?HOSTID?",
	DB2_CF_MAKE_PRIMARY: "db2rocme 1 PRIMARY $USER 900 :$CF_ID :$HOST WRITEPLF",
	DB2CLUSTER_LIST_ALERTS: "db2cluster -list -alert",
	DB2CLUSTER_CLEAR_ALERTS: "db2cluster -clear -alert"
};