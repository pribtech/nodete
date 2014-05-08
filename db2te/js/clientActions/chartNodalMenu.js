/*******************************************************************************
 *  Author: Peter Prib
 * 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2013 All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *********************************************************************************/

CORE_CLIENT_ACTIONS.set("chartNodalMenu",  Class.create(CORE_CLIENT_ACTIONS.get("chartNodal"), {
	initialize: function($super, callParameters) {
 		this.json2xmlHexObject=['elementAction','elementActionScript','elementFloatingLink','elementLinkList','elementPageWindows'];
 		this.setParameter(callParameters,'autoResize','false');
 		this.setParameter(callParameters,'chartTitle','Menu');
		this.setParameter(callParameters,'displayTransform','XSL/filterNodesConnectionDetails.xsl');
		this.setParameter(callParameters,'show','menuTree');
		this.setParameter(callParameters,'sourceType','MENU');
		this.setParameter(callParameters,'sourceJsonRoot','elementSubNodes');
		this.setParameter(callParameters,'source','menu/developer');
		this.setParameter(callParameters,'transform','XSL/internalMenu2Menu.xsl');
 		this.setParameter(callParameters,'zoomRatio','0.1');
 		this.setParameter(callParameters,'minChartWidth','400');
 		this.setParameter(callParameters,'nodeControl', 
					"<nodeControl>"
					+	"<node name='default' outsideLabelXpath='@title' outsideLabelFontSize='nodeHeight'/>"
					+	"<node name='#text' hide='true'/>"
					+	"<node name='folder' shape='folderOpen' shapeWhenHiddenChildren='folderClosed'/>"
					+	"<node name='folderClosed' shape='folderClosed'/>"
					+	"<node name='folderOpened' shape='folderOpen'/>"
					+	"<node name='folderLoading' shape='loading'/>"
					+	"<node name='leaf' shape='action' showChildern='false'/>"
					+	"<node name='table' shape='menuTable' shapeWhenHiddenChildren='folderClosed'/>"
					+	"<node name='row' shape='menuRow'/>"
					+	"<node name='parameters' hide='true'/>"
					+	"<node name='parameter' hide='true'/>"
					+"</nodeControl>"
					);
		$super(callParameters);
	},
	getOrginalNode: function(node) {
		var id=node.getAttribute('id');
		var oldNode=getNodeByXPath(this.xmlData,this.xmlData,"//*[@id='"+id+"']");
		if(oldNode==null) throw 'Load children logic error, cannot find node';
		return oldNode;
	},
	refreshTableNode: function(node) {
		node.setAttribute('onClick','currentlyLoading');
		node.setAttribute('node__loading',true);
		this.redraw();
		GET_GLOBAL_OBJECT('list_table', node.getAttribute('GUID') ).retrieveTableData();
	},
	buildTableMenu: function(node,tableObject) {
		if(tableObject.baseTableData.baseData==null) {
			node.setAttribute('onClick','refreshTableNode');
			return;
		}
		var menuDOM=this.xmlData;
		for(var row=0;row<tableObject.baseTableData.baseData.length;row++) {
			var rowNode=menuDOM.createElement('folderClosed');
			rowNode.setAttribute('title',tableObject.getRowTitle(row));
			rowNode.setAttribute('id',tableObject.GUID+'r'+row);
			rowNode.setAttribute('onClick','showChildren');
			rowNode.setAttribute('node__showChildren','false');
			var j=0;
			for(var reference in tableObject.baseTableData.components.reference ) {
				var anode=tableObject.baseTableData.components.reference[reference];
				var override=(	   coalesce(anode.frame,"").toLowerCase() == 'main' 
								&& coalesce(anode.window,"").toLowerCase() == '_blank'
							?"newWindow":"");
				if(anode.navigator!==null)
					switch (anode.navigator) {
						case 'leaf':
							override+=anode.navigator;
						case 'table':
							override="";
					}
				switch (override+anode.reftype) {
					case 'table':
						var rowElementNode=menuDOM.createElement('table');
						rowElementNode.setAttribute('table',anode.refvalue);
						rowElementNode.setAttribute('onClick','loadTableMenu');
 						var  extendedTitle=''
 							,parameters=menuDOM.createElement('parameters');
						anode.ref.each(function(ref) {
							var  parameter=menuDOM.createElement('parameter')
								,column = ref.local_column_name != null ? ref.local_column_name.toUpperCase() : ""
								,key = ref.foreign_column_name;
							parameter.setAttribute('name',ref.foreign_column_name);
							if (tableObject.baseTableData.resultSetIndexByColumnName[column] != null) 
								parameter.setAttribute('value', tableObject.baseTableData.baseData[row][tableObject.baseTableData.resultSetIndexByColumnName[column]]); 
							else if(ref.value != null)
								parameter.setAttribute('value',ref.value);
							else if(ref.expression!=null)
								parameter.setAttribute('value',tableObject.getExpressionResult(ref.expression,tableObject.baseTableData,row));
							parameters.appendChild(parameter);
							if(ref.comparetype != null) {
								var parameterCompare=menuDOM.createElement('parameter');
								parameterCompare.setAttribute('name','compare' + key);
								parameterCompare.setAttribute('value', ref.comparetype);
								parameters.appendChild(parameterCompare);
							}
							extendedTitle+=' '
									+( column=="" ? key
											:	( tableObject.baseTableData.components.column[column]==null ? column
													:	( tableObject.baseTableData.components.column[column].title==null ? column
														:tableObject.baseTableData.components.column[column].title).replace("/^\s+/g", "").replace("/\s+$/g", "")
													)
									)+ ( ref.comparetype==null ? ': ' : ' ' + ref.comparetype.replace("/^\s+/g", "").replace("/\s+$/g", "")+' ')
									+ parameter.getAttribute('value')
									;
						});
						rowElementNode.appendChild(parameters); 
						rowElementNode.setAttribute('extendedTitle',extendedTitle);
						break;
					default:
						var rowElementNode=menuDOM.createElement('leaf');
						rowElementNode.setAttribute('onClick','processTableReference');
						rowElementNode.setAttribute('row',row);
						rowElementNode.setAttribute('GUID',tableObject.GUID);
						rowElementNode.setAttribute('reference',reference);
				}
				rowElementNode.setAttribute('node__image',anode.icon);
				rowElementNode.setAttribute('title',anode.titleNoQuots);
				rowElementNode.setAttribute('id',tableObject.GUID+'r'+row+'a'+j++);
				rowNode.appendChild(rowElementNode);
			}
			if( !tableObject.baseTableData.isSummarized ) {
				for(var action in tableObject.baseTableData.components.action ) {
					var anode=tableObject.baseTableData.components.action[action];
					var rowElementNode=menuDOM.createElement('leaf');
					rowElementNode.setAttribute('onClick','processTableAction');
					rowElementNode.setAttribute('row',row);
					rowElementNode.setAttribute('GUID',tableObject.GUID);
					rowElementNode.setAttribute('action',action);
					rowElementNode.setAttribute('node__image',coalesce(anode.icon,"images/sout.gif"));
					rowElementNode.setAttribute('title',anode.titleNoQuots);
					rowElementNode.setAttribute('id',tableObject.GUID+'r'+row+'a'+j++);
					rowNode.appendChild(rowElementNode);
				}
				if( (tableObject.baseTableData.output==null ? true : (tableObject.baseTableData.output['DDL']==null ? true : tableObject.baseTableData.output['DDL']['generator']!='' ))) {
					var rowElementNode=menuDOM.createElement('leaf');
					rowElementNode.setAttribute('onClick','processTableOutput');
					rowElementNode.setAttribute('name','DDL');
					rowElementNode.setAttribute('row',row);
					rowElementNode.setAttribute('GUID',tableObject.GUID);
					rowElementNode.setAttribute('node__image',coalesce(anode.icon,"images/sout.gif"));
					rowElementNode.setAttribute('title','Add DDL/DML');
					rowElementNode.setAttribute('id',tableObject.GUID+'r'+row+'a'+j++);
					rowElementNode.setAttribute('type',"insert");
					rowNode.appendChild(rowElementNode);
					var rowElementNode=menuDOM.createElement('leaf');
					rowElementNode.setAttribute('onClick','processTableOutput');
					rowElementNode.setAttribute('name','DDL');
					rowElementNode.setAttribute('row',row);
					rowElementNode.setAttribute('GUID',tableObject.GUID);
					rowElementNode.setAttribute('node__image',coalesce(anode.icon,"images/sout.gif"));
					rowElementNode.setAttribute('title','Drop DDL/DML');
					rowElementNode.setAttribute('id',tableObject.GUID+'r'+row+'a'+j++);
					rowElementNode.setAttribute('type',"delete");
					rowNode.appendChild(rowElementNode);
				}
				if (tableObject.baseTableData.output!=null) 
					if (!Object.isArray(tableObject.baseTableData.output))		
						for (var name in tableObject.baseTableData.output) {
							if(name=="DDL") continue; 
							var anode=tableObject.baseTableData.output[name];
							var rowElementNode=menuDOM.createElement('leaf');
							rowElementNode.setAttribute('onClick','processTableOutput');
							rowElementNode.setAttribute('name',name);
							rowElementNode.setAttribute('type',"no change");
							rowElementNode.setAttribute('row',row);
							rowElementNode.setAttribute('GUID',tableObject.GUID);
							rowElementNode.setAttribute('node__image',coalesce(anode.icon,"images/sout.gif"));
							rowElementNode.setAttribute('title',anode.title==null?name:anode.title);
							rowElementNode.setAttribute('id',tableObject.GUID+'r'+row+'a'+j++);
							rowNode.appendChild(rowElementNode);
						}
			}
			node.appendChild(rowNode); 
		}
	},
	loadTableMenu: function(node,tableObject) {
		if(typeof node == "string") var node=getNodeByXPath(this.xmlData,this.xmlData,"//*[@id='"+node+"']");
		if(tableObject!=null) {
			var GUID=tableObject.GUID
			node.setAttribute('GUID',GUID);
			node.setAttribute('title',tableObject.baseTableData.localTableDeffinition.pluralName+tableObject.extendedTitle);
			if(tableObject.lastDataRetrieveOK) {
				node.setAttribute('node__showChildren','true');
				node.setAttribute('onClick','hideChildren');
			} else 
				node.setAttribute('onClick','loadTableMenu');
		} else {
			var GUID = node.getAttribute('GUID');
			if(GUID==null) {
				node.setAttribute('onClick','currentlyLoading');
				node.setAttribute('node__loading',true);
				this.redraw();
				var parameters = {
					 $table : node.getAttribute('table')
					,$notifyOnReady : this.callBackText+".loadTableMenu('"+node.getAttribute('id')+"',this)"
					};
				var nodes=getNodesByXPath(this.xmlData,node,"./parameters/parameter");
				for(var i=0;i<nodes.length;i++)
					parameters[nodes[i].getAttribute('name')]=nodes[i].getAttribute('value');
				var action=CORE_CLIENT_ACTIONS.get("list_table");
				try{
					new action(parameters);
					return;
				} catch(e) {
					alert("table list failed: "+e.toString())
					node.removeAttribute('node__loading');
					this.redraw();
					return;
				}
			}
			var tableObject = GET_GLOBAL_OBJECT('list_table', GUID);
		}
		this.buildTableMenu(node,tableObject);
		node.removeAttribute('node__loading');
		this.redraw();
	},
	loadChildren: function(node) {
		var attrValue=node.getAttribute('rootCallBack')
			,loadingNode=this.xmlData.createElement('folderLoading');
		if(attrValue==null) throw 'No callback for folder';
		for (var i=0;i<node.attributes.length;i++) 
			loadingNode.setAttribute(node.attributes[i].nodeName,node.attributes[i].nodeValue);
		node.parentNode.replaceChild(loadingNode, node);
		this.redraw();

		if(node.getAttribute('type')=='table') {
			this.loadTableMenu(node);
			return;
		}
		
		var parameters = new Object();
		var thisObject = this;
		var id=node.getAttribute('id');
		parameters.rootCallBack = attrValue;
		parameters.USE_CONNECTION = getActiveDatabaseConnection();
		parameters.returntype = "JSON";
		new Ajax.Request(MENU_PROCESSOR, {
			'parameters': parameters,
			'method': 'post',
			'onComplete': function(transport) {
				},
			'onSuccess': function(transport) {
				if(transport.responseJSON==null) {
					openModalAlert('Menus not found in  in '+parameters.rootCallBack);
					return;
				}
				if(thisObject.sourceJsonRoot==null)
					thisObject.getParameter('sourceJsonRoot',null,'json');
				
				var options={"id":id};
				var loadedDOM=getXSLTransformed(json2xml(thisObject.sourceJsonRoot,transport.responseJSON),thisObject.transformDOM , options);
				if(loadedDOM.childNodes.length!=1) throw "error load call back";
				var oldNode=getNodeByXPath(thisObject.xmlData,thisObject.xmlData,"//*[@id='"+id+"']");
				if(oldNode==null) {
					thisObject.redraw();
					return;
				}
				var replacementNode=loadedDOM.childNodes[0];
				for (var i=0;i<oldNode.attributes.length;i++) 
					if(replacementNode.getAttribute(oldNode.attributes[i].nodeName)==null)
						replacementNode.setAttribute(oldNode.attributes[i].nodeName,oldNode.attributes[i].nodeValue);
				oldNode.parentNode.replaceChild(replacementNode, oldNode);
				thisObject.showChildren(replacementNode);
			
			},
			'onFailure': function(transport) {
				openModalAlert('Failure in postGetMenu');
				},
			'onException': function(transport,exception) {
				var error = (exception==null ? transport.statusText : ( typeof(exception)=="object" ? exception.message : exception ));
				openModalAlert('Error in postGetMenu '+error);
				}
		});
	},
	currentlyLoading: function(node) {
		alert("currently loading")
	},
	updateData: function($super,data) {
		$super(data);
		this.resetBaseMenu();
	},
	resetBaseMenu: function() {
		node=getNodeByXPath(this.xmlData,this.xmlData,"//*[@id='r']");
		if(node==null) return;
		this.setChildrenHideChildren(node);
		this.resize();
		this.redraw();
	},
	setChildrenHideChildren: function(node) {
		for (var i=0;i<node.childNodes.length;i++) 
			if(node.childNodes[i].nodeName=='folder') {
				node.childNodes[i].setAttribute("onClick","showChildren");
				node.childNodes[i].setAttribute("node__showChildren","false");
			}
	},
	showChildren: function(node) {
		node.setAttribute("onClick","hideChildren");
		node.setAttribute("node__showChildren","true");
		this.setChildrenHideChildren(node);
		this.resize();
		this.redraw();
	},
	hideChildren: function(node) {
		node.setAttribute("onClick","showChildren");
		node.setAttribute("node__showChildren","false");
		this.resize();
		this.redraw();
	},
	processTableOutput: function(node) {
		TABLE_MANIPULATION_MODULES.get("Compare").generateAll(node.getAttribute('GUID'),node.getAttribute('name'),node.getAttribute('type'),null, node.getAttribute('row'));
	},
	
	processTableAction: function(node) {
		TABLE_COLUMN_RENDERING_MODULES.get("action").load(null, node.getAttribute('GUID') , node.getAttribute('row') , node.getAttribute('action'),"");
	},
	processTableReference: function(node) {
		var nodeId=node.getAttribute('id');
		if(getStageWindow(this.targetStage , nodeId) == null)
			loadNewPageLayout(
				{target			: nodeId
				,windowStage	: this.targetStage
				,raiseToTop		: "y"
				,title			: node.getAttribute('title')
				,content	 : 
					{type		: "splitPane"
					,direction	:"h"
					,panelA: 
						{type				: "panel"
						,name				: "main"
	 					,PrimaryContainer	: true
						,ContentType		: "LINK"
						,data:
							{type:"ACTION"
							,data: 
								{parameters : TABLE_COLUMN_RENDERING_MODULES.get("reference").load(null, node.getAttribute('GUID') , node.getAttribute('row') , node.getAttribute('reference'),"")
								}
							}
						}
					,panelB: 
						{type				: "panel"
						,name				: "detail"
						,PrimaryContainer	: false
						,ContentType		: "RAW"
						,data				: ""
						}
					}
				});
		else
			RaiseToTop( this.targetStage, nodeId);

	},
	processMenuLeaf: function(node) {
		var nodeId=node.getAttribute('id');
		var elementAction=getNodeByXPath(this.xmlData,node,"./elementAction");
		if(elementAction!=null && elementAction.textContent!="") {
			if(elementAction.textContent.substr(elementAction.textContent.length-1)=='"')
				actionParts=elementAction.textContent.split('"');
			else
				actionParts=elementAction.textContent.split("'");
			if(actionParts.length!=3)
				throw "elementAction can't decode: "+elementAction.textContent;
			eval(actionParts[1]);
			return;
		}
		var elementActionScript=xmlDOM2json(getNodeByXPath(this.xmlData,node,"./elementActionScript"));
		if(elementActionScript != null) {
			runTEScript( this.elementUniqueID+nodeId , elementActionScript, null, this.elementUniqueID+nodeId, null, null, this.parentStageID , this.parentWindowID , "menuArea" /*this.parentPanelID*/, null);
			return;
		}
		var elementFloatingLink=xmlDOM2json(getNodeByXPath(this.xmlData,node,"./elementFloatingLink"));
		if(elementFloatingLink != null) {
			if(getStageWindow(this.targetStage , nodeId) == null)
				loadNewPageLayout(
					{target			: nodeId
					,windowStage	: this.targetStage
					,raiseToTop		: "y"
					,title			: node.getAttribute('title')
					,content		:	
						{type				: "panel"
						,name				: nodeId+"_link"
						,PContentType		: "LINK"
						,PrimaryContainer	: true
						,data				: elementFloatingLink.data
						}
					});
			else
				RaiseToTop( this.targetStage, nodeId );
			return;
		}
		var elementLinkList=xmlDOM2json(getNodeByXPath(this.xmlData,node,"./elementLinkList"));
		var elementPageWindows=xmlDOM2json(getNodeByXPath(this.xmlData,node,"./elementPageWindows"));
		var thisObject=this;
		if(elementPageWindows!=null) {
			if(Object.isArray(elementPageWindows)) 
				elementPageWindows.each(function(elementPageWindows) {
					thisObject.setTargetPage(elementPageWindows,node);
					});
			else
				thisObject.setTargetPage(elementPageWindows,node);
		}
		loadPage(elementPageWindows, elementLinkList);
	},
	setTargetPage: function(elementPageWindows,node) {
		elementPageWindows.target='_blank';
		elementPageWindows.windowStage=this.targetStage;
		if(elementPageWindows.title==null || elementPageWindows.title=="")
			elementPageWindows.title=node.getAttribute('title');
	},
	canvasEvent: function(event) {
		switch(event.type) {
			case 'click':
				var nodeInfo=this.getNodeForCanvasEvent(event);
				if(nodeInfo==null) return;
				var attrValue=nodeInfo.node.getAttribute('onClick');
				if(attrValue==null || attrValue=='') return;
				try{
					this[attrValue](this.getOrginalNode(nodeInfo.node));
				} catch (e) {
					openModalAlert('<pre>onClick invalid "'+attrValue+'" '+e.toString()+"\nStack Trace\n"+e.stack+"<\pre>");
				}
				return;
			case 'dblclick':
				this.showNodeDetails(event);
				return;
		}
	},
	menuOptions: function($super,menuArray) {
		menuArray=[];
		return $super(menuArray);
	},
	setParentPanel: function() {
		this.targetStage= this.elementUniqueID + "_target_STAGE"
		var layout = (
			{type			: "splitPane"
			,direction		: "v"
			,name			: "ChartNodalMenuBase"
			,splitPercent	: 0.2
			,allowResize	: true
			,panelA:
				{type				: "panel"
				,name				: "menuArea"
				,PrimaryContainer	: false
				,ContentType		: "RAW"
				,data				: ''
				}
			,panelB:
				{type					: "stage"
				,name					: this.targetStage
				,target					: "main"
				,raiseToTop				: ""
				,HasMenuBarContainer : TOP_TAB_TASK_BAR
				,top                 : 0
				,botton              : 0
				,left                : 0
				,right               : 0
				,titleBarType        : NO_TITLE_BAR
				,windowOptionType    : NAV_RELOAD_BUTTON | NAV_FORWARD_BUTTON | NAV_BACK_BUTTON
				,windowControlTypes  : NO_TITLE_BAR_OPTIONS
				,sizable             : WINDOW_IS_FULL

				}		
			});
		
		getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID).loadLayout(layout);	
		this.parentPanel = getPanel(this.parentStageID, this.parentWindowID, layout.panelA.name);
		this.parentPage=$(this.parentPanel.elementUniqueID);
		this.targetStageObject = getStage(this.targetStage);
		if(this.targetStageObject != null)
			this.LOCAL_STAGE_VARIABLES = this.targetStageObject.LOCAL_STAGE_VARIABLES;

	},
	destroy: function($super) {
		var nodes=getNodesByXPath(this.xmlData,this.xmlData,"//*/table");
		for(var i=0;i<nodes.length;i++) {
			var GUID=nodes[i].getAttribute('GUID');
			if(GUID!=null)
				GLOBAL_OBJECT_HOLDER[GLOBAL_TYPE_LIBRARY.LIST_TABLE].unset(GUID);
		}
		$super();
	},
}));