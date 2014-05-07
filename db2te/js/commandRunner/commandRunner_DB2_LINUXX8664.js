commandRunner.COMMAND_SET["DB2/LINUXX8664"] = {
	CAUSE_HARDWARE_FAILURE: "echo \"Bringing infiniband interface down\";echo \"\";rsh ?HOSTNAME? -l root /etc/init.d/network stop ib0;",
	FIX_HARDWARE_FAILURE: "echo \"Restoring infiniband interface\";echo \"\";rsh ?HOSTNAME? -l root /etc/init.d/network start ib0;",
};