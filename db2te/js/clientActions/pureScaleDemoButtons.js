/*******************************************************************************
 *Copyright IBM Corp. 2007 All rights reserved.
 *
 *Licensed under the Apache License, Version 2.0 (the "License");
 *you may not use this file except in compliance with the License.
 *You may obtain a copy of the License at
 *
 *	http://www.apache.org/licenses/LICENSE-2.0
 *
 *Unless required by applicable law or agreed to in writing, software
 *distributed under the License is distributed on an "AS IS" BASIS,
 *WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *See the License for the specific language governing permissions and
 *limitations under the License.
 *********************************************************************************/

alert("You have not configured the "+JS_BASE_DIRECTORY+"clientActions/pureScaleDemoButtons.js file");

var PURE_SCALE_DEMO_COMMAND = {
	hmc_host : "",
	hmc_user : "",
	hmc_password : "",
	hmc_command : "chhwres -r proc -m Server-9117-MMB-SN101BEBP -o a -p mem1 --procs 1; chhwres -r proc -m Server-9117-MMB-SN101BF0P -o a -p mem2 --procs 1;",
	hmc_reset : "lshwres -r proc -m Server-9117-MMB-SN101BEBP --level lpar --filter \"lpar_names=mem1\" | sed 's/lpar_name=([A-Za-z0-9]+),.*run_procs=([0-9]+).*/\\\\1 \\\\2/' -r | while read SYSTEM CPU; do CPU=$CPU; let CPU-=1 ; if [ $CPU -gt 0 ]; then chhwres -r proc -m Server-9117-MMB-SN101BEBP -o r -p $SYSTEM --procs $CPU; fi done;lshwres -r proc -m Server-9117-MMB-SN101BF0P --level lpar --filter \"lpar_names=mem2\" | sed 's/lpar_name=([A-Za-z0-9]+),.*run_procs=([0-9]+).*/\\\\1 \\\\2/' -r | while read SYSTEM CPU; do CPU=$CPU; let CPU-=1 ; if [ $CPU -gt 0 ]; then chhwres -r proc -m Server-9117-MMB-SN101BF0P -o r -p $SYSTEM --procs $CPU; fi done;lshwres -r proc -m Server-9117-MMB-SN101BEBP --level lpar --filter \"lpar_names=mem3\" | sed 's/lpar_name=([A-Za-z0-9]+),.*run_procs=([0-9]+).*/\\\\1 \\\\2/' -r | while read SYSTEM CPU; do CPU=$CPU; let CPU-=2 ; if [ $CPU -gt 0 ]; then chhwres -r proc -m Server-9117-MMB-SN101BEBP -o r -p $SYSTEM --procs $CPU; fi done;",
	
	stdw_host : "",
	stdw_user : "",
	stdw_password : "",
	stdw_key : "a",
	stdw_start_command : "/home/db2inst1/sdtw/t_sdtw/sdtw -d dtw -h purescale01 -n 50001 -u db2sdin1 -p db2adm1n -c 100 -o 1 -s -x -k a",
	stdw_stop_command : "/home/db2inst1/sdtw/t_sdtw/sdtw -t -1 -k a;sleep 2;ps -fe | grep sdtw | while read junk PID junk ; do kill -9 $PID; done;",
	stdw_increase_command : "/home/db2inst1/sdtw/t_sdtw/sdtw -t 180 -k a",
	stdw_resetData_command : ". /home/db2inst1/sqllib/db2profile;db2 connect to metrics;db2 \"truncate sdtw.metrics immediate\";db2 connect reset;",
	
	
	newMember_host : "",
	newMember_user : "",
	newMember_password : "",
	newMember_command : "db2start 2",
	newMember_command_offline : "db2stop 2 force", 
	newMember_command_resetAdminLog : "rm $HOME/sqllib/db2dump/*.nfy",
	
	fail_host : "",
	fail_user : "",
	fail_password : "",
	fail_command : "killm 1",
};


CORE_CLIENT_ACTIONS.set("pureScaleDemoButtons",Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		$super(callParameters.uniqueID + "_pureScaleDemoButtons", "pureScaleDemoButtons");
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		this.parentPageID = callParameters.uniqueID;
		this.draw();
	},
	
	startWorkload: function() {
			USE_CONNECTION = getConnectionObjectWithTag(this.baseTableData.localTableDeffinition.useConnectWithTag);
	        this.runRawCommand( SDTW_START_COMMAND, null, null, null, this.elementUniqueID + "_start", null, {HOSTID:PURESCALE_NEW_MEMBER_ID});
	},

	stopWorkload: function() {
		        this.runcommand(PURE_SCALE_DEMO_COMMAND.stdw_stop_command,PURE_SCALE_DEMO_COMMAND.stdw_host,PURE_SCALE_DEMO_COMMAND.stdw_user,PURE_SCALE_DEMO_COMMAND.stdw_password, this.elementUniqueID + "_stop", 
		        [
						[
							PURE_SCALE_DEMO_COMMAND.stdw_resetData_command,
							PURE_SCALE_DEMO_COMMAND.stdw_host,
							PURE_SCALE_DEMO_COMMAND.stdw_user,
							PURE_SCALE_DEMO_COMMAND.stdw_password
						]
				]);
	},
	
	resetDemo: function() {
		        this.runcommand(PURE_SCALE_DEMO_COMMAND.stdw_stop_command,PURE_SCALE_DEMO_COMMAND.stdw_host,PURE_SCALE_DEMO_COMMAND.stdw_user,PURE_SCALE_DEMO_COMMAND.stdw_password, this.elementUniqueID + "_reset", 
					[
						[
							PURE_SCALE_DEMO_COMMAND.newMember_command_resetAdminLog,
							PURE_SCALE_DEMO_COMMAND.newMember_host,
							PURE_SCALE_DEMO_COMMAND.newMember_user,
							PURE_SCALE_DEMO_COMMAND.newMember_password
						],
						[
							PURE_SCALE_DEMO_COMMAND.newMember_command_offline,
							PURE_SCALE_DEMO_COMMAND.newMember_host,
							PURE_SCALE_DEMO_COMMAND.newMember_user,
							PURE_SCALE_DEMO_COMMAND.newMember_password
						],
						[
							PURE_SCALE_DEMO_COMMAND.hmc_reset,
							PURE_SCALE_DEMO_COMMAND.hmc_host,
							PURE_SCALE_DEMO_COMMAND.hmc_user,
							PURE_SCALE_DEMO_COMMAND.hmc_password
						],
						[
							PURE_SCALE_DEMO_COMMAND.stdw_resetData_command,
							PURE_SCALE_DEMO_COMMAND.stdw_host,
							PURE_SCALE_DEMO_COMMAND.stdw_user,
							PURE_SCALE_DEMO_COMMAND.stdw_password
						],
					]
				);
	},

	increaseWorkload: function() {
	       this.runcommand(PURE_SCALE_DEMO_COMMAND.stdw_increase_command,PURE_SCALE_DEMO_COMMAND.stdw_host,PURE_SCALE_DEMO_COMMAND.stdw_user,PURE_SCALE_DEMO_COMMAND.stdw_password, this.elementUniqueID + "_increase");
	},

	addCPU: function() {
	        this.runcommand(PURE_SCALE_DEMO_COMMAND.hmc_command,PURE_SCALE_DEMO_COMMAND.hmc_host,PURE_SCALE_DEMO_COMMAND.hmc_user,PURE_SCALE_DEMO_COMMAND.hmc_password, this.elementUniqueID + "_add");
	},

	addMember: function() {
	        this.runcommand( 'DB2_START', null, null, null, this.elementUniqueID + "_member", null, {HOSTID:PURESCALE_NEW_MEMBER_ID});
	},

	causeFailure: function() {
                this.runcommand( PURE_SCALE_DEMO_COMMAND.fail_command, PURE_SCALE_DEMO_COMMAND.fail_host, PURE_SCALE_DEMO_COMMAND.fail_user, PURE_SCALE_DEMO_COMMAND.fail_password, this.elementUniqueID + "_fail");
	},

	runCommand: function(commandName, host, user, password, item, executionStack, parameters) {
			var commandText = null;
			if(ACTIVE_DATABASE_CONNECTION_OBJECT != null)
				if(commandRunner.COMMAND_SET[ACTIVE_DATABASE_CONNECTION_OBJECT.dataServerInfo.dataServerName] != null)
					commandText = commandRunner.COMMAND_SET[ACTIVE_DATABASE_CONNECTION_OBJECT.dataServerInfo.dataServerName][commandName];
			if(commandText == null)
				if(commandRunner.COMMAND_SET["default"] != null)
					commandText = commandRunner.COMMAND_SET["default"][commandName];
			
			if(commandText == null)
				openModalAlert("<b>Command not found!</b>");
			else
				this.runRawCommand(encodeMessage(commandText, parameters), host, user, password, item, executionStack, parameters);
	},
    runRawCommand: function(command, host, user, password, item, executionStack, parameters) {

                if(command == null) return;

				var clearLoading = true;
 
                var thisObject = this;

                var sqlCount = 0;

                var POSTDATA = new Object();
                POSTDATA.action                 = "sshCommand";
                POSTDATA.returntype             = 'JSON';
                POSTDATA.command                = command;
                POSTDATA.USE_CONNECTION         = ACTIVE_DATABASE_CONNECTION;
                POSTDATA.definedConnection      = true;
                POSTDATA.sshHost                = host;
                POSTDATA.sshUser                = user;
                POSTDATA.sshPassword            = password;

                new Ajax.Request(ACTION_PROCESSOR, {
				'parameters': POSTDATA,
				'method': 'post',
				'onCreate': function() {
					//this will set the loading icon
					thisObject.setError("<table width='100%' height='100%' style='background-color:rgba(0, 0, 255, 0.05);'><td><td align='center' valign='center'><img style='float:none;' src='./images/buttonreload.gif'/></td></tr></table>");
				},
				'onComplete' : function() {
					if(clearLoading)
						thisObject.clearError();
				},
				'onSuccess': function(transport) {
					var result = transport.responseJSON;
					if(result == null)
					{
						thisObject.notificationCycle(item, "red", 4)
					}
					else if(result.flagGeneralError == true && result.connectionError == true)
					{
						thisObject.notificationCycle(item, "red", 4)
					}
					else if(result.flagGeneralError == true ||  isReturnCodeNotOK(result))
					{
						thisObject.notificationCycle(item, "red", 4)
					}
					else if(executionStack != null)
					{
						if(executionStack.length > 0)
						{
							clearLoading = false;
							var next = executionStack.pop();
							thisObject.runcommand(next[0], next[1], next[2], next[3], item, executionStack, parameters)
						}
						else
						{
							thisObject.notificationCycle(item, "lime", 4)
						}
					}
					else
					{
						thisObject.notificationCycle(item, "lime", 4)
					}
				},
				'onException': function(transport) {
					thisObject.notificationCycle(item, "red", 4)
				},
				'onFailure': function(transport) {
					thisObject.notificationCycle(item, "red", 4)
				}
                        });
	},

	draw: function() {
		var output = "<div id='" + this.elementUniqueID + "_errorDisplayArea' style='display:none;height:100%;width:100%;overflow:none;position:static;'></div>";
		output += "<div id='" + this.elementUniqueID + "_displayArea' style='height:100%;width:100%;overflow:none;position:static;'>";
		output += "<button id='" + this.elementUniqueID + "_start' onclick='" + this.callBackText + ".startWorkload();' style='width:100%;height:33%;'>Start workload</button>\n";
		output += "<button id='" + this.elementUniqueID + "_increase' onclick='" + this.callBackText + ".increaseWorkload();' style='width:100%;height:33%;'>Increase workload</button>\n";
		output += "<button id='" + this.elementUniqueID + "_stop' onclick='" + this.callBackText + ".stopWorkload();' style='width:100%;height:33%'>Stop workload</button>\n";
		output += "</div>";
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).setContent(output, null, null, 'hidden', null);

	},
	setError: function(message) {
		var contentArea = $(this.elementUniqueID + "_displayArea");
		var errorArea = $(this.elementUniqueID + "_errorDisplayArea");
		if(errorArea != null)
		{
			errorArea.show();
			errorArea.update(message);
		}
	},
	clearError: function() {
		var contentArea = $(this.elementUniqueID + "_displayArea");
		var errorArea = $(this.elementUniqueID + "_errorDisplayArea");
		if(errorArea != null)
		{
			errorArea.hide();
			errorArea.update("");
		}
	},

	notificationCycle: function(item, color, count)
	{
		var itemElement = $(item);
		if(itemElement == null)
			return;
		count--;
		if(count >= 0)
		{
			if(count%2 == 1)
			{
				itemElement.setStyle({"backgroundColor": color});
			}
			else
			{
				itemElement.setStyle({"backgroundColor": null});
			}
			setTimeout(this.callBackText + ".notificationCycle('" + item + "', '" + color + "', " + count + ")", 200);
		}
		else
		{
			itemElement.setStyle({"backgroundColor": null});
		}
	},

	destroy: function($super) {
		$super();
	}
}));

