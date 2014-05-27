/*******************************************************************************
 *Copyright IBM Corp. 2007 All rights reserved.
 *
 * modified by: Peter Prib
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2013 - 2014 All rights reserved.
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
var actionRunID = 0;
var actionStackHolder = $H();

var runTEScript = function(actionGUID, theScript, actionWorkingBlock, localTrigerObjectName, callBackFunction, localVariables, stageID, windowID, panelID, pageID) {
	if(Object.isString(theScript))
		theScript = eval('(' + theScript + ')');
	var TEScriptMain = new actionScript(actionGUID, theScript, localVariables, stageID, windowID, panelID, pageID);
	TEScriptMain.callAction(actionWorkingBlock, localTrigerObjectName, callBackFunction, localVariables);
};

var GetAllTEScripts = function(script, actionList) {
	actionList.set(script.name, script);
	script.tasks.each(function(task) {
		if(task != null)
			GetAllTEScriptsProcessIFBlock(task, actionList);
	});
};

var GetAllTEScriptsProcessIFBlock = function(IFBlock, actionList) {
	if(IFBlock.taskList == null) return;
	if(!Object.isArray(IFBlock.taskList))
		IFBlock.taskList = [IFBlock.taskList];
	IFBlock.taskList.each(function(taskList) {
		taskList.tasks.each(function(task) {
			if(task.type == "action")
				GetAllTEScripts(task, actionList);
			else if(task.type == "IF")
				if(task != null) 
					GetAllTEScriptsProcessIFBlock(task, actionList);
		});
	});
};

var TEScriptStackBase = Class.create({
	initialize: function(parentAction, actionWorkingBlock, localTrigerObjectName, defaultParameterList) {
		this.ID = ++actionRunID;						//Action Run Identification
		this.thisObject = parentAction;					//This Action Object
		this.stageID = parentAction.parentStageID;		//The stage this action is running with in
		this.windowID = parentAction.parentWindowID;	//The window this action is running with in
		this.panelID = parentAction.parentPanelID;		//The panel this action is running with in
		this.workingBlock = actionWorkingBlock;			//The working block this action is running with in
		this.trigerObject = localTrigerObjectName;		//The object which called this action
		this.actionResults = $H();						//The hash array of return values from actions with in this call
		this.sharedActionResults = $H();
		this.defaultParameterList = defaultParameterList;
		this.actionReturnValue = "true";				//The main return value of the action
		this.callBackStack = [];
		this.actionScript = null;
		this.localVariables = $H();
		actionStackHolder.set(this.ID, this);
	},

	callBackStackDump: function(htmlOutput) {
		if(htmlOutput==null) htmlOutput=true;
		if(htmlOutput) {
			var out="<h3>localVariables</h3>"+this.localVariablesDump(this.localVariables,htmlOutput,0)
					+"<h3>Stack</h3><table><tr><td>ActionScript</td><td>callBackFunction</td><td>Flag</td><tr>";
			for (var i=0;i<this.callBackStack.length;i++)
				out+="<tr><td>"+this.actionScriptDump(this.callBackStack[i].actionScript,htmlOutput)+"</td><td>"+this.callBackStack[i].callBackFunction+"</td><td>"+this.callBackStack[i].flag+"</td></tr>";
			return out+"</table>";
		}
		var out="\nthis.localVariables :\n"+this.localVariablesDump(this.localVariables,htmlOutput,0)
				+"\n\nStack Dump\n";
		for (var i=0;i<this.callBackStack.length;i++)
			out+="\nActionScript: "+this.actionScriptDump(this.callBackStack[i].actionScript,htmlOutput)
				+"\ncallBackFunction: "+this.callBackStack[i].callBackFunction
				+"\nFlag: "+this.callBackStack[i].flag+"\n";
		return out+"\n";
	},

	actionScriptDump: function(actionScript,htmlOutput) {
		if (actionScript==null) return "*** no action script **";
		return htmlOutput
			? "<table><tr><td>Name</td><td>"+actionScript.name+"</td></tr></table>"
			: " Name:"+actionScript.name;
	},

	localVariablesDump: function(localVariables,htmlOutput,level) {
		if (localVariables==null) return "null";
		if(++level>10) return "*** nest level > 10 ***";
		try{
			switch (typeof localVariables) {
				case "array":
					value="\n";
					for(i=0;i<localVariables.length;i++)
						value += htmlOutput
							? "<tr><td>"+i+"</td><td>"+this.localVariablesDump(localVariables[i],htmlOutput,level)+"</td></tr>"
							: "  "+i+" : "+this.localVariablesDump(localVariables[i],htmlOutput,level)+"\n";
					return "array: " + ( htmlOutput
										? "<table>" + (value==""?"<tr><td>null</td></tr>":value) + "</table>"
										: (value==""?"null":value)+"\n"
										);
				case "object":
					var value="" , thisObject=this;
					for(key in localVariables) {
						if(typeof localVariables[key] === "function") continue;
						if(key === "_object") continue;
						value += htmlOutput
							?  "<tr><td>"+key+"</td><td>"+thisObject.localVariablesDump(localVariables[key],htmlOutput,level)+"</td></tr>"
							:  "  "+key+": "+thisObject.localVariablesDump(localVariables[key],htmlOutput,level)+"\n";
					}
					return "object: " + (htmlOutput
										? "<table>"+(value==""?"<tr><td>null</td></tr>":value)+"</table>"
										: (value==""?"null":value)+"\n"
										);
				case "function":
					return "function";
				default:
					return htmlOutput ? "<pre>"+localVariables+"</pre>" : localVariables;
			}
		} catch (e) {
			return htmlOutput ? "<pre>error: "+e.toString()+"</pre>" : "error: "+e.toString();
		}		
	},

	pushAndCall : function(callFunction, callVariables, callScript, callBackFunction, flag , argArray) {
		this.push(callVariables, callScript, callBackFunction, flag);
		this.call(callFunction);
	},

	callEval: function(inCallFunction, localStack) {
		try{
			eval(inCallFunction);
		} catch(e) {
			alertAndLog("callEval: " + inCallFunction + "\nerror: " + e.toString() + "\nstack trace:\n\n" + e.stack + localStack.callBackStackDump(false) );
			localStack.exitAction()
		}
	},

	callWithArgs: function(inCallFunction,localStack,argArray) {
		try{
			inCallFunction.apply(localStack,argArray);
		} catch(e) {
			alertAndLog("callWithArgs error: " + e.toString() + "\nstack trace:\n\n"+e.stack+localStack.callBackStackDump(false));
			localStack.exitAction()
		}
	},

	call: function(callFunction, argArray,delayTime) {
		if(callFunction == null) return;
		try	{
			if(typeof callFunction === "function") 
				setTimeout(this.callWithArgs.bind(undefined,callFunction,this,argArray),(delayTime== null?1:delayTime));
			else
				setTimeout(this.callEval.bind(undefined,callFunction,this),(delayTime== null?1:delayTime));
		} catch(e) {
			alertAndLog('Action call error '+e.toString());
			this.remove();
		}
	},

	exitAction : function (name) {
		try {
			var callbackFunction = null;
			var popedFlag = null;
			do {
				var stack=this.callBackStack.pop();
				this.actionScript = stack.actionScript;
				this.localVariables = stack.localVariables;
				callbackFunction = stack.callBackFunction;
				popedFlag = stack.flag;
				if("DoublePOP" == popedFlag)
					this.call(callbackFunction);
				if(name!=null) {
					if(name==actionScript.name) {
						var matchedName=true;
					} else if(matchedName!=null) return;
				}
			} while(this.callBackStack.length > 0)
			if(callbackFunction != null)
				this.call(callbackFunction);
		} catch(e) {
			alertAndLog('Action call error '+e);
			this.remove();
		}
	},

	getParameter : function (name) {
		return this.localVariables.parameters.get(name);
	},

	getStackCallBackText : function () {
		return "actionStackHolder.get(" + this.ID + ")";
	},

	push : function(callVariables, callScript, callBackFunction, flag) {
		this.callBackStack.push({
					 actionScript:this.actionScript
					,localVariables:this.localVariables
					,callBackFunction:callBackFunction
					,flag:flag
					});
		if(callScript != null)		this.actionScript = callScript;
		if(callVariables != null)	this.localVariables = callVariables;
	},

	popAndCall : function() {
		try	{
			var stack=this.callBackStack.pop();
			this.actionScript = stack.actionScript;
			this.localVariables = stack.localVariables;
			if(stack.callBackFunction != null)
				this.call(stack.callBackFunction);
			if(stack.flag == "DoublePOP")
				this.popAndCall();
		} catch(e) {
			alertAndLog('Action call error '+e);
			this.remove();
		}
	},

	popToAndCall : function(flag,retry) {
		try {
			var popedFlag = null;
			var callbackFunction = null;
			do {
				var stack=this.callBackStack.pop();
				this.actionScript = stack.actionScript;
				this.localVariables = stack.localVariables;
				callbackFunction = stack.callBackFunction;
				popedFlag = stack.flag;
				if("DoublePOP" == popedFlag)
					this.call(callbackFunction);
			} while( flag != popedFlag && this.callBackStack.length > 0)
			if(retry!=null) 
				if(popedFlag=="action")
					if(retry==this.actionScript.name) {
						this.pushAndCall(this.thisObject.callBackText + ".processParameters(" + this.getStackCallBackText() + ", 0)"
										, null, null
										, this.thisObject.callBackText + ".executeTEScript(" + this.getStackCallBackText() + ")" , "action");
						return;
					}
			if(callbackFunction != null)
				this.call(callbackFunction);
		} catch(e) {
			alertAndLog('Action callback error '+e);
			this.remove();
		}
	},
	
	remove : function() {
		//Note: the action script frame work is designed to run the same script in parallel, thuse a counter must be used here and not a boolean
		this.thisObject.isRunning++;
		actionStackHolder.unset(this.ID);
	},

	setParameter : function (name,value) {
		this.localVariables.parameters.set(name, value);
	}
});

var actionScript = Class.create(basePageElement,{
	initialize: function($super, actionID, script, defaultParameterList, StageID, WindowID, PanelID, PageID, consoled, sharedActionResults) {
		$super(actionID, "TEScript");
		this.scriptHead = script;
		this.scriptActionMap = $H();
		GetAllTEScripts(script, this.scriptActionMap);
		this.parentStageID = StageID;
		this.parentWindowID = WindowID;
		this.parentPanelID = PanelID;
		this.parentPageID = PageID;
		this.workingBlock = "";
		//Note: the action script frame work is designed to run the same script in parallel, thus a counter must be used here and not a boolean
		this.isRunning = 0;
		
		this.defaultParameterList = ( defaultParameterList == null ? $H() : defaultParameterList );
		this.sharedActionResults = ( sharedActionResults == null ? $H() : sharedActionResults );
		this.defaultParameterList.set("CALLING_STAGE", this.parentStageID);
		this.defaultParameterList.set("CALLING_WINDOW", this.parentWindowID);
		this.defaultParameterList.set("CALLING_PANEL", this.parentPanelID);
		this.defaultParameterList.set("CALLING_PAGE", this.parentPageID);
		this.consoled = consoled;
		if(this.parentStageID != "" && this.parentWindowID != "" && this.parentPanelID != "" && this.parentStageID != null && this.parentWindowID != null && this.parentPanelID != null)
			getPanel(this.parentStageID,this.parentWindowID,this.parentPanelID).registerNestedObject(this.elementUniqueID, this);
	},
	
	callAction: function(actionWorkingBlock, localTrigerObjectName, callBackFunction, localVariables) {
		//Note: the action script frame work is designed to run the same script in parallel, thus a counter must be used here and not a boolean
		this.isRunning++;
	
		var localStack = new TEScriptStackBase(this, actionWorkingBlock, localTrigerObjectName, this.defaultParameterList);
		if(Object.isHash(actionWorkingBlock)) {
				actionWorkingBlock.each(function(pair) {
					localStack.defaultParameterList.set(pair.key, pair.value);
				});
		}
		localStack.localVariables = (localVariables==null?$H():localVariables);
		if(callBackFunction == null)
			callBackFunction = "";
		if(callBackFunction != "")
			callBackFunction = callBackFunction + "(" + localStack.getStackCallBackText() + ");";
		var emptyLocalVariables=$H();
		localStack.push(emptyLocalVariables, this.scriptHead, callBackFunction + localStack.getStackCallBackText() + ".remove()",null);
		if(localStack.actionScript.lockScreen) 
			if(LOCK_SCREEN())
				localStack.push(null, null, "UNLOCK_SCREEN()", "DoublePOP");
		localStack.pushAndCall(this.callBackText + ".processParameters(" + localStack.getStackCallBackText() + ", 0)"
				, null, null
				, this.callBackText + ".executeTEScript(" + localStack.getStackCallBackText() + ")" , "action");
	},
	
	destroy: function($super) {
		if(this.isRunning <= 0) {
			$super();
			return;
		}
		try {
			setTimeout(this.callBackText + ".destroy()", 100);
		} catch(e) {
			$super();
		}
	},
	
	executeTEScript: function(localStack) {
		GLOBAL_ACTION_TYPE.executeTEScript(this,localStack);
	},
	
	executeFollowOnActions: function(localStack, currentTask, taskListPos, taskPos) {
		try{
			this.executeFollowOnActionsInternal(localStack, currentTask, taskListPos, taskPos);
		} catch(e) {
			alertAndLog("executeFollowOnActions error: " + e.toString() + "\nstack trace:\n\n"+e.stack);
		}
	},
	
	executeFollowOnActionsInternal: function(localStack, currentTask, taskListPos, taskPos) {
		if(localStack.actionScript.tasks != null) {
			var tasks = localStack.actionScript.tasks;
			var numberOfTasks = tasks.length;
			for(0; currentTask < numberOfTasks; currentTask++) {
				if(tasks[currentTask].type == "task") {
					localStack.pushAndCall(localStack.thisObject.callBackText + ".taskProcessor(" + localStack.getStackCallBackText() + ",'localStack.actionScript.tasks'," + currentTask + " , 0, 0)"
											, null, null
											, localStack.thisObject.callBackText + ".executeFollowOnActions(" + localStack.getStackCallBackText() + ", " + (currentTask+1) + ")", "controlGroup");
					return;
				} 
				if(tasks[currentTask].type == "IF") {
					var followOnAction = tasks[currentTask];
					if( GLOBAL_ACTION_COMPARE.check(localStack,followOnAction)) {
						localStack.pushAndCall(localStack.thisObject.callBackText + ".taskProcessor(" + localStack.getStackCallBackText() + ",'localStack.actionScript.tasks'," + currentTask + " , 0, 0)"
											, null, null
											,localStack.thisObject.callBackText + ".executeFollowOnActions(" + localStack.getStackCallBackText() + ", " + (currentTask+1) + ")", "controlGroup");
						return;
					}
				}
			}
		}
		localStack.popAndCall();
	},
	
	taskProcessor: function(localStack, taskListLocation, taskListActionPos, taskListPos, taskPos) {
		var task=eval(taskListLocation + "[" + taskListActionPos + "];");
		if(!isDatabaseConnectionVersion(task)) {
			localStack.popAndCall();
			return;
		}
		var taskListArray = task.taskList;
		if(!Object.isArray(taskListArray))
			taskListArray = [taskListArray];
		if(localStack.taskListRepeatCount==null) localStack.taskListRepeatCount=0;
		for(0;taskListPos < taskListArray.length; taskListPos++) {
			taskList = taskListArray[taskListPos];
			while(taskList.repeat > localStack.taskListRepeatCount) {
				var  taskArray = taskList.tasks;
				for(0;taskPos < taskArray.length; taskPos++) {
					try {
						var task = taskArray[taskPos];
						task.pos=taskPos;
						task.listPos=taskListPos;
						task.listLocation=taskListLocation;
						task.listActionPos=taskListActionPos;
						task.breakTaskProcessor=false;
						GLOBAL_TASKTYPE.execute(this,localStack,task);
						if(task.breakTaskProcessor) return;
						taskPos=task.pos;
					} catch(e) {
						throw "Error in action "+ task.type +": "+ e.toString();
					}
				}
				localStack.taskListRepeatCount++;
				taskPos = 0;
			}
			localStack.taskListRepeatCount=0;
		}
		localStack.popAndCall();
	},
	setDefaultParameter: function(localStack,name,value ) {
		localStack.defaultParameterList.set(name, value);
	},
	setVariables: function(taskList, setFunction ) {
		if(taskList.task.name==null || taskList.task.name=="") {
			var variables=retrieveParameter(taskList.task, taskList.localStack.workingBlock, taskList.localStack.localVariables.parameters, taskList.localStack.actionResults);
			var variablesDOM=getDOMParsed(variables);
			var variableNode=getNodesByXPath(variablesDOM,variablesDOM,(taskList.task.xpathBase==null?'//*/property':taskList.task.xpathBase));
			for(var i=0;i<variableNode.length;i++) {
				if(taskList.task.xpathName==null || taskList.task.xpathName=="") {
					var variableNameNode=getNodesByXPath(variablesDOM,variableNode[i],'@name/.');
					if(variableNameNode.length!=1)
						var variableNameNode=getNodesByXPath(variablesDOM,variableNode[i],'name/text()');
				} else
					var variableNameNode=getNodesByXPath(variablesDOM,variableNode[i],taskList.task.xpathName);
				if(variableNameNode.length!=1) continue;
				var name=variableNameNode[0].nodeValue;
				if(name==null) {
					alert('name not found for assignment, check xpath');
					continue;
				}
				if(taskList.task.xpathName==null || taskList.task.xpathName=="") {
					var variableValueNode=getNodesByXPath(variablesDOM,variableNode[i],"@value/.");
					if(variableValueNode.length!=1)
						var variableValueNode=getNodesByXPath(variablesDOM,variableNode[i],"value/text()");
				} else
					var variableValueNode=getNodesByXPath(variablesDOM,variableNode[i],taskList.task.xpathValue);
				if(variableValueNode.length!=1) continue;
					var value=variableValueNode[0].nodeValue;
				this.setVariableValue(taskList, setFunction, name,value)
			}
		} else {
			var name=taskList.task.name;
			var value=retrieveParameter(taskList.task, taskList.localStack.workingBlock, taskList.localStack.localVariables.parameters, taskList.localStack.actionResults);
			this.setVariableValue(taskList, setFunction, name,value)
		}
	},
	setVariableValue: function(taskList, setFunction, name, value ) {
		taskList.localStack.setParameter(name, value);
		if(setFunction!=null)
			setFunction.call(taskList.localStack,taskList.localStack,name,value);
		if(taskList.task.check == null)	return;
		GLOBAL_TASKTYPE.checklist(this,taskList.localStack,taskList.task);
	},

	processParameters: function(localStack, parameterPosition) {
		if(parameterPosition == 0 || parameterPosition == null) {
			localStack.localVariables.parameters = $H();
			localStack.defaultParameterList.each(function(pair) {
				localStack.setParameter(pair.key, pair.value);
			});
		}
		if(localStack.actionScript.parameterList == null || parameterPosition == null) {
			localStack.popAndCall();
			return;
		}
		var parameterListArrayLength = localStack.actionScript.parameterList.length;
		for(0; parameterPosition < parameterListArrayLength; parameterPosition++) {
			localStack.setParameter(localStack.actionScript.parameterList[parameterPosition].name, retrieveParameter(localStack.actionScript.parameterList[parameterPosition], localStack.workingBlock, localStack.localVariables.parameters, localStack.actionResults));
			if(localStack.actionScript.parameterList[parameterPosition].check != null) {
				localStack.pushAndCall(localStack.thisObject.callBackText + ".parameterCheck(" + localStack.getStackCallBackText() + ", 'localStack.actionScript.parameterList'," + parameterPosition + ",0,'"+name+"')"
									  ,null
									  ,null
									  ,localStack.thisObject.callBackText + ".processParameters(" + localStack.getStackCallBackText() + ", " + (parameterPosition+1) + ")"
									  ,"check");
				return;
			}
		}
		localStack.popAndCall();
	},
	
	parameterCheck: function(localStack, parameterArrayLocation,parameterPosition, checkPosition , name) {
		try{
			if(localStack==null) return;    //throw "Local stack is undefined";
			try {
				var parameterArray = eval(parameterArrayLocation+";");
			} catch(e){
				throw "Parameter array not found for parameterArrayLocation";
			}
			if (parameterArray[parameterPosition]==null)
				throw "Parameter/variable not found";
			var parameterLocation = parameterArray[parameterPosition];
		} catch(e){
			alertAndLog("parameterCheck error:"+ e.toString() + "\nstack trace:\n\n"+e.stack);
			localStack.exitAction();
			return;
		}
		if(parameterLocation.check != null) {
			var checkParameterArray = parameterLocation.check;
			var checkParameterArrayLength = checkParameterArray.length;
			for(0; checkPosition < checkParameterArrayLength; checkPosition++) {
				var resultEval = false;
				var checkParameter = checkParameterArray[checkPosition];
				try{
					var resultTocompareTo = localStack.getParameter(parameterLocation.name);
					var valueTocompareFrom = checkParameter.condition;
					if(checkParameter.conditionType != "") {
						var task = {
							parameterType : checkParameter.conditionType,
							value : checkParameter.condition,
							defaultValue : ""
						};
						valueTocompareFrom = retrieveParameter(task, localStack.workingBlock, localStack.localVariables.parameters, localStack.actionResults);
					}
					var compareWith = checkParameter.conditionCompareType == "" ? "regex" : checkParameter.conditionCompareType.toLowerCase();
				} catch (e) {
					alertAndLog("Error in parameter check: "+checkParameter.originalAction+" variable:"+ parameterLocation.name +" condition: "+ checkParameter.condition +" type: "+ checkParameter.conditionCompareType +" error: "+ e.toString() + "\nstack trace:\n\n"+e.stack);
					localStack.exitAction();
					return;
				}
				switch(compareWith) {
					case "regex":
						try {
							regex = new RegExp(valueTocompareFrom);
							resultEval = String(resultTocompareTo).match(regex);
						} catch(e) {
							alertAndLog("An error has occurred:" + e);
							localStack.exitAction();
						}
						resultEval = (resultEval != null);
						break;
					case "istr":
						valueTocompareFrom = valueTocompareFrom.toLowerCase();
						resultTocompareTo = resultTocompareTo.toLowerCase();
					case "str":
						resultEval = (valueTocompareFrom == resultTocompareTo);
						break;
				}
				if(checkParameter.negCondition ? !resultEval : resultEval) {
					localStack.pushAndCall( localStack.thisObject.callBackText + ".taskProcessor(" + localStack.getStackCallBackText() + ",'" + parameterArrayLocation + "[" + parameterPosition + "].check'," + checkPosition + " , 0, 0)"
											, localStack.localVariables
											, null
											,localStack.thisObject.callBackText + ".parameterCheck(" + localStack.getStackCallBackText() + ",'" + parameterArrayLocation + "'," + parameterPosition + "," + (checkPosition+1) + ",'"+name+"')"
											,"controlGroup");
					return;
				}
			}
		}
		localStack.popAndCall();
	}
});
var GLOBAL_ACTION_COMPARE = {
	  debugMode : false
	 ,toogleDebugMode : function () {
	 		this.check=(this.debugMode?this.checkNoDebug:this.checkDebug);
	 		this.debugMode=!this.debugMode; 
	 		alert('Action compare debug mode is '+(this.debugMode?"on":"off"));
	 	}
	,check:   function() {alert ("GLOBAL_ACTION_COMPARE bug/debug mode not set");} 
	,checkDebug:  function (localStack,followOnAction) {
			result=this.checkNoDebug(localStack,followOnAction);
			alertAndLog("GLOBAL_ACTION_COMPARE Debug"
				+"\ncompareOn: "+followOnAction.compareOn
				+"\ncompareOnType: "+followOnAction.compareOnType
				+"\ncondition: "+followOnAction.condition
				+"\nconditionCompareType: "+followOnAction.conditionCompareType
				+"\nconditionType: "+followOnAction.conditionType
				+"\nname: "+followOnAction.name
				+"\nnegCondition: "+followOnAction.negCondition
				+"\n\ncompareWith: "+localStack.debug.compareWith
				+"\nvalueTocompareFrom: "+localStack.debug.valueTocompareFrom
				+"\nresultTocompareTo: "+localStack.debug.resultTocompareTo
				+"\n\nResult: "+result
				);
			return result;
		}
	,checkNoDebug:  function (localStack,followOnAction) {
			if(!isDatabaseConnectionVersion(followOnAction)) return false;
			try{
				var valueTocompareFrom = followOnAction.condition;
				if(followOnAction.compareOn != "")	{
					followOnAction.compareOnType = followOnAction.compareOnType != "" ? followOnAction.compareOnType : "RETURNOBJECT";
					task = {
						parameterType : followOnAction.compareOnType,
						value : followOnAction.compareOn,
						defaultValue : ""
					};
					var resultTocompareTo = retrieveParameter(task, localStack.workingBlock, localStack.localVariables.parameters, localStack.actionResults);
				} else
					var resultTocompareTo = localStack.localVariables.result.returnCode;
				if(resultTocompareTo==undefined) throw "Could not find resultTocompareTo";
				if(followOnAction.conditionType != "") {
					task = {
						parameterType : followOnAction.conditionType,
						value : followOnAction.condition,
						defaultValue : ""
						};
					valueTocompareFrom = retrieveParameter(task	, localStack.workingBlock, localStack.localVariables.parameters, localStack.actionResults);
				}
				var compareWith = followOnAction.conditionCompareType == "" ? "regex" : followOnAction.conditionCompareType.toLowerCase();
				if(resultTocompareTo==undefined) throw "resultTocompareTo is undefined"; 
				if(this[compareWith]==null)  throw "unknown condition check";
				if(this.debugMode) localStack.debug={'compareWith':compareWith,'valueTocompareFrom':valueTocompareFrom,'resultTocompareTo':resultTocompareTo}
				return followOnAction.negCondition 
					?!this[compareWith](localStack,valueTocompareFrom,resultTocompareTo,compareWith)
					: this[compareWith](localStack,valueTocompareFrom,resultTocompareTo,compareWith);
			} catch(e) {
				throw 'GLOBAL_ACTION_COMPARE check error compare: "' + compareWith + '" From: "' + valueTocompareFrom + '" To: "' + resultTocompareTo + '" error: ' + e.toString();// + '\nstack trace:\n\n'+e.stack;
			}

		}
	,str :  function (localStack,valueTocompareFrom,resultTocompareTo) {
			return (valueTocompareFrom == resultTocompareTo);
		}
	,istr:	function (localStack,valueTocompareFrom,resultTocompareTo) {
			return this.str(localStack,valueTocompareFrom.toLowerCase(),resultTocompareTo.toLowerCase());
		}
	,isdateformatyyyymmdd : function (localStack,valueTocompareFrom,resultTocompareTo) {
			return this.regextest(localStack,'^\s*[0-9]{4}-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])\s*$',resultTocompareTo);
		}
	,isempty : function (localStack,valueTocompareFrom,resultTocompareTo) {
			return this.regextest(localStack,'^ *$',resultTocompareTo);
		}
	,isnotempty : function (localStack,valueTocompareFrom,resultTocompareTo) {
			return !this[isEmpty](localStack,valueTocompareFrom,resultTocompareTo);
		}
	,isnotanumber : function (localStack,valueTocompareFrom,resultTocompareTo) {
			return !this[isNumber](localStack,valueTocompareFrom,resultTocompareTo);
		}
	,isnumber : function (localStack,valueTocompareFrom,resultTocompareTo) {
			return this.regextest(localStack,'^\s*[0-9]*\s*$',resultTocompareTo);
		}
	,istimeformathh24miss : function (localStack,valueTocompareFrom,resultTocompareTo) {
			return this.regextest(localStack,'^\s*([01][0-9]|2[0-4]):[0-5][0-9]:[0-5][0-9]\s*$',resultTocompareTo);
		}
	,istimestampformatyyyymmddhh24miss : function (localStack,valueTocompareFrom,resultTocompareTo) {
			return this.regextest(localStack,'^\s*[0-9]{4}-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1]) ([01][0-9]|2[0-4]):[0-5][0-9]:[0-5][0-9]\s*$',resultTocompareTo);
		}
	,sqlcode: function (localStack,valueTocompareFrom,resultTocompareTo) {
			var msgId=resultTocompareTo.split(" ",1)[0];
			if(msgId.substr(0,1)=="[")  
				msgId=resultTocompareTo.split("] ",2)[1].split(" ",1)[0];
			return this.str(localStack,valueTocompareFrom,msgId);
		}
	,regex:	function (localStack,valueTocompareFrom,resultTocompareTo) {
			try{
				return String(resultTocompareTo).match(new RegExp(valueTocompareFrom, ""))  != null;
			} catch(e) {
				try{ return (valueTocompareFrom == resultTocompareTo);}
				catch(e) {}
				throw e
			}
		}
	,regextest:	function (localStack,valueTocompareFrom,resultTocompareTo) {
			return (new RegExp(valueTocompareFrom, "")).test(String(resultTocompareTo));
		}
	,databaseConnectionVersion:	function (localStack,valueTocompareFrom,resultTocompareTo,conditionCompareType) {
			var node=[];
			node[followOnAction.conditionCompareType]=resultTocompareTo;
			return isDatabaseConnectionVersion(node);
		}
}
GLOBAL_ACTION_COMPARE.check		=GLOBAL_ACTION_COMPARE.checkNoDebug;
GLOBAL_ACTION_COMPARE.features	=GLOBAL_ACTION_COMPARE.databaseConnectionVersion;
GLOBAL_ACTION_COMPARE.dbms		=GLOBAL_ACTION_COMPARE.databaseConnectionVersion;
GLOBAL_ACTION_COMPARE.minversion=GLOBAL_ACTION_COMPARE.databaseConnectionVersion;
GLOBAL_ACTION_COMPARE.maxversion=GLOBAL_ACTION_COMPARE.databaseConnectionVersion;
GLOBAL_ACTION_COMPARE.fixpak	=GLOBAL_ACTION_COMPARE.databaseConnectionVersion;
GLOBAL_ACTION_COMPARE.context	=GLOBAL_ACTION_COMPARE.databaseConnectionVersion;
GLOBAL_ACTION_COMPARE.SQLCODE	=GLOBAL_ACTION_COMPARE.sqlcode;


var GLOBAL_ACTION_TYPE = {
	  debugMode : false
	 ,toogleDebugMode : function () {
	 		this.executeTEScript=(this.debugMode?this.executeNoDebug:this.executeDebug);
	 		this.debugMode=!this.debugMode; 
	 		alert('Action debug mode is '+(this.debugMode?"on":"off"));
	 	}
	 ,executeNoDebug:  function (callObject,localStack) {
			try{
				localStack.localVariables.result = {
						returnCode: 'true',
						returnValue : ""
					};
				var action=localStack.actionScript.actionType.toUpperCase();
	 			this[(this[action]==null?"default":action)](callObject,localStack);
	 		} catch (e) {
	 			alertAndLog("Error in execute TE Script action: "+ action +" error : " + e.toString() + "\nstack trace:\n\n"+e.stack+"\n"+this.getDump(callObject,localStack,false));
				localStack.exitAction();
	 		}
	 	}
	 ,executeDebug:  function (callObject,localStack) {
			if(this.debugMode) alert("Debug - Before\n"+this.getDumpText(callObject,localStack));
			this.executeNoDebug(callObject,localStack);
			if(this.debugMode) alert("Debug - After\n"+this.getDumpText(callObject,localStack));
	 	}
	 ,getDump : function (callObject,localStack) {
	 		return localStack==null ? "<h2>localStack is null</h2>" : "<h2>Action "+localStack.actionScript.actionType+"</h2>"+localStack.callBackStackDump();
		}
	 ,getDumpText : function (callObject,localStack) {
	 		return localStack==null ? "localStack is null\n" : "Action:  "+(localStack.actionScript==null?"*** error null ***":localStack.actionScript.actionType+" name: "+localStack.actionScript.name)+"\n"
	 			+ "\nlocalStack: "+localStack.localVariablesDump(localStack,false,0)
	 			+localStack.callBackStackDump(false);
		}
	,executeTEScript:   function() {alert ("bug/debug mode not set");} 
	,setResult: 	function(callObject,localStack,returnCode,returnValue) {
			localStack.localVariables.result = {
					returnCode: returnCode,
					returnValue : returnValue
				};
		}
	,setActionResult: 	function(callObject,localStack,returnCode,returnValue) {
			this.setResult(callObject,localStack,returnCode,returnValue);
			this.setReturnAction(callObject,localStack);
		}
	,setReturnResult: 	function(callObject,localStack,returnCode,returnValue) {
			this.setResult(callObject,localStack,returnCode,returnValue);
			this.setReturn(callObject,localStack);
		}
	,setReturnAction: 		function(callObject,localStack) {
			localStack.setParameter("RETURN_CODE", decodeURIComponent(localStack.localVariables.result.returnCode));
			localStack.setParameter("RETURN_VALUE", decodeURIComponent(localStack.localVariables.result.returnValue));
			localStack.actionResults.set(localStack.actionScript.name,localStack.localVariables.result);
		}
	,setReturn: 		function(callObject,localStack) {
			this.setReturnAction(callObject,localStack);
			localStack.thisObject.executeFollowOnActionsInternal(localStack, 0, 0, 0);
		}
	,"SERVERACTION"	: function (thisObjectOld,localStack) {
		var thisObject=this;
		var parameters = localStack.localVariables.parameters;
		var returnObject = {
			returnCode: "ERROR",
			returnValue : ""
		};
		parameters.set("returntype", "JSON");
		if(parameters.get('USE_CONNECTION') == null) {
			if(parameters.get('useConnectWithTag') != null)
				parameters.set('USE_CONNECTION', getConnectionWithTag(parameters.get('useConnectWithTag')));
			if(parameters.get('USE_CONNECTION') == null)
				parameters.set('USE_CONNECTION', getActiveDatabaseConnection());
		}
		new Ajax.Request(ACTION_PROCESSOR,{
			 'parameters': parameters
			,'method': 'post'
			,'onSuccess': function(transport) {
					if( transport.responseJSON==null) {
						if(transport.responseText!=null) throw "Unexpected plain text response: "+transport.responseText;
						if(transport.responseXML!=null) throw "Unexpected plain text respone: "+transport.responseXML
						throw "Unexpected empty response";
					}
					localStack.localVariables.result = transport.responseJSON;
					if(localStack.localVariables.result == null)  throw "An invalid JavaScript object was returned, can not complete action execution.";
					if(localStack.localVariables.result.flagGeneralError == true && localStack.localVariables.result.connectionError == true)
						initiateConnectionRefresh();
					if(localStack.localVariables.result.flagGeneralError == true)
						throw unescape(localStack.localVariables.result.returnValue);
					GLOBAL_ACTION_TYPE.setReturn(thisObject,localStack);
				}
			,'onFailure': function (transport,exception) {
					var error = (exception==null ? transport.statusText : ( typeof(exception)=="object" ? exception.toString() : exception ));
					alertAndLog("action request error: "+error);
					GLOBAL_ACTION_TYPE.setReturnResult(thisObject,localStack,"ERROR","Server action error: " +error);
					localStack.actionReturnValue = false;
//					localStack.exitAction();
					GLOBAL_TASKTYPE.exit(thisObject,localStack);
				}
			,'onException':function(transport,exception) {
					var error = (exception==null ? transport.statusText : ( typeof(exception)=="object" ? exception.toString() : exception ));
					alertAndLog("action request error: "+error);
					GLOBAL_ACTION_TYPE.setReturnResult(thisObject,localStack,"ERROR",exception.name + "Server action error: " +exception.toString());
					localStack.actionReturnValue = false;
//					localStack.exitAction();
					GLOBAL_TASKTYPE.exit(thisObject,localStack);
				}
			}); 
		}
	,"ALERT" 		: function (thisObject,localStack) {
			var parameters = localStack.localVariables.parameters;
			var message = encodeMessage(localStack.actionScript.message, parameters);
			AllowAutoClosingOfFloatingObject = false;
			alert(message);
			this.setReturnResult(thisObject,localStack,'true',"");
		}
	,"DIALOG" 		: function (thisObject,localStack) {
			thisObject.raiseDialog(localStack);
			var parameters = localStack.localVariables.parameters;
			var parametersToSend = parameters;
			var data = encodeMessage(localStack.actionScript.message, parameters);
			if(data == "")
				openModalDialog({type:'action',data: {parameters : parametersToSend}}
							,  "LINK" , localStack, parametersToSend);
			else	
				openModalDialog(data,  "raw" , localStack, parametersToSend);
			
		}
	,"PROMPT" 		: function (thisObject,localStack) {
			var parameters = localStack.localVariables.parameters;
			var message = encodeMessage(localStack.actionScript.message, parameters);
			AllowAutoClosingOfFloatingObject = false;
			var promptReturn = prompt(message, parameters.get("PROMPT_DEFAULT"));
			var status = promptReturn == null ? 'false' : 'true';
			this.setReturnResult(thisObject,localStack,status,promptReturn);
		}
	,"CONFIRM" 		: function (thisObject,localStack) {
			var parameters = localStack.localVariables.parameters;
			var message = encodeMessage(localStack.actionScript.message, parameters);
			AllowAutoClosingOfFloatingObject = false;
			var result = confirm(message);
			var status = result ? 'true' : 'false';
			this.setReturnResult(thisObject,localStack,status,"");
		}
	,"FORM" 		: function (thisObject,localStack) {
			var parameters = localStack.localVariables.parameters
				,parametersToSend = new Object()
				,type = "raw";
			for (var key in localStack.actionScript)
				if(key.substr(0,1)=="$")
					parametersToSend[key] = localStack.actionScript[key];
			parameters.each(function(pair){
				parametersToSend[pair.key] = pair.value;
			});
			if(coalesce(localStack.actionScript.schema,'')!='') {
				type = "LINK";
				parametersToSend["action"]="chartNodal";
				parametersToSend["$autoResize"]="true";
				parametersToSend["$show"]="EditViaReport";
				if(parametersToSend.$title==null)
					parametersToSend["$title"]="Message";
				parametersToSend["$definition"]=localStack.actionScript.schema;
				parametersToSend["$editMode"]="true";
//				parametersToSend["$editMode"]="insert";
				parametersToSend["$sourceType"]="xmlData";
				parametersToSend["$localStack"]=localStack;
				parametersToSend["$object"]=thisObject;
				var data = {
						type:'action',
						data: {
							parameters : parametersToSend
						}
					};
			}
			if(data == null)
				var data = encodeMessage(localStack.actionScript.message, parameters);
			if(data == "") {
				type = "LINK";
				data = {
					type:'action',
					data: {
						parameters : parametersToSend
					}
				};
			}
			openModalForm(data, type, localStack, parametersToSend);
	}
	,"FILEDIALOG" 	: function (thisObject,localStack) {
			thisObject.raiseFileDialog(localStack);
			var parameters = localStack.localVariables.parameters;
			var parametersToSend = parameters;
			openModalFileDialog(localStack, parametersToSend);
		}
	,"default" 		: function (thisObject,localStack) {thisObject.executeFollowOnActionsInternal(localStack, 0, 0, 0);}
};
GLOBAL_ACTION_TYPE.executeTEScript=GLOBAL_ACTION_TYPE.executeNoDebug;

var GLOBAL_TASKTYPE = {
	  debugMode : false
	 ,toogleDebugMode : function () {
	 		this.execute=(this.debugMode?this.executeNoDebug:this.executeDebug);
	 		this.debugMode=!this.debugMode; 
	 		alert('Task debug mode is '+(this.debugMode?"on":"off"));
	 	}
	 ,getDumpObject : function (name,callObject) {
 			var value=name+':\n' ;
			for(key in callObject) {
				if(typeof callObject[key] === "function") continue;
				if(key === "_object") continue;
				value +=   "  "+key+": "+this.getDumpObject(callObject[key])+"\n";
			}
		 	return value;
	 	}
	 ,getDump : function (callObject,localStack,task) {
		 	return "<h2>Task: "+(task==null?"null":task.type)+"</h2>"
		 		+'<pre>'+this.getDumpObject('task',task)+'<pre>'
		 		+(localStack==null ? "<h2>localStack is null</h2>" : "<h2>Action "+localStack.actionScript.actionType+"</h2>"+localStack.callBackStackDump());
	 	}
	 ,getDumpText : function (callObject,localStack,task) {
	 	return "Task: "+(task==null?"null":task.type)+"\n"
	 			+ this.getDumpObject('task',task) +"\n"
	 			+(localStack==null ? "localStack is null\n" : "Action: "+(localStack.actionScript==null?"***  actionScript is null ***":localStack.actionScript.actionType)+"\n"
	 			+ "\nlocalStack: "+localStack.localVariablesDump(localStack,false,0)
	 			+localStack.callBackStackDump(false));
	 	}
	 ,executeNoDebug:  function (callObject,localStack,task) {
		 	localStack.currentTask=task;
			try{
	 			this[task.type.toLowerCase()](callObject,localStack,task);
	 		} catch (e) {
	 			openModalAlert("<pre>Error in execute task "+ task.type +": "+ e.toString() + "\nstack trace:\n\n"+e.stack+"</pre>"
	 							+(localStack==null?"<h3>localStack is null</h3>":localStack.callBackStackDump())
	 							);
	 			this.exit(callObject,localStack,task);
	 		}
	 	}
	 ,executeDebug:  function (callObject,localStack,task) {
			alert("Task debug - Before\n"+this.getDumpText(callObject,localStack,task));
			this.executeNoDebug(callObject,localStack,task);
			alert("Task debug - After\n"+this.getDumpText(callObject,localStack,task));
	 	}
	,execute: function() {alert ("bug/debug mode not set");} 
	,"action": function(callObject,localStack,task) {
			task.runAction = task;
			this.runaction(callObject,localStack,task);
/*		
		
			var emptyLocalVariables=$H();
			localStack.push(emptyLocalVariables, task, localStack.thisObject.callBackText + ".taskProcessor(" + localStack.getStackCallBackText() + ",'" + task.listLocation + "'," + task.listActionPos +"," + task.listPos + "," + (task.pos+1) + ")", "action");
			if(localStack.actionScript.lockScreen)
				if(LOCK_SCREEN())
						localStack.push(null, null, "UNLOCK_SCREEN()" , "DoublePOP");
			localStack.pushAndCall(localStack.thisObject.callBackText + ".processParameters(" + localStack.getStackCallBackText() + ", 0)"
									, null, null
									, localStack.thisObject.callBackText + ".executeTEScript(" + localStack.getStackCallBackText() + ")", "actionHead" );
			this.breakTaskList(callObject,localStack,task);
*/
		}
	,"alert" : function(callObject,localStack,task) {alert(encodeMessage(task.message, localStack.localVariables.parameters));}
	,"alertandlog" : function(callObject,localStack,task) {alertAndLog(encodeMessage(task.message, localStack.localVariables.parameters));}
	,"assignsharedconstant" : function(callObject,localStack,task) {
			var taskList = {location:task.listLocation , actionPos:task.listActionPos , task:task , localStack:localStack, pos:task.listPos, taskPos:task.pos };
			callObject.setVariables(taskList,callObject.setDefaultParameter);
		}
	,"assignlocalparameter" : function(callObject,localStack,task) {
			var taskList = {location:task.listLocation , actionPos:task.listActionPos , task:task , localStack:localStack, pos:task.listPos, taskPos:task.pos };
			callObject.setVariables(taskList, null); 
		}
	,"blockupdate" : function(callObject,localStack,task) {
			var blockHash = $H(localStack.localVariables.result.returnValue);
			blockHash.each(function(blockValues) {
					if($(localStack.workingBlock + "_" + blockValues.key) == null) return;
					try	{
						$F(localStack.workingBlock + "_" + blockValues.key);
						$(localStack.workingBlock + "_" + blockValues.key).value = unescape(blockValues.value);
					} catch(err) {
						$(localStack.workingBlock + "_" + blockValues.key).update(unescape(blockValues.value));
					}
				});
		}
	,"breakTaskList" : function(callObject,localStack,task) {task.breakTaskProcessor=true;}
	,"break" : function(callObject,localStack,task) {
			localStack.popAndCall();
			this.breakTaskList(callObject,localStack,task);
		}
	,"breakcheck" : function(callObject,localStack,task) {
			localStack.popToAndCall("check");
			this.breakTaskList(callObject,localStack,task);
		}
	,"breakcontrolgroup" : function(callObject,localStack,task) {
			localStack.popToAndCall("controlGroup");
			this.breakTaskList(callObject,localStack,task);
		}
	,"callaction" : function(callObject,localStack,task) {
			task.runAction = localStack.thisObject.scriptActionMap.get(task.name);
			this.runaction(callObject,localStack,task);
		}
	,"callglobalaction" : function(callObject,localStack,task) {
			for(var i=0; i<task.parameter.length; i++)
				this.assignsharedconstant(callObject,localStack,task.parameter[i]);
			task.runAction = GLOBAL_TE_SCRIPT_STORE.get(task.name);
			GetAllTEScripts(task.runAction, localStack.thisObject.scriptActionMap);
			this.runaction(callObject,localStack,task);
		}
	,"checklist": function(callObject,localStack,task) {
		if(localStack.checkTaskListPos==null) localStack.checkTaskListPos = [];
		if(localStack.checkTaskListPos[task.listPos]==null) localStack.checkTaskListPos[task.listPos]={taskPos:[]};
		localStack.checkTaskListPos[task.listPos].taskPos[task.pos]={taskList:[{tasks:task.check}]};
		for(var i=0; i<task.check.length; i++) {
			if(task.check[i].compareOn!=task.name) {
					task.check[i].name = name+":"+i;
					task.check[i].compareOn = task.name;
					task.check[i].compareOnType = "CONSTANT";
					task.check[i].type="checkIf";
			}
		}
		localStack.pushAndCall( localStack.thisObject.callBackText + ".taskProcessor(" + localStack.getStackCallBackText() + ",'localStack.checkTaskListPos["+task.listPos+"].taskPos'," + task.pos + " , 0, 0)"
								,null, null
								,localStack.thisObject.callBackText + ".taskProcessor(" + localStack.getStackCallBackText() + ",'" + task.listLocation + "'," + task.listActionPos +"," + task.listPos + "," + (task.pos+1) + ")", "taskGroup");
		this.breakTaskList(this,localStack,task);
	}
	,"displaylocalvariables": function(callObject,localStack,task) {
			var message="<table>";
			localStack.localVariables.parameters.each(function(parameter) {
					message +=  "<tr><td>"+parameter.key + "</td><td><pre>"+parameter.value+"</pre></td></tr>";
				});
			message+="</table>";
			openModalAlert(message);
		}
	,"echo" : function(callObject,localStack,task) {
			if(callObject.consoled == null) return;
			if($(callObject.consoled) == null) return;
			$(callObject.consoled).insert(encodeMessage(task.message, localStack.localVariables.parameters) + "\n");
		}
	,"exit" : function(callObject,localStack,task) {
			localStack.exitAction(task.name==null?null:task.name);
			this.breakTaskList(callObject,localStack,task);
		}
	,"forbegin" : function(callObject,localStack,task) {
			if(task.source==null) task.source="table";
			if(task.iterate==null) task.source="iterate";
			if (task.source="table") {
				localStack.forTableObject = retrieveParameter({value:"$tableObject",parameterType:"PARAMETER"}, localStack.workingBlock, localStack.localVariables.parameters, localStack.actionResults);
				if(localStack.forTableObject==null)
					localStack.forTableObject = localStack.actionScript.parameterList.get("$tableObject");
			}
			if(localStack.forTableObject==null)
				throw "no table/node/array object found";
			localStack.forRow=-1;
			localStack.forBeginPos=task.pos;
		}
	,"for" : function(callObject,localStack,task) {
			if(++localStack.forRow>=localStack.forTableObject.baseTableData.baseData.length) {
				task.pos++;
				return;
			}
			localStack.forTableObject.setColumns4Block(localStack.forRow,localStack.localVariables.parameters);
			this.task(callObject,localStack,task);
		}
	,"forend" : function(callObject,localStack,task) {
			task.pos=localStack.forBeginPos;
		}
	,"getconnection": function(callObject,localStack,task) {
			var connectionName = retrieveParameter(task, localStack.workingBlock, localStack.localVariables.parameters, localStack.actionResults);
			if(connectionName == "" || connectionName == null || connectionName == "null" || connectionName == "NULL")
				localStack.setParameter(task.name, getActiveDatabaseConnectionObject());
			else
				localStack.setParameter(task.name, getConnectionObjectWithTag(connectionName))
		}
	,"if" : function(callObject,localStack,task) {
			if( GLOBAL_ACTION_COMPARE.check(localStack, task))
				this.task(callObject,localStack,task);
		}
	,"loadpage" : function(callObject,localStack,task) {
			var pageLayouts = cloneObject(task.pageLayouts);
			var links = cloneObject(task.links);
			loadDecodedPage(encodeObject(pageLayouts, localStack.localVariables.parameters), encodeObject(links, localStack.localVariables.parameters));
		}
	,"lockscreen" : function(callObject,localStack,task) {LOCK_SCREEN();}
	,"math": function(callObject,localStack,task) {
			var result = "";
			var taskPos = 0;
			var operator = task.operator;
			var value = ""; 
			for(0; taskPos < task.parameters.length; taskPos++) {
			switch(task.parameters[taskPos].type.toLowerCase()) {
				case "parameter":
					value = retrieveParameter(task.parameters[taskPos], localStack.workingBlock, localStack.localVariables.parameters, localStack.actionResults);
					result += " " + value;
					break;
				case "set":
					result += " " +  this.math(callObject,task.parameters[taskPos], localStack);	
					break;
				case "alert":
					alert(task.parameters[taskPos].message);
					taskPos = task.parameters.length; //exiting the loop
					break;
				default:
					alert("evaluateMath error, not valid type: " + task.parameters[taskPos].type);
					break;
				}
				if(taskPos + 1 != task.parameters.length)
					result += " "  + operator;
			}		
			result = eval(result);
			if(task.name != "")
				localStack.setParameter(task.expression_id, result);
			return result;
		}
	,"newwindow": function(callObject,localStack,task) { // attributes datatype= filename=
			self.open('data:'+(task.dataType==null?'application/pdf':task.dataType)
		   	        	+'; Content-Disposition: '+(task.fileName==null?'inline':task.disposition)+' ; '
						+'filename='+(task.fileName==null?'data.pdf':task.fileName)
						+(task.base64=="true"?';base64':'')
						+task.headerOptions
						+','+ escape(retrieveParameter(task, localStack.workingBlock, localStack.localVariables.parameters, localStack.actionResults))
					, "child");
		}
	,"opencontextmenu": function(callObject,localStack,task) {
			var menu = encodeMessage(task.baseDir, localStack.localVariables.parameters);
			CORE_GENERAL_CONTEXT_MENU.callBackNode = menu;
			CORE_GENERAL_CONTEXT_MENU.getMenu(true);
			GLOBAL_CONTEXT.setContext(menu);
		}
	,"panelreload" : function(callObject,localStack,task) {
			var panel = getPanel(localStack.stageID,localStack.windowID,localStack.panelID);
			if(panel == null) 
				throw "Panel '" + localStack.panelID + "' not found to refresh";
			if(task.name == "" || task.name == null) {
				localStack.exitAction();
				panel.reloadPage();
				this.breakTaskList(callObject,localStack,task);
				return;
			}
			panel = getPanel(localStack.stageID,localStack.windowID,task.name);
			if(panel == null) 
				throw "Panel '" + task.name + "' not found to refresh";
			if(task.name == localStack.panelID)
				localStack.exitAction();
			panel.reloadPage();
			if(task.name == localStack.panelID)
				this.breakTaskList(callObject,localStack,task);
		}
	,"parallel" : function(callObject,localStack,task) {
			if(localStack.parrallel==null) {
				localStack.parrallel=[];
				localStack.parrallelCount=0;
			}
			var skeletonAction = GLOBAL_TE_SCRIPT_STORE.get("skeletonAction");
			var callback="GLOBAL_TASKTYPE.parallelendtask";
			for(var i=0; i<task.tasks.length; i++) {
				localStack.parrallelCount++;
				var parallelActionScript=deepClone(skeletonAction)
					,actionName=localStack.ID +'p' + i;
				parallelActionScript.tasks[0]=deepClone(task.tasks[i]);
				localStack.parrallel[actionName] = new actionScript(actionName, parallelActionScript, callObject.defaultParameterList, callObject.parentStageID, callObject.parentWindowID, callObject.parentPanelID, callObject.parentPageID);
				localStack.parrallel[actionName].callAction('', '', /*callBack*/"GLOBAL_TASKTYPE.parallelendtask", localStack.localVariables);
			}
			this.breakTaskList(this,localStack,task);
		}
	,"parallelendtask" : function(localStack) {
			var actionName=localStack.thisObject.elementUniqueID;
			var callingstack = actionName.split("p")[0];
			var callingLocalStack=actionStackHolder.get(callingstack);
			delete callingLocalStack.parrallel[actionName];
			if(--callingLocalStack.parrallelCount<=0) {
				var task=callingLocalStack.currentTask;
				callingLocalStack.thisObject.taskProcessor(callingLocalStack,task.listLocation,task.listActionPos,task.listPos,(task.pos+1));
			}
	}
	,"retry" : function(callObject,localStack,task) {
			localStack.popToAndCall("action",task.name);
			this.breakTaskList(callObject,localStack,task);
		}
	,"return" : function(callObject,localStack,task) {
			localStack.popToAndCall("action");
			this.breakTaskList(callObject,localStack,task);
		}
	,"runaction" : function(callObject,localStack,task) {
			if(task.runAction == null) return;
			try {
				var emptyLocalVariables=$H();
				localStack.push(emptyLocalVariables, task.runAction, localStack.thisObject.callBackText + ".taskProcessor(" + localStack.getStackCallBackText() + ",'" + task.listLocation + "'," + task.listActionPos +"," + task.listPos + "," + (task.pos+1) + ")", "action");
				if(localStack.actionScript.lockScreen)
					if(LOCK_SCREEN())
						localStack.push(null, null, "UNLOCK_SCREEN()" , "DoublePOP");
				localStack.pushAndCall(localStack.thisObject.callBackText + ".processParameters(" + localStack.getStackCallBackText() + ", 0)"
									, null, null
									, localStack.thisObject.callBackText + ".executeTEScript(" + localStack.getStackCallBackText() + ")", "actionHead" );
			} catch(e) {
				alertAndLog('runaction '+e);
			}
			this.breakTaskList(callObject,localStack,task);
		}
	,"runjavascript" : function(callObject,localStack,task) {
			eval(task.value);
		}
	,"sendconsole" :function(callObject,localStack,task) {this.echo(callObject,localStack,task);}
	,"setactionreturn" : function(callObject,localStack,task) {
			localStack.actionReturnValue = retrieveParameter(task, localStack.workingBlock, localStack.localVariables.parameters, localStack.actionResults);
		}
	,"setcontext" : function(callObject,localStack,task) {GLOBAL_CONTEXT.setContext(task.name);}
	,"task" : function(callObject,localStack,task) {
			localStack.pushAndCall( localStack.thisObject.callBackText + ".taskProcessor(" + localStack.getStackCallBackText() + ",'" + task.listLocation + "[" + task.listActionPos + "].taskList[" + task.listPos + "].tasks'," + task.pos + " , 0, 0)"
									,null ,null
									,localStack.thisObject.callBackText + ".taskProcessor(" + localStack.getStackCallBackText() + ",'" + task.listLocation + "'," + task.listActionPos +"," + task.listPos + "," + (task.pos+1) + ")", "taskGroup");
			this.breakTaskList(callObject,localStack,task);
		}
	,"unlockscreen" : function(callObject,localStack,task) {UNLOCK_SCREEN();}
	,"wait" : function(callObject,localStack,task) {
			var args=[localStack,task.listLocation,task.listActionPos,task.listPos,(task.pos+1)];
			localStack.call(callObject.taskProcessor,args,task.seconds*1000);
			this.breakTaskList(callObject,localStack,task);
		}
	,"windowreload" : function(callObject,localStack,task) {
			var window = getWindow(localStack.stageID,localStack.windowID);
			if(window == null) 
				throw "Window '" + localStack.windowID + "' in stage '" + localStack.stageID + "' not found";
			localStack.exitAction();
			window.reloadPage();
			this.breakTaskList(callObject,localStack,task);
		}
	,"unknowntask": function(callObject,localStack,task) {
		throw "Unknown task, name: "+task.nodeName;
	}
};

GLOBAL_TASKTYPE.execute=GLOBAL_TASKTYPE.executeNoDebug;
GLOBAL_TASKTYPE.lock=GLOBAL_TASKTYPE.lockscreen;
GLOBAL_TASKTYPE.unlock=GLOBAL_TASKTYPE.unlockscreen;
GLOBAL_TASKTYPE.gotoaction=GLOBAL_TASKTYPE.callaction;
GLOBAL_TASKTYPE.setglobal=GLOBAL_TASKTYPE.assignsharedconstant;
GLOBAL_TASKTYPE.setlocal=GLOBAL_TASKTYPE.assignlocalparameter;
GLOBAL_TASKTYPE.checkif=GLOBAL_TASKTYPE.if;
GLOBAL_TASKTYPE.exitaction=GLOBAL_TASKTYPE.exit;


