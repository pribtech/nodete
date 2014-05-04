/*******************************************************************************
 * Author: Nikita Pchelin
 * 
 *Copyright IBM Corp. 2010 All rights reserved.
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

//var graphDataSnapShots = $H();

CORE_CLIENT_ACTIONS.set("parseTaskSet",  Class.create(CORE_CLIENT_ACTIONS.get("list_table"), {
	initialize: function($super, callParameters) {
        // Assign instance variables.
        this.uniqueID = callParameters.uniqueID;
        this.parentStageID = callParameters.stageID;
        this.parentWindowID = callParameters.windowID;
        this.parentPanelID = callParameters.panelID;
        this.taskset = callParameters.taskset;

        this.draw();
	},
	
	draw: function() {
        //alert(this.taskset);
         getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).setContent("<code><pre>" + this.taskset + "</pre></code>", "Taskset", "This is a tasket returned by WMD");
       
	}
}));
