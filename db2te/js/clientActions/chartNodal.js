/*******************************************************************************
 *  Author: Peter Prib
 * 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2009-2014 All rights reserved.
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
/*
	parameter:
		$settings
		$editMode
		$newRoot
		$chartTitle
		$show
		$sourceType
		$transform
		$report
		$reportType
		$greatestCostAttribute
		$definition
		$nodeControl
		$source
		$save
		$saveParameter
		$menuDirectory
		$contextMenuDirectory
		$editType
*/ 
var chartNodalActive = $H();
var chartImages = $H();
CORE_CLIENT_ACTIONS.set("chartNodal",  Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		$super(callParameters.uniqueID + "_ChartNodal", "ChartNodal");
		this.actionStack=[];
		this.initialBuild=true;
		this.loadCount=1;
		this.redrawCount=0;
		this.nodes=[];
		this.include=[];
		this.nodeDrawDetails=[];
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		this.parentPageID = callParameters.uniqueID;
		chartNodalActive.set(this.elementName, this);
		if(this.setParentPanel==null) {
			this.parentPage=$(this.parentPageID);
			this.parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		} else
			this.setParentPanel();
		this.parentPanel.registerNestedObject(this.elementUniqueID, this);
		this.callThisObject=this.callBackText;
		this.parentPanel.refreshObject = this;
		this.settingsDOM=getDOMParsed('<settings>'+(callParameters.$settings==null?'':callParameters.$settings)+'</settings>');
		this.callParameters=callParameters;
 		this.nodeLength=160;
		this.nodeMargin=20;
		this.nodeDrawLength=this.nodeLength-this.nodeMargin-this.nodeMargin;
		this.drawMaxNodes=1024;
		this.refreshMaxNodes=40;
		this.linePath="border";
		if(callParameters.$width!=null) this.parentPanel.minWidth=callParameters.$width;
		if(callParameters.$height!=null) this.parentPanel.minHeight=callParameters.$height;
		this.getParameterBoolean('autoResize',null,'true');
		this.getParameterBoolean('editMode',null,'true');
		switch (this.parentPanel.buttonA) {
			case 'Set':
				this.parentPanel.setOKaction(this,this.setValue);
			case 'OK':
				if(this.editMode)
					this.parentPanel.setOKaction(this,this.saveAndReturnTrue);
		}
		this.getParameter('newRoot');
		this.getParameter('chartTitle',null, coalesce(this.callParameters['$title'],'Chart Nodal'));
		this.getParameter('show',null,'Diagram');
		this.getParameter('sourceType');
		this.getParameter('transform');
		this.setDOMLoad(this.transform,'transformDOM');
		this.getParameter('displayTransform');
		this.setDOMLoad(this.displayTransform,'displayTransformDOM');
		this.getParameter('report',null,'XSL/chartNodalDefaultReport.xsl');
		this.getParameter('reportType');
		this.getParameter('greatestCostAttribute');
		this.getParameter('definition');
		if(this.editMode && this.definition==null) {
				this.setError('edit mode but no definition specified');
				return;
			}
		this.getParameter('nodeControl');
		++this.loadCount;
		this.setNodeControl(this.nodeControl);
		try {
			++this.loadCount;
			this.setShapes(JS_BASE_DIRECTORY+'clientActions/chartNodalShapes.xml');
			this.getParameter('shapes');
			++this.loadCount;
			this.setShapes(this.shapes);
		} catch (e) {
			this.setError('Problem parsing shapes XSD : ' + (typeof(e)=="object"?e.name + ": " +e.message:e));
			return;
		}
		this.allNodes=true;
		this.getParameter('source');
		this.getParameter('save');
		this.getParameter('saveParameter');
		this.getParameter('menuDirectory');
		this.getParameter('contextMenuDirectory');
		this.chartWidth = 100;
 		this.chartHeight = 100;
		this.getParameter('minChartWidth',null,100);
		this.getParameter('minChartHeight',null,100);
		this.getParameter('zoomRatio',null,1);
		this.transformParameters= {
				"stageID":this.parentStageID 
				,"windowID":this.parentWindowID
				,"panelID":this.parentPanelID
				,"pageID":this.parentPageID
				,"chartTitle":this.chartTitle
				,"thisObject":this.callThisObject
				,"edit":(this.editMode?"true":"false")
				};
		if(this.editMode ) {
			this.loadCount++
			this.getSchema('draw()');
		}
		this.getParameter('editType');
		this.editType = this.editType==null?null:this.editType.toLowerCase();
		switch (this.editType) {
			case 'add':
			case 'update':
			case 'delete':
				if(this.edit==null) {
					this.edit = new floatingPanel(this.elementUniqueID + '_edit', 'RAW', "", null, false, false);
					this.parentPanel.registerNestedObject(this.elementUniqueID + '_edit', this.edit);
					this.edit.draw();
				}
				this.edit.setContent("<table id='" + this.elementUniqueID + "_detailNode'>"
					+ "<tr><img style='float:none;' src='images/loadingpage.gif'/></tr>"
					+	"</table>"
					,this.chartTitle,null,null,null);
				this.detailNode = document.getElementById(this.elementUniqueID + "_detailNode");
		        this.edit.show_and_size();
				break;
			default:
				if(this.show=='noDisplay') 
					this.getData();			
				else	
					this.draw();
		}
	},
	refresh: function() {
		this.draw()
	},
	destroy: function($super) {
		chartNodalActive.unset(this.elementName);
		$super();
	},
	addElement: function (parentNode,nodeDef) {
		if (parentNode==null) { 
			this.xmlData=getDOMParsed('<'+nodeDef.getAttribute('name')+'/>');
			var newNode=this.xmlData.childNodes[0];
		} else {
			if (nodeDef.getAttribute('name')=='#text')
				newNode=this.xmlData.createTextNode(document.getElementById(this.elementUniqueID+'_intext').value);   
			else var newNode=this.xmlData.createElement(nodeDef.getAttribute('name'));
		}
		var elements=[]
			,mixed = false
			,type=nodeDef.getAttribute('type');
		switch (type) {
			case this.schemaPrefix+'decimal':
			case this.schemaPrefix+'integer':
			case this.schemaPrefix+'positiveinteger':
			case this.schemaPrefix+'boolean':
			case this.schemaPrefix+'date':
			case this.schemaPrefix+'time':
			case this.schemaPrefix+'NCName': 
			case this.schemaPrefix+'string': 
				newText=this.xmlData.createTextNode(document.getElementById(this.elementUniqueID+'_intext').value);   
				newNode.appendChild(newText);
				break;
			case null: 
				elements=this.getChildNodeByName(nodeDef,this.schemaPrefix+'complexType');
            	if(elements.length==1) break;
				var simpleType=this.getChildNodeByName(nodeDef,this.schemaPrefix+'simpleType');
				if(simpleType.length==0)
					throw "no simple type for type is null and node is "+nodeDef.getAttribute('name');
				value=document.getElementById(this.elementUniqueID+'_intext').value;
				try{
					errors=this.isAttributeValueOK(simpleType,value);
				} catch(e) {
					errors=e.toString();
				}
				if (errors!=null) throw attributeName+': '+errors;
				break;
			case '#text':
				break; 
			default: 
				elements=getNodesByXPath(this.definitionDOM,nodeDef,'//'+this.schemaPrefix+'complexType[@name="'+type+'"]');
            	if(elements.length==1) break;
        		if(elements.length>1) throw 'addElement complextype: ' +type+' too many found, number: '+elements.length;
        		try{
    				var simpleType=getNodeByXPath(this.definitionDOM,nodeDef,'//'+this.schemaPrefix+'simpleType[@name="'+type+'"]');
        		} catch(e) {
        			throw 'addElement simpleType: ' +type+ " " +e.toString();
        		}
				value=document.getElementById(this.elementUniqueID+'_intext').value;
				try{
					errors=this.isAttributeValueOK(type,value);
				} catch(e) {
					errors=e.toString();
				}
				if (errors!=null) throw attributeName+': '+errors;
				break;	
		}
		
		if (elements.length>1) throw 'tag ' +nodeDef.getAttribute('name')+' too many complexType';
		if (elements.length>0) {
			var attributes=this.getAttributes4Node(elements[0]);
			for (var iE=0;iE<attributes.length;iE++) {
				var attributeName=attributes[iE].getAttribute('name');
				if (attributeName==null) {
					attributeName=attributes[iE].getAttribute('ref');
					attr=this.getTagDefinition('attribute',attributeName);
				} else 
					var attr=attributes[iE];
				var input=document.getElementById(this.elementUniqueID+'_in_'+attributeName);
				if (input.nodeName=='A') continue;   	
				if (input.nodeName=='SELECT')	
					var attributeValue=(input.selectedIndex<0?'':input.options[input.selectedIndex].text);
				else {
					var attributeValue=input.value;
					try{
						errors=this.isAttributeValueOK(attr.getAttribute('type'),attributeValue);
					} catch(e) {
						errors=e.toString();
					}
					if (errors!=null) throw attributeName+': '+errors;
				}
					
				if(attributes[iE].getAttribute('use')=='required') 
					if(attributeValue==null || attributeValue=='')
						throw 'required attribute '+attributeName+' not completed';
				newNode.setAttribute(attributeName,attributeValue);
			}
		}
		if (parentNode==null) {
			this.setCanvas();
			this.actionStack.push(['recoveryPoint',null]);
		} else {
			parentNode.appendChild(newNode);
			this.actionStack.push(['recoveryPoint',newNode]);
		}
		this.detailNodeReset();
		this.resize();
		this.redraw();
		this.addRequiredElementsActions(newNode,nodeDef);
		this.processActionStack();
	},
	addableElements: function (node,nodeDef) {
		var tags=[]
			,elementType=nodeDef.getAttribute('type');
		if (elementType==null) 
			var complexType=this.getChildNodeByName(nodeDef,this.schemaPrefix+'complexType');
		else { 
			var complexType=getNodesByXPath(this.definitionDOM,nodeDef,'//'+this.schemaPrefix+'complexType[@name="'+elementType+'"]');
			if(complexType.length==0) return tags;
		}
		try{
			if (complexType.length==0) throw 'has no complexType';
			if (complexType.length>1) throw ' too many complexType';
		} catch (e) {
			openModalAlert('tag ' +nodeDef.getAttribute('name')+' '+ e.toString());
			return tags;
		}

		var mixed=complexType[0].getAttribute('mixed');
		if(mixed!=undefined)
			if(mixed=='true') tags.push([('#text'),' ']);

		var orderIndicator='sequence';
		elements=this.getChildNodeByName(complexType[0],this.schemaPrefix+'sequence'); 
		if (elements.length==0) {
			var orderIndicator='all';
			elements=this.getChildNodeByName(complexType[0],this.schemaPrefix+'all');
			if (elements.length==0) { 
				var orderIndicator='choice';
				elements=this.getChildNodeByName(complexType[0],this.schemaPrefix+'choice');
				if (elements.length==0) return tags;
			}
		}
		if (elements.length>1) throw 'tag ' +nodeDef.getAttribute('name')+' too many sequence/all/choice';
		elements=this.getChildNodeByName(elements[0],this.schemaPrefix+'element');
		var notFirst=false;
		for (var iE=0;iE<elements.length;iE++) {
			var tag=elements[iE].getAttribute('name');
			if (tag==null) tag=elements[iE].getAttribute('ref');
			attr=elements[iE].getAttribute('maxOccurs');
			if (attr!='unbounded' && node!=null)
				if((attr==null?1:attr)<=this.getChildNodeByName(node,tag).length) continue;
			tags.push([(tag),((orderIndicator=='sequence'&&notFirst)?'disabled="disabled"':' ')]);
			notFirst=true;
		}
		return tags;
	},
	addChildNode: function (i,event) {
		this.setDetailCoords(event);
		if (i==null) {
			var tags=[], tag=null;
			elements=this.getChildNodeByName(this.definitionDOM.childNodes[0],this.schemaPrefix+'element');
			for (var iE=0;iE<elements.length;iE++) {
				tag=elements[iE].getAttribute('name');
				if (tag!=null) tags.push([tag,'']);
			}
			if(tags.length=1)
				if( this.addableElements(null,this.getTagDefinition('element',tag)).length==0) {
					switch (this.parentPanel.buttonA) {
						case 'OK':
							if(this.editMode){
								this.parentPanel.setOKaction(this,this.processActionStack);
								this.actionStack.push(['parentPanelReturnTrue']);
								this.actionStack.push(['save']);
							}
					}
					this.setDisplay("<div style='width:100%;height:100%' rows='100%' cols='100%'>'" 
							+ "<table id='" + this.elementUniqueID + "_update' "
							+	"></table>"
							+ "</div>");
					this.detailNode = document.getElementById(this.elementUniqueID + "_update");
					this.updateChildNodeTag(null,tag,false);
					if(this.autoResize) this.parentPanel.size();
					return;
				}
		} else {
			var node=this.nodes[i].node;
			switch (node.nodeName) {
				case '#text':
					var tags=[];
					break;
				default:
					var nodeDef=this.getTagDefinition('element',node.nodeName);
					var tags=this.addableElements(node,nodeDef);
			}
		}
		switch (tags.length) {
			case 0:
				openModalAlert('Not child elements to add');
				return;
			case 1:
				this.updateChildNodeTag(node,tags[0][0]);
				return;
		}
		this.detailNodeReset();
		this.detailNode.style.display="block";
		
		this.detailNode.insertRow(-1).insertCell(-1).innerHTML='<h2>Select Type</h2>';
		this.detailNode.insertRow(-1).insertCell(-1).innerHTML='';
		for (var iE=0;iE<tags.length;iE++) {
			tag=tags[iE];
			this.detailNode.insertRow(-1).insertCell(-1).innerHTML='<input onmousedown="" type="button" '+tag[1]+' value="'+tag[0]+'" onclick="' + this.callThisObject + '.addChildNodeIndex('+i+',\''+tag[0]+'\')"/>';
		}
		this.detailNode.insertRow(-1).insertCell(-1).innerHTML='';
		this.detailNode.insertRow(-1).insertCell(-1).innerHTML='<input onmousedown="" type="button" value="cancel" onclick="' + this.callThisObject + '.cancel()"/>';
	},
	addChildNodeIndex: function (i,tag) {
		this.updateChildNodeTag((i==null?null:this.nodes[i].node),tag);
	},
	addRequiredElementsActions: function (node,nodeDef) {
		var elementType=nodeDef.getAttribute('type');
		if (elementType==null) var complexType=this.getChildNodeByName(nodeDef,this.schemaPrefix+'complexType');
		else var complexType=getNodesByXPath(this.definitionDOM,nodeDef,'//'+this.schemaPrefix+'complexType[@name="'+elementType+'"]');
		if (complexType.length!=1)return;
		elements=this.getChildNodeByName(complexType[0],this.schemaPrefix+'sequence');     
		if (elements.length==0) {
			elements=this.getChildNodeByName(complexType[0],this.schemaPrefix+'all');
			if (elements.length==0) return;
		}
		elements=this.getChildNodeByName(elements[0],this.schemaPrefix+'element').reverse();
		for (var iE=0;iE<elements.length;iE++) {
			var tag=elements[iE].getAttribute('name');
			if (tag==null) tag=elements[iE].getAttribute('ref');
			attr=elements[iE].getAttribute('minOccurs');
			if (this.getChildNodeByName(node,tag).length<(attr==null?1:attr)) 
				this.actionStack.push(['updateChildNodeTag',node,tag]);
		}
	},
	calculateSetNode: function (node) {
 		var nodeCtl=this.getNodeControl(node.nodeName.toLowerCase());
		var hide=node.attributes.getNamedItem('node__Hide');
		var isHidden=( hide==null ? nodeCtl.hide : (hide.nodeValue=="true") );
		var showChildren=node.attributes.getNamedItem('node__showChildren');
		var showChildren=(showChildren==null ? nodeCtl.showChildren : showChildren.nodeValue=="true");
		var id=this.setNode(node);
		node.setAttribute("node__Id",id);
		this.nodeDrawDetails[id]={
			 width: (node.childNodes.length==0?this.nodeLength:0)
			,isHidden:isHidden
			,showChildren:showChildren
			,children:0
			};
		return this.nodeDrawDetails[id];
	},
	calculateLogicaDimension: function (position) {
		if (this.logicalWidth<position.x) this.logicalWidth=position.x; 
		if (this.logicalDepth<position.y ) this.logicalDepth=position.y; 
	},

	calculateNode: function () {
		this.nodeDrawDetails=[];
		this.displayDOM = ( this.displayTransformDOM==null ? this.xmlData : getXSLTransformed(this.xmlData,this.displayTransformDOM,getActiveConnectionParameters()) );
		if(this.displayDOM.childNodes.length==0) throw 'Nothing to display';
		switch (this.show) {
			case 'Diagram' :
			case 'leftTree' :
				this.showDiagram=(this.show=="Diagram");
				this.showLeftTree=(this.show=="leftTree");
				this.calculateNodePositionsLeft(this.displayDOM.childNodes[0]);
				break;
			case 'menuTree' :
				this.calculateNodePositionsMenuTree(this.displayDOM.childNodes[0]);
				break;
		}
	},

	calculateNodePositionsLeft: function (node,parent,last) {
		if(node.nodeType==3) {
			var nodeCntl=this.getNodeControl('#text');
			if (!nodeCntl.hide) {
				temp={x: parent.position.x ,y: parent.position.y + this.nodeLength};
				this.calculateLogicaDimension(temp);
				return {position:temp,width:this.nodeLength};
			}
		}
		if(node.nodeType!=1)
			return null;
		var nodeDrawDetails=this.calculateSetNode(node);
		if(parent==null) {
			if (!nodeDrawDetails.isHidden) {
				nodeDrawDetails.position = { x: this.logicalWidth+this.nodeMargin , y: this.logicalDepth+this.nodeMargin };
				this.calculateLogicaDimension(nodeDrawDetails.position);
			}
		} else if(nodeDrawDetails.isHidden) {
			 if(node.childNodes.length==0) return last;
		} else {
			nodeDrawDetails.position  = {x: (parent.children++==0 ? parent.position.x :  this.logicalWidth+this.nodeLength ) 
		                                ,y: parent.position.y+this.nodeLength 
		                                };
			this.calculateLogicaDimension(nodeDrawDetails.position);
		    if(this.showLeftTree)
				nodeDrawDetails.connector = {from:	{x:parent.position.x+this.nodeDrawLength/2			,y:parent.position.y+this.nodeDrawLength}
											,to:	{x:nodeDrawDetails.position.x+this.nodeDrawLength/2	,y:nodeDrawDetails.position.y}};
			if(node.childNodes.length==0)
				return nodeDrawDetails;
		}
		var previous=null;
		if(nodeDrawDetails.showChildren) {
			nodeDrawDetails.child=[];
			for (var i=0;i<node.childNodes.length;i++) {
				child=this.calculateNodePositionsLeft(node.childNodes[i], ( nodeDrawDetails.isHidden ? parent : nodeDrawDetails ) , previous);
				if(child==previous) continue;
				previous=child;
				if (nodeDrawDetails.isHidden)
					parent.child[parent.child.length]=child;		
				else
					nodeDrawDetails.child[nodeDrawDetails.child.length]=child;		
			}
		}
		if (nodeDrawDetails.isHidden)
			return last; 
		for (var i=0;i<nodeDrawDetails.child.length;i++) nodeDrawDetails.width+=nodeDrawDetails.child[i].width;
		if(nodeDrawDetails.width==0) {
			nodeDrawDetails.width=this.nodeLength;
			this.calculateLogicaDimension(nodeDrawDetails.position);
			return nodeDrawDetails;
		}
		if(this.showDiagram) {
			nodeDrawDetails.position.x = nodeDrawDetails.position.x + (nodeDrawDetails.width-this.nodeLength)/2;
			for (var i=0;i<nodeDrawDetails.child.length;i++)  {
				drawChild=nodeDrawDetails.child[i];
				if (nodeDrawDetails.isHidden) 
					drawChild.connector = {from:{x:parent.position.x+this.nodeDrawLength/2,y:parent.position.y+this.nodeDrawLength}
											,to:{x:drawChild.position.x+this.nodeDrawLength/2,y:drawChild.position.y}};
				else
					drawChild.connector = {from:{x:nodeDrawDetails.position.x+this.nodeDrawLength/2,y:nodeDrawDetails.position.y+this.nodeDrawLength}
											,to:{x:drawChild.position.x+this.nodeDrawLength/2,y:drawChild.position.y}};
			}
		}
		return nodeDrawDetails;
	},

	calculateNodePositionsMenuTree: function (node,parent,last) {
		if(node.nodeType==3)
			this.calculateLogicaDimension({x:last.x, y:last.y + this.nodeLength});
		if(node.nodeType!=1)
			return last;
		var nodeDrawDetails=this.calculateSetNode(node);
		if(parent==null) 
			last={x:+this.nodeMargin,y:-this.nodeLength+this.nodeMargin};
		if (nodeDrawDetails.isHidden)
			previous=last; 
		else {
			nodeDrawDetails.position={x:last.x, y:last.y + this.nodeLength};
			if(parent!=null)
				nodeDrawDetails.connector = {from:{x:parent.position.x+this.nodeDrawLength/2 , y:parent.position.y+this.nodeDrawLength}
											,to:{x:nodeDrawDetails.position.x ,y:nodeDrawDetails.position.y+this.nodeDrawLength/2}};
			if(node.childNodes.length==0) {
				this.calculateLogicaDimension(nodeDrawDetails.position);
				return nodeDrawDetails.position;
			}
			var previous={x:nodeDrawDetails.position.x+this.nodeLength/2+this.nodeMargin,y:nodeDrawDetails.position.y};
		}
		if(nodeDrawDetails.showChildren)
			for (var i=0;i<node.childNodes.length;i++) 
				previous=this.calculateNodePositionsMenuTree(node.childNodes[i],(nodeDrawDetails.isHidden?parent:nodeDrawDetails),previous);
		if (nodeDrawDetails.isHidden)
			return previous;
		if(!nodeDrawDetails.showChildren)
			this.calculateLogicaDimension(nodeDrawDetails.position);
		return {x:previous.x-this.nodeLength/2-this.nodeMargin,y:previous.y};
	},
	cancel: function () {
		while (this.actionStack.length>0) {
			action=this.actionStack.pop();
			switch (action[0]) {
				case 'recoveryPoint' :
					if (action[1]==null) this.xmlData=null;
					else action[1].parentNode.removeChild(action[1]);
					break;
				default: 
					break;
			}
		}
		if (this.xmlData==null) {
			this.draw();
			return;
		}
		this.resize();
		this.redraw();
		this.detailNodeReset();
	},
	canvasEvent: function(event) {
		switch(event.type) {
			case 'mousemove':
				this.showNodeDetails(event);
				return;
			case 'mousedown':
				this.detailNodeReset();
				this.showNodeDetails(event);
				return;
			case 'mousedblclick':
				this.showNodeDetails(event);
				return;
		}
	},
	checkDependencies: function (attributeName) {
		var changed=[];
		for( var i=0;i<this.detailDependencies.length;i++) {
			var dep=this.detailDependencies[i];
			if(dep[1]!=attributeName) continue;
			for (var j=0;j<changed.length;j++) {if(dep[0]==changed[j]) break;}
			if(j==changed.length) changed.push(i);
		}
		for (var i=0;i<changed.length;i++) {
			var dep=this.detailDependencies[changed[i]];	
			var sqlNode=dep[2];
			var sql='';
			for (var iS=0;iS<sqlNode.childNodes.length;iS++) {
               	if(sqlNode.childNodes[iS].nodeType==3) {
               		sql+=sqlNode.childNodes[iS].nodeValue;
               		continue;
               	}
               	if(sqlNode.childNodes[iS].nodeName=="db2mc:value") {
					variable=sqlNode.childNodes[iS].getAttribute('id');
					if(variable!=null) {
						var selectNode = document.getElementById(this.elementUniqueID+'_in_'+variable);
						if (selectNode.length==0) throw 'dependencies on attribute '+attributeName+' input tag not found for variable '+variable;
						sql+=selectNode.options[selectNode.selectedIndex].text;
						continue;
					}
					var variable=sqlNode.childNodes[iS].getAttribute('xpath');
					if(variable!=null) {
						var iVA=variable.indexOf('db2mc:attr(');
						if(iVA>=0) {
							var attr=variable.substr(iVA+11);
							var iVAe=attr.indexOf(')');
							attr=attr.substr(0,iVAe);
							var selectNode = document.getElementById(this.elementUniqueID+'_in_'+attr);
							if (selectNode.length==null || selectNode.length==0) {
								//openModalAlert("logic error attribute "+attr+" not found" );
								continue;
							}
							var path =variable.substr(0,iVA)+selectNode.options[selectNode.selectedIndex].text+variable.substr(iVA+12+iVAe);
						} else var path=variable;
						var parentNode=dep[3];
						sql+=getNodeByXPath(this.xmlData,parentNode,path,"Not found").nodeValue;
						continue;
					}
				}
			}
			selectNode=document.getElementById(this.elementUniqueID+'_in_'+dep[0]);
			selectNode.parentNode.nextSibling.childNodes[0].style.display="block";
			this.postSetListAJAXRequest(dep[0],sql); 
		}
	},
	checkSchemaCallback: function (xsl,returnFunction,schemaLocation) {
		this.include[schemaLocation]=getDOMParsed(xsl);
		this.checkSchema(returnFunction);
	},
	checkSchema: function (returnFunction) {
		if(this.definitionDOM.childNodes.length<1) throw 'No nodes found in schema definition xsd';
		for(var i=0;i<this.definitionDOM.childNodes.length;i++)
			if(this.definitionDOM.childNodes[i].nodeType==1) break;
		this.schemaPrefix=this.definitionDOM.childNodes[i].nodeName;
		if (this.schemaPrefix.indexOf(':') > 0) this.schemaPrefix=this.schemaPrefix.substr(0,this.schemaPrefix.indexOf(':')+1);
		else this.schemaPrefix="";
		for(var i=0;i<this.definitionDOM.childNodes.length;i++) {
			if(this.definitionDOM.childNodes[i].nodeType!=1) continue;
			if(this.definitionDOM.childNodes[i].nodeName==this.schemaPrefix+'schema') break;
		}
		if(i==this.definitionDOM.childNodes.length) throw this.schemaPrefix+'schema tag not found in definition xsd, found: '+this.definitionDOM.childNodes[0].nodeName;
		if(this.definitionDOM.childNodes[i].nodeName!=this.schemaPrefix+'schema') throw this.schemaPrefix+'schema tag expected but not in definition xsd, found: '+this.definitionDOM.childNodes[0].nodeName;
		var includes=getNodesByXPath(this.definitionDOM,this.definitionDOM,'//'+this.schemaPrefix+'include');
		loopCnt=0;
		if(this.definitionLoaded.indexOf('<')>=0) {
			var loaded=[];
			var loadDir="";
		} else {
			var loaded=[this.definitionLoaded];
			var loadDir=loaded[0].substr(0,this.definitionLoaded.lastIndexOf('/')+1);
		} 
		while (includes.length > 0) {
			for (var i=0;i<includes.length;i++) {
				var includeNode=includes[i];
				var schemaLocation=loadDir+includeNode.getAttribute('schemaLocation');
				for (var j=0;j<loaded.length;j++) {if(loaded[j]==schemaLocation) break;}
				if(j==loaded.length) {
					loaded[loaded.length]=schemaLocation;
					if(this.include[schemaLocation]==null) {
						this.include[schemaLocation]=getDOMParsed(schemaLocation,null,this.checkSchemaCallback,this,returnFunction,schemaLocation);
						if(this.include[schemaLocation]==null) return;
					} 
					var includeDOM=this.include[schemaLocation];
					if(includeDOM.childNodes[0].nodeName!==this.schemaPrefix+'schema') throw this.schemaPrefix+'schema tag not found in include url: XSD/'+includes[i].getAttribute('schemaLocation')+', found: '+this.definitionDOM.childNodes[0].nodeName;
					var nodes=includeDOM.childNodes[0].childNodes;
					for (var j=0;j<nodes.length;j++) {
						if(nodes[j].nodeType==3) continue; 
						var newNode=nodes[j].cloneNode(true);
						includeNode.parentNode.insertBefore(newNode,includeNode);
					}
				}
				includeNode.parentNode.removeChild(includeNode);
			}
			includes=getNodesByXPath(this.definitionDOM,this.definitionDOM,'//'+this.schemaPrefix+'include');
			if(loopCnt++>100) throw 'possible loop in schema includes';
		}
		if(returnFunction!=null) eval('this.'+returnFunction);
	},
	createNodeControl: function(nodeName,base) {  
		nodeName='@'+nodeName;
		if (base==null) base='@default';
		base=(base==null?base='@default':'@'+base);
		this.nodeCntl[nodeName]=[];
		this.nodeCntl[nodeName].colour=this.nodeCntl[base].colour;
		this.nodeCntl[nodeName].hide=this.nodeCntl[base].hide;
		this.nodeCntl[nodeName].outsideLabel=this.nodeCntl[base].outsideLabel;
		this.nodeCntl[nodeName].shape=this.nodeCntl[base].shape;
		this.nodeCntl[nodeName].showChildren=(this.nodeCntl[base].showChildren==null ? this.nodeCntl['@default'].showChildren : this.nodeCntl[base].showChildren);
		this.nodeCntl[nodeName].textSizeTag=this.nodeCntl[base].textSizeTag;
		this.nodeCntl[nodeName].textSizeAttribute=this.nodeCntl[base].textSizeAttribute;
	},
	deleteNode: function (i,event) {
		this.setDetailCoords(event);
		var node=this.nodes[i].node;
		if(!confirm('Delete ' + node.nodeName )) return;
		if (node.parentNode==null) {
			this.xmlData=null;
			this.draw();
			return;
		}
		if (node.nodeName!='#text') 
			try {
				var nodeDef=this.getTagDefinition('element',node.parentNode.nodeName)
					,elementType=nodeDef.getAttribute('type');
				if (elementType==null) var complexType=this.getChildNodeByName(nodeDef,this.schemaPrefix+'complexType');
				else var complexType=getNodesByXPath(this.definitionDOM,nodeDef,'//'+this.schemaPrefix+'complexType[@name="'+elementType+'"]');
				if (complexType.length!=1) throw "Expect complextype in delete node and not found";
				var elements=this.getChildNodeByName(complexType[0],this.schemaPrefix+'sequence'); 
				if (elements.length==0) {
					elements=this.getChildNodeByName(complexType[0],this.schemaPrefix+'all');
					if (elements.length==0) elements=[];
				}
				if (elements.length==1) elements=elements[0].children;
				for (var iE=0;iE<elements.length;iE++) {
					var tag=elements[iE].getAttribute('name');
					if (tag==null) tag=elements[iE].getAttribute('ref');
					if (node.nodeName!=tag) continue;
					attr=elements[iE].getAttribute('minOccurs');
					if ((this.getChildNodeByName(node.parentNode,tag).length-1)<(attr==null?1:attr)) 
						throw 'Parent '+node.parentNode.nodeName+ ' requires minimum of ' +(attr==null?1:attr)+' to exist';
					break;							
				}
			} catch (e) {
				openModalAlert(e.toString());
				return
			}
		node.parentNode.removeChild(node);
		this.detailNodeReset();
		this.resize();
		this.redraw();
	},
	detailNodeReset: function () {
		this.detailNode.style.display="none";
		while (this.detailNode.rows.length> 0) {this.detailNode.deleteRow(0);}
	},
	draw: function() {
		if(--this.loadCount>0) return;
		if(this.nodeCntl==null) {
			this.setError('logic error node control not set');
			return;
		}
		if (this.edit!=null) {this.edit.size();return;}
		var menu=[];
		this.menuOptions(menu);
		this.parentPanel.setContent(null, this.chartTitle, null, null, menu);
		this.loadMenus();
		this.loadContextMenus();
		this.getData();
	},
    drawLine: function(line,startPoint,endPoint) {
        this.ctx.strokeStyle = line.colour;
        this.ctx.lineWidth =line.width;
        this.ctx.beginPath();
        this.ctx.moveTo(this.zoomRefactor(startPoint.x),this.zoomRefactor(startPoint.y));
        switch (line.path) {
            case 'border':
            	switch (this.show) {
            		case 'menuTree':
	                	if (startPoint.x <= endPoint.x) {
    	                	this.ctx.lineTo(this.zoomRefactor(startPoint.x),this.zoomRefactor(startPoint.y+this.nodeMargin));
 //       	           		this.ctx.lineTo(this.zoomRefactor(endPoint.x-this.nodeMargin) ,this.zoomRefactor(startPoint.y+this.nodeMargin));
        	           		this.ctx.lineTo(this.zoomRefactor(startPoint.x) ,this.zoomRefactor(endPoint.y));
            	    	} else {
    	                	this.ctx.lineTo(this.zoomRefactor(startPoint.x),this.zoomRefactor(startPoint.y-this.nodeMargin));
//        	           		this.ctx.lineTo(this.zoomRefactor(endPoint.x+this.nodeMargin) ,this.zoomRefactor(startPoint.y-this.nodeMargin));
        	           		this.ctx.lineTo(this.zoomRefactor(startPoint.x+this.nodeMargin) ,this.zoomRefactor(endPoint.y));
                		}
            			break;
            		default:
	                	if (startPoint.y <= endPoint.y) {
    	                	this.ctx.lineTo(this.zoomRefactor(startPoint.x),this.zoomRefactor(startPoint.y+this.nodeMargin));
        	           		this.ctx.lineTo(this.zoomRefactor(endPoint.x) ,this.zoomRefactor(startPoint.y+this.nodeMargin));
            	    	} else {
                	    	this.ctx.lineTo(this.zoomRefactor(startPoint.x),this.zoomRefactor(startPoint.y-this.nodeMargin));
                   			this.ctx.lineTo(this.zoomRefactor(endPoint.x) ,this.zoomRefactor(startPoint.y-this.nodeMargin));
                		}
                }
                break;
            case 'direct':
            default:
                break;
        }
        this.ctx.lineTo(this.zoomRefactor(endPoint.x) ,this.zoomRefactor(endPoint.y));
        this.ctx.stroke();
    },
	drawMenu: function(node) {
		if(node.nodeType==3) {
			var nodeCntl=this.getNodeControl('#text');
			if (nodeCntl.hide) return;
			this.menuOutput+="<tr>";
			this.drawMenuNode(nodeCntl,node);
			this.menuOutput+="</tr>";
			return;
		}
		if(node.nodeType!=1) return;
		this.menuOutput+="<tr>";
		var nodeCntl=this.getNodeControl(node.nodeName.toLowerCase());
		var nodeHide=node.attributes.getNamedItem('node__Hide');
		if(!(nodeHide==null?nodeCntl.hide:(nodeHide.nodeValue=="true")))
			this.drawMenuNode(nodeCntl,node);
		if(node.childNodes.length>0) {
			this.menuOutput+="<td><table>";
			for (var i=0;i<node.childNodes.length;i++)
				this.drawMenu(node.childNodes[i]);
			this.menuOutput+="</table></td>";
		}
		this.menuOutput+="</tr>";
    },
	drawMenuNode: function(nodeCntl,node) {
		var attributes="";
		switch (node.nodeType) {
			case 1:
				this.menuOutput+="<td>"+node.nodeName.toTitle()+"</td>";
				if (node.attributes!=null)
					for (var i=0;i<node.attributes.length;i++) {
						if(this.isAttributeNodeControl(node.attributes[i].nodeName)) continue;
						attributes+="<tr><td>"+node.attributes[i].nodeNametoTitle()+"</td><td>"+node.attributes[i].nodeValue+"</td></tr>";
					}
				break;
		}
		if(attributes!="")
			this.menuOutput+="<td><table>"+attributes+"<tr>";
		if(node.nodeValue!=null)
			this.menuOutput+=	"<td>"+node.nodeValue+"</td>";
		if(attributes!="")
			this.menuOutput+="</tr><table></td>";
	},
	drawNode: function(node,position) {
		if(node.nodeType!=1) { 
			if(node.nodeType==3) {
				var nodeCntl=this.getNodeControl('#text');
				if (nodeCntl.hide) return;
				switch (this.show) {
					case 'menuTree' :
						var nodeYPosition=position.y;
						var nodeXPosition=position.x+this.nodeLength+this.nodeMargin;
						var lineYStart=position.y+this.nodeDrawLength/2-this.nodeMargin;
						var lineXStart=position.x+this.nodeDrawLength;
						var lineYEnd=lineYStart+this.nodeMargin;;
						var lineXEnd=nodeXPosition;
						break;
					case 'leftTree' :
					default:
						var nodeYPosition=position.y+this.nodeLength+this.nodeMargin;
						var nodeXPosition=position.x;
						var lineYStart=position.y+this.nodeDrawLength;
						var lineXStart=position.x+this.nodeDrawLength/2;
						var lineYEnd=nodeYPosition;
						var lineXEnd=nodeXPosition+this.nodeDrawLength/2;;
				}
				
				this.drawLine({colour:"black",width:1,path:this.linePath},{x:lineXStart,y:lineYStart},{x:lineXEnd,y:lineYEnd});
				this.drawNodeCanvas(nodeCntl,node,{x:nodeXPosition,y:nodeYPosition}
					,this.setNodeCanvasArea( node
											,position
											,{x:nodeXPosition+this.nodeDrawLength,y:nodeYPosition+this.nodeDrawLength}));
			}  
			return;
		}
		var nodeID=node.attributes.getNamedItem('node__Id');
        if(nodeID!=null) {
			var id=nodeID.nodeValue;
			var nodeDrawDetails=this.nodeDrawDetails[id];
			if(nodeDrawDetails.position!=null) {
				var nodeCntl=this.getNodeControl(node.nodeName.toLowerCase());
				this.ctx.strokeStyle = "black";
				this.ctx.lineWidth=1;
				this.drawNodeCanvas(nodeCntl,node,nodeDrawDetails.position
					,this.setNodeCanvasArea(node
				                       ,nodeDrawDetails.position 
				                       ,{x:nodeDrawDetails.position.x+this.nodeDrawLength,y:nodeDrawDetails.position.y+this.nodeDrawLength}));
				if(nodeDrawDetails.connector) 
					this.drawLine((node.attributes.getNamedItem('node__max')==null?{colour:"black",width:1,path:this.linePath}:{colour:"red",width:3,path:this.linePath})
						,nodeDrawDetails.connector.from,nodeDrawDetails.connector.to);
			}
			if(!nodeDrawDetails.showChildren)
				return;
		}
		for (var i=0;i<node.childNodes.length;i++) 
			this.drawNode(node.childNodes[i],(nodeDrawDetails==null||nodeDrawDetails.position==null?position:nodeDrawDetails.position));
		return;
	},
	drawNodeCanvasHideChildrenShape: function(nodeCntl,node) {
		if(nodeCntl.shapeWhenHiddenChildren==null) return false;
		var attrValue=node.getAttribute('node__showChildren');
		if(attrValue==null) return false;
		return attrValue!="true";
	},
	drawNodeCanvas: function(nodeCntl,node,position,iNode,refreshInterval) {
		this.ctx.fillStyle = this.getNodeCntlValue(node,'Colour',nodeCntl.colour);
		this.ctx.strokeStyle = "black";
		var loading=node.getAttribute('node__loading');
		if(loading) 
			this.drawShape('loading',position);
		else {
			var shape=node.getAttribute('node__shape');
			this.drawShape(	(shape==null||shape==""
							?this.getNodeCntlValue(node
											,'Shape'
											,(this.drawNodeCanvasHideChildrenShape(nodeCntl,node)?nodeCntl.shapeWhenHiddenChildren:nodeCntl.shape)
											)
							:shape)
						,position
						,node.getAttribute('node__image'));
		}
		var textXPosition=position.x + 5;
		var textYPosition=position.y + 12;
		this.ctx.textAlign='left';
		this.ctx.fillStyle = "black";
		this.ctx.font = this.zoomRefactor(nodeCntl.textSizeTag)+"pt/"+this.zoomRefactor(nodeCntl.textSizeTag*1.2)+"pt sans-serif";
		switch (node.nodeType) {
			case 1:
				this.drawLabel(node.nodeName.toTitle(), textXPosition,textYPosition);
				break;
			case 3:
				this.drawLabel('Text', textXPosition,textYPosition);
				break;
			default:
				break;
		}
		textYPosition+= nodeCntl.textSizeTag*1.3;
		var textSpace=nodeCntl.textSizeAttribute*1.2;
		this.ctx.font = this.zoomRefactor(nodeCntl.textSizeAttribute)+"pt/"+this.zoomRefactor(textSpace)+"pt sans-serif";
		if (node.attributes==null)
			this.drawLabel(node.nodeValue, textXPosition,textYPosition);
		else 
			for (var i=0;i<node.attributes.length;i++) {
				if(this.isAttributeNodeControl(node.attributes[i].nodeName)) continue;
				if (textYPosition>position.y+this.nodeDrawLength-textSpace) {
					this.drawLabel("...", textXPosition,textYPosition);
					break;
				}
				this.drawLabel(node.attributes[i].nodeName.toTitle()+" : "+node.attributes[i].nodeValue, textXPosition,textYPosition);
				textYPosition+= textSpace*1.2;
			}
		if(node.nodeType==1 && nodeCntl.outsideLabel.xpath!=null) {
			this.ctx.font = this.zoomRefactor(nodeCntl.outsideLabel.font.size)+"px "+ nodeCntl.outsideLabel.font.family ;
            switch (this.show) {
            	case 'menuTree':
           			var textXPosition=position.x+this.nodeLength;
           			var textYPosition=position.y+this.nodeLength/2+this.nodeMargin;
            		break;
          		default:
					var	textXPosition=position.x+this.nodeMargin+5;
        		   	var	textYPosition=position.y;
            }
            var label=node.getAttribute('node__outsideLabel');
            if(label!=null)
            	if(label.length>0)
					this.ctx.fillText(label , this.zoomRefactor(textXPosition),this.zoomRefactor(textYPosition));
		}
		if (!this.allNodes) 
			if (this.definitionDOM!=null && textYPosition <= position.y + this.nodeDrawLength-textSpace )
				if (node.childNodes.length==1)
					switch (node.nodeType) {
						case 3:
							this.drawLabel((node.childNodes.length==1?node.childNodes[0].nodeValue:''), textXPosition,textYPosition);
							break;
					}
		if(this.nodes.length > this.refreshMaxNodes ) return;
		if (refreshInterval==null) {
			refreshInterval = this.getNodeCntlValue(node,'refreshInterval',nodeCntl.refreshInterval);
			if (refreshInterval==null) return;
		}
		try{
			this.nodeRefresh[iNode]=setTimeout(this.callThisObject+".redrawNodeCanvas("+iNode+","+refreshInterval+")",refreshInterval);
		} catch(e) {}
	},
	drawLabel: function(label,textXPosition,textYPosition,maxSize) {
		var labelText=label;
		if (maxSize==null) maxSize=this.nodeDrawLength-4;
		var maxTarget=this.zoomRefactor(maxSize);
		if (this.ctx.measureText(labelText).width>maxTarget)
			for (var i=label.length;this.ctx.measureText(labelText).width>maxTarget;i--)  labelText=labelText.substr(0,i)+'..';
		this.ctx.fillText(labelText , this.zoomRefactor(textXPosition),this.zoomRefactor(textYPosition));
	},
    drawShape: function(shapeName,position,image) {
        if (image!=undefined) {
        	shapeSelected  ={'image':image};
        } else { 
        	if (shapeName=='square') {
        		this.ctx.strokeRect(this.zoomRefactor(position.x),this.zoomRefactor(position.y),this.zoomRefactor(this.nodeDrawLength),this.zoomRefactor(this.nodeDrawLength));
        		this.ctx.fillRect(this.zoomRefactor(position.x),this.zoomRefactor(position.y),this.zoomRefactor(this.nodeDrawLength),this.zoomRefactor(this.nodeDrawLength));
        		return;
        	}
        	var shapeSelected=this.shape[shapeName];
        	if (shapeSelected==undefined) {
        		this.setError('shape "'+shapeName+'" not found');
        		throw 'shape "'+shapeName+'" not found';
        	}
        }
        this.ctx.save();
        if (shapeSelected.image!=null) {
            if (chartImages[shapeSelected.image]==undefined) {
                chartImages[shapeSelected.image] = new Image(); 
                chartImages[shapeSelected.image].src = shapeSelected.image;
                chartImages[shapeSelected.image].onload=new Function(this.callThisObject + ".redraw()");
                return;
            } 
            try {
            	this.ctx.drawImage(chartImages[shapeSelected.image], this.zoomRefactor(position.x), this.zoomRefactor(position.y), this.zoomRefactor(this.nodeDrawLength), this.zoomRefactor(this.nodeDrawLength));
			} catch (e) {
				this.drawShape('square',position);
			}
        }
        if  (shapeSelected.length>0) {       
            this.ctx.beginPath();
            this.ctx.moveTo(this.zoomRefactor(position.x+shapeSelected[0].x),this.zoomRefactor(position.y+shapeSelected[0].y));
            for (var i=1;i<shapeSelected.length;i++) {
                if (shapeSelected[i].cx==null)
                	this.ctx.lineTo(this.zoomRefactor(position.x+shapeSelected[i].x),this.zoomRefactor(position.y+shapeSelected[i].y));
                else 
                    this.ctx.quadraticCurveTo(this.zoomRefactor(position.x+shapeSelected[i].cx),this.zoomRefactor(position.y+shapeSelected[1].cy),this.zoomRefactor(position.x+shapeSelected[i].x),this.zoomRefactor(position.y+shapeSelected[i].y));
            }
            this.ctx.lineTo(this.zoomRefactor(position.x+shapeSelected[0].x),this.zoomRefactor(position.y+shapeSelected[0].y));
            this.ctx.closePath();
            this.ctx.fill();
        }
        this.ctx.stroke();
        this.ctx.restore();
    },
	getAttributes4Node: function (node) {
		var references=getNodesByXPath(this.definitionDOM,node,"./"+this.schemaPrefix+"attributeGroup/@ref");
		var returnValue = [];
		for(var i=0;i<references.length;i++)
			returnValue=returnValue.concat(getNodesByXPath(this.definitionDOM,node,"/"+this.schemaPrefix+"schema"+"/"+this.schemaPrefix+"attributeGroup[@name='"+references[i].nodeValue+"']/"+this.schemaPrefix+"attribute"));
    	return returnValue.concat(getNodesByXPath(this.definitionDOM,node,"./"+this.schemaPrefix+"attribute"));
	},
	getChildNodeByName: function (node,name) {
		var nodes=[];
		for (var i=0;i<node.childNodes.length;i++)
			if(node.childNodes[i].nodeName==name) nodes.push(node.childNodes[i]);
		return nodes;
	},
	getCostNode: function (attrName,node) {
		if (node.attributes!=null) {
			var nodeCost=node.attributes.getNamedItem(attrName);
			if (nodeCost!=null) return parseFloat(nodeCost.value);
		}
		if(node.childNodes.length==0) return 0;
		if(node.childNodes.length==1) return this.getCostNode(attrName,node.childNodes[0]);
		this.getCostNode(attrName,node.childNodes[this.getGreatestCostNode(attrName,node)]);	
	},
	getData: function() {
		this.setLoading();
		switch (this.sourceType) {
			case 'element' :
				this.updateData(this.source.value);
				break;
			case 'xmlData' :
				this.updateData(this.source);
				break;
			case 'SQL' :
				this.postGetXMLDataAJAXRequest('getSQLValue',this.source);
				break;
			case 'JSON' :
				this.postGetXMLDataAJAXRequest(this.source,"");
				break;
			case 'MENU' :
				this.postGetMenu(this.source);
				break;
			default:
  				this.setError('unknown source type: '+this.sourceType);
  				return;
		}
	},
	getGreatestCostNode: function (attrName,node) {
		var nodeMaxCost=this.getCostNode(attrName,node.childNodes[0]);
		var nodeMax=0;
		for (var i=1;i<node.childNodes.length;i++) {
			nodeCost=this.getCostNode(attrName,node.childNodes[i]);	
			if (nodeCost>nodeMaxCost) {
				nodeMaxCost=nodeCost;
				nodeMax=i;
			} 
		}
		return nodeMax;
	},
	getNodeById: function(nodeId) {
		return getNodeByXPath(this.xmlData,this.xmlData,"//*[@node__Id='"+nodeId+"']");
	},
	getNodeControl: function(nodeName) {
		if (this.nodeCntl['@'+nodeName] ==null) return this.nodeCntl['@default'];
		return this.nodeCntl['@'+nodeName];
	},
	getNodeCntlValue: function(node,attr,defaultValue) {
		if (node.attributes==null) return defaultValue;
		var nodeAttr=node.attributes.getNamedItem('node__'+attr);
		if (nodeAttr==null) return defaultValue;
		return nodeAttr.nodeValue;
	},
	getNodeForCanvasEvent : function(callingEvent) {
		for (var iN=0;iN<this.nodes.length;iN++) {
		    var xPos = callingEvent.clientX - this.canvasOffset[0]+this.canvas.parentNode.scrollLeft;
		    var xPosRefactored = xPos/this.zoomRatio;
		    var nodesCurrent=this.nodes[iN];
		    if(!xPosRefactored.between(nodesCurrent.xMin,nodesCurrent.xMax)) continue;
		    var yPos = callingEvent.clientY - this.canvasOffset[1]+this.canvas.parentNode.scrollTop
		    	,yPosRefactored = yPos/this.zoomRatio;
			if (!yPosRefactored.between(nodesCurrent.yMin,nodesCurrent.yMax)) continue;
			this.currentNode=nodesCurrent.node;
			return {id : iN , x: xPos, y: yPos , node: nodesCurrent.node };
		}
	},
	getParameterBoolean: function(parameter,xpath,trueValue) {
		var settingValue=getNodeByXPath(this.settingsDOM,this.settingsDOM,'/settings/'+(xpath==null?parameter:xpath));
		if(settingValue!=null)
			this[parameter]=(settingValue.nodeValue==trueValue);
		if(this.callParameters['$'+parameter]!=null)
			this[parameter]=(this.callParameters['$'+parameter]==trueValue);
		if(this[parameter]==null) this[parameter]=false;
	},

	getParameter: function(parameter,xpath,defaultValue) {
		var settingValue=getNodeByXPath(this.settingsDOM,this.settingsDOM,'/settings/'+(xpath==null?parameter:xpath));
		if(settingValue!=null)
			this[parameter]=settingValue.nodeValue;
		if(this.callParameters['$'+parameter]!=null)
			this[parameter]=this.callParameters['$'+parameter];
		if(this[parameter]!=null) return;
		if(defaultValue==undefined) return; 
		this[parameter]=defaultValue;
	},
	
	getSchemaCallback: function (xml) {
		if(xml==null) {
			alert('getSchemaCallback: xml is null');
			return;
		}
	    if(typeof xml == 'string')
		    this.definitionLoaded=xml;
	    else
	    	this.definitionDOM=xml;
		this.getSchema();
	},
	
	getSchema: function (returnFunction) {
		switch (this.definition.split(" ",1)[0].toLowerCase()) {
			case 'select':
			case 'with':
				this.postGetXMLDataAJAXRequest('getSQLValue',this.definition,'storeSchema',returnFunction);
				return;
			default:
				if(this.definitionLoaded==undefined) this.definitionLoaded=this.definition;
				if(this.definitionDOM==null)
					if(typeof this.definitionLoaded == 'string')
						this.definitionDOM=getDOMParsed(this.definitionLoaded,null,this.getSchemaCallback,this);
				if(this.definitionDOM==null) return;
				this.checkSchema('draw()');
		}
	},
	
	getTagDefinition: function (tag,name) {
		if(this.definitionDOM==null) return;
		var elements=this.definitionDOM.getElementsByTagName(this.schemaPrefix+tag);
		for (var iE=0;iE<elements.length;iE++) {
			var attr=elements[iE].getAttribute('name');
			if (attr==name) break;		
		}
		if(iE>=elements.length) 
			this.setThrowError('tag "' +name+'" of type "'+tag+'" not found in definition, is the definition correct?');
		return elements[iE];
	},
	hasAddableChildren: function (node,nodeDef) {
		if (node.nodeType!=1) return false; 
		return (this.addableElements(node,(nodeDef==null?this.getTagDefinition('element',node.nodeName):nodeDef)).length>0)
	},
	isAttributeTypeValueOK: function (type,value) {
		var typeParts = type.split(":");
		if(typeParts.length>1) {
			if(typeParts[0]!=this.schemaPrefix) return;
			typeBase=typeParts[1];
		} else
			typeBase=type;
		if(this["validateA"+typeBase]==undefined) return;
		this["validateA"+typeBase](value);
	},
	isAttributeTypeNumber: function (type) {
        switch (type) {
			case this.schemaPrefix+'string':
			case this.schemaPrefix+'hexBinary':		
			case this.schemaPrefix+'time':		
			case this.schemaPrefix+'date':		
			case this.schemaPrefix+'dateTime':		
			case this.schemaPrefix+'normalizedString':		
				return false;
		}
        return true;
	},
	isAttributeValueOK: function (simpleTypeName,value) {
		if (typeof simpleTypeName == 'string')
			simpleType=getNodesByXPath(this.definitionDOM,this.definitionDOM,'//'+this.schemaPrefix+'simpleType[@name="'+simpleTypeName+'"]');
		else simpleType=simpleTypeName;
		if(simpleType.length!=1) return this.isAttributeTypeValueOK(simpleTypeName,value); 	
		restriction=this.getChildNodeByName(simpleType[0],this.schemaPrefix+'restriction');
		if(restriction.length>1) throw "geAttributeRestictions too many restrictions";
		if(restriction.length==1) {
			var base=restriction[0].getAttribute('base');
			error=this.isAttributeTypeValueOK(base,value);
			if(error!=null) return error; 
			if(this.isAttributeTypeNumber(base)) value=new Number(value);
			for (var iR=0;iR<restriction[0].childNodes.length;iR++) {
				var nodeRestriction=restriction[0].childNodes[iR];
				if(nodeRestriction.nodeType!=1) continue;
				var restrictionName=nodeRestriction.nodeName;
				if(this["validateRestriction_"+restrictionName]!=undefined)
					this["validateRestriction_"+restrictionName](value
																 , ( this.isAttributeTypeNumber(base) ? new Number(nodeRestriction.getAttribute('value')) : nodeRestriction.getAttribute('value') )
																 );
			}
		}
		union=this.getChildNodeByName(simpleType[0],this.schemaPrefix+'union');
		if(union.length==1) {
			var errors=[];
			var memberTypes=union[0].getAttribute('memberTypes').split(' ');
			for(type in memberTypes){
				try{
					errors.push(this.isAttributeValueOK(memberTypes[type],value));
				} catch(e) {
					errors.push(e.toString())
				}
				if (errors[type]==null) return;
			}
			return errors.join(' or ');
		}
		if(union.length>1) 
			throw "Attribute restrictions has too many unions";
	},
	isAttributeNodeControl: function(nodeName) {
		return  nodeName.substr(0,6)=='node__' || nodeName.substr(0,2)=='__';
	},
	loadMenusPost: function(menuDirectory,parentPanel) {
		if (menuDirectory==null) return;
		var thisObject = this;
		POSTDATA = {
			 uniqueID 		: this.elementUniqueID
			,stageID 		: this.parentStageID
			,windowID 		: this.parentWindowID
			,panelID 		: this.parentPanelID
			,returntype 	: 'JSON'
			,baseMenuFolder	: menuDirectory
			,defaultStage 	: this.elementUniqueID + "_stage"
			,action			: "menu"
			,USE_CONNECTION	: getActiveDatabaseConnection()
		};
		new Ajax.Request(ACTION_PROCESSOR, {
				'parameters': POSTDATA,
				'method': 'post',
				'onCreate': function() {
				},
				'onSuccess': function(transport) {
					var menu = transport.responseJSON;
					if(menu.length != 0)
						if(menu[0].elementPageWindows != null || menu[0].elementLinkList != null) 
							loadDecodedPage(menu[0].elementPageWindows, menu[0].elementLinkList);
					thisObject.menuOptions(menu);
					parentPanel.setWindowTitle(thisObject.chartTitle,menu,null);
					getWindow(thisObject.parentStageID, thisObject.parentWindowID ).setWindowTitle(thisObject.chartTitle,menu,null);
				},
				'onFailure': function(transport,error) {
					thisObject.setError("Error Loading Menu, error: "+ error);
				}
		});
	},
	loadContextMenus: function() {
		this.loadMenusPost(this.contextMenuDirectory,this.parentPanel);
	},
	loadMenus: function() {
		this.loadMenusPost(this.menuDirectory,getWindow(this.parentStageID, this.parentWindowID));
	},
	menuOptions: function(menuArray) {
		var hideAbleNodes="";
		for (nodeType in this.nodeCntl) {
			if(this.nodeCntl[nodeType].hideAble) {
				hideAbleNodes+='<tr><td>'
									+nodeType.substr(1)
								+'<input type="button" value="'
												+(this.nodeCntl[nodeType].hide?'show':'hide')
										+'" onclick="this.value='+this.callThisObject + '.toggleHideNode('+"'"  + nodeType.substr(1) +"'" + ',this.value)"/></td></tr>';
			}
		}
		if(this.optionsDialog==null) {
			this.optionsDialog = new floatingPanel(this.elementUniqueID + '_optionsDialog', 'RAW', "", this.elementUniqueID + '_optionsDialog_button', false, false);
			this.parentPanel.registerNestedObject(this.elementUniqueID + '_optionsDialog', this.optionsDialog);
			this.optionsDialog.draw();
			this.optionsDialog.setContent('<table>'
							+'<tr><td>Zoom</td>'
							+	'<td><table><tr><td><select onchange="' + this.callThisObject + '.setZoomRatio(this.value)">'
							+				'<option value="0.1">10</option>'
							+				'<option value="0.2">20</option>'
							+				'<option value="0.5">50</option>'
  							+				'<option value="1" selected="selected">100</option>'
  							+				'<option value="1.5">150</option>'
  							+				'</select></td>'
				   			+			'<td><img src="images/minus.gif" alt="in" onclick="' + this.callThisObject + '.setZoomAdjust(0.9);"/></td>'
				   			+			'<td><img src="images/plus.gif" alt="out" onclick="' + this.callThisObject + '.setZoomAdjust(1.1);"/></td></tr></table></td>'
				   			+		'<td><input type="button" value="Auto Fit" onclick="' + this.callThisObject + '.setFit2Panel();' + this.callThisObject + '.redraw();"/></td>'
							+ 	'</td></tr>'   
							+'<tr><td>Line path</td><td>'
							+ 		'<select onchange="' + this.callThisObject + '.setLinePath(this.value)">'
							+			'<option value="direct" '+(this.linePath=='direct'?'selected="selected"':'')+'>Direct</option>'
							+			'<option value="border" '+(this.linePath=='border'?'selected="selected"':'')+'>vertical/horizontal</option>'
  							+		'</select>'
							+ 	'</td></tr>'   
							+ 	hideAbleNodes
				   			+	(this.editMode?'<tr><td><input type="button" value="Edit via Report" onclick="' + this.callThisObject + '.redraw(\'EditViaReport\')"/></td></tr>':'')
				   			+	(this.originalXML==null?'':'<tr><td><input type="button" value="Show source XML" onclick="' + this.callThisObject + '.redraw(\'SourceXML\')"/></td></tr>')
				   			+	'<tr><td><input type="button" value="Show displayed XML" onclick="' + this.callThisObject + '.redraw(\'DisplayXML\')"/></td></tr>'
				   			+	'<tr><td><input type="button" value="Balanced Tree" onclick="' + this.callThisObject + '.setCanvas();' + this.callThisObject + '.redraw(\'Diagram\');"/></td>'
				   			+		'<td><input type="button" value="Left Tree" onclick="' + this.callThisObject + '.setCanvas();' + this.callThisObject + '.redraw(\'leftTree\');"/></td>'
				   			+		'<td><input type="button" value="Menu Tree" onclick="' + this.callThisObject + '.setCanvas();' + this.callThisObject + '.redraw(\'menuTree\');"/></td></tr>'
				   			+	'<tr><td><input type="button" value="Show Menu" onclick="' + this.callThisObject + '.setCanvas();' + this.callThisObject + '.redraw(\'Menu\');"/></td></tr>'
							+	(this.report==null||this.report==''?'':'<tr><td><input type="button" value="Show report" onclick="' + this.callThisObject + '.redraw(\'Report\')"/></td></tr>')
							+'</table>'
							, 'Options', null, null, null);
		}
		if(this.save!=null)
			menuArray.push({
				nodeType : "leaf",
				elementID : this.elementUniqueID + '_saveDialog_button',
				elementValue : "Save",
				elementAction : 'onClick="' + this.callThisObject + '.saveNode()"'
			});
		menuArray.push({
				nodeType : "leaf",
				elementID : this.elementUniqueID + '_optionsDialog_button',
				elementValue : "Options",
				elementAction : 'onClick="FLOATINGPANEL_activeFloatingPanels.get(\'' + this.elementUniqueID + '_optionsDialog\').show_and_size(\'' + this.elementUniqueID + '_optionsDialog_button\');"'
		});
		return menuArray;
	},
	menuSchema: function(menuArray) {
		if(menuArray==null) var menuArray=[];
		if(this.viewSchema==null) {
			this.viewSchema = new floatingPanel(this.elementUniqueID + '_viewSchema', 'RAW', "", this.elementUniqueID + '_viewSchema_button', false, false);
			this.parentPanel.registerNestedObject(this.elementUniqueID + '_viewSchema', this.viewSchema);
			this.viewSchema.draw();
			this.viewSchema.setContent(
					'<textarea class="text" cols="80" rows="20" wrap="false" />'
					+ this.definitionLoaded
					+ '</textarea>'
				, 'Schema', null, null, null);
		}
		menuArray.push({
				nodeType : "leaf",
				elementID : this.elementUniqueID + '_viewSchema_button',
				elementValue : "Schema",
				elementAction : 'onClick="FLOATINGPANEL_activeFloatingPanels.get(\'' + this.elementUniqueID + '_viewSchema\').show_and_size(\'' + this.elementUniqueID + '_viewSchema_button\');"'
		});
		return menuArray;
	},
	nextSequence: function (name) {
		if(this.sequence==null) this.sequence=[];
		if (this.sequence['@'+name]==null) { 
			this.sequence['@'+name]=1;
			return 1;
		}
		return ++this.sequence['@'+name];
	},
	nextSequenceAlpha: function (name) {
		var value='';
		for(var i=this.nextSequence(name);i>0;i=Math.floor(i/26)) 
			value+=' abcdefghijklmnopqrstuvwxyz'.substr(i-Math.floor(i/26)*26,1);
		return value;	
	},
	postSetListAJAXRequest: function(attributeName,sql) {
		if(this.lists==undefined) this.lists=[];
		for(var i=0;i<this.lists.length;i++)
			if(this.lists[i].sql==sql) {
				this.setAttributeList(attributeName,i)
				return;
			}
		var thisObject = this;
		POSTDATA = {
			 returntype		: 'JSON'
			,SQL			: sql+" fetch first 100 rows only for read only"
			,action			: 'executeSQL'
			,USE_CONNECTION : getActiveDatabaseConnection()
		}
		new Ajax.Request(ACTION_PROCESSOR, {
			'parameters': POSTDATA,
			onSuccess: function(transport) {
				var selectNode = document.getElementById(thisObject.elementUniqueID+'_in_'+attributeName);
				if (selectNode==null) return;
				if (thisObject.isUpdate) for (var i=selectNode.length-1;i>=1;i--) {selectNode.remove(selectNode.i);}
				else for (var i=selectNode.length-1;i>=0;i--) {selectNode.remove(selectNode.i);}
				selectNode.parentNode.nextSibling.childNodes[0].style.display="none";
				var result = transport.responseJSON;
				try{
					if(result == null) throw "An invalid JavaScript object was returned";
					if(result.flagGeneralError == true && result.connectionError == true) initiateConnectionRefresh();
					if(result.flagGeneralError == true || result.returnCode == "false" || result.returnCode == false) 
						throw (Object.isString(result.returnValue)?result.returnValue:result.returnValue.STMTMSG);
				} catch(e) {
					var error=document.createElement('a');
					error.innerHTML=e;
					selectNode.parentNode.nextSibling.appendChild(error);
					return;
				}
				i=thisObject.lists.length;
				thisObject.lists[i]={resultSet:result.returnValue.resultSet[0]
									,sql:sql
									};
				thisObject.setAttributeList(attributeName,i);
			},
			onComplete: function(transport) {
			}
		});
	},
	setAttributeList: function(attributeName,listIndex) {
		resultSet=this.lists[listIndex].resultSet;
		var selectNode = document.getElementById(this.elementUniqueID+'_in_'+attributeName);
		if (selectNode==null) return;
		selectNode.parentNode.nextSibling.childNodes[0].style.display="none";
		if (this.isUpdate) for (var i=selectNode.length-1;i>=1;i--) {selectNode.remove(selectNode.i);}
		else for (var i=selectNode.length-1;i>=0;i--) {selectNode.remove(selectNode.i);}
		for (var i=1;i<resultSet.data.length;i++) {
			var opt=document.createElement('option');
			opt.text=resultSet.data[i];
			try{selectNode.add(opt,null);} catch (e) {selectNode.add(opt);}
		}
		this.checkDependencies(attributeName);
		
	},
	postGetMenu: function(baseMenuFolder) {
		var thisObject = this;
		var parameters = {
			 baseMenuFolder	: baseMenuFolder
			,USE_CONNECTION	: getActiveDatabaseConnection()
			,returntype		: "JSON"
		};
		new Ajax.Request(MENU_PROCESSOR, {
			'parameters': parameters,
			'method': 'post',
			'onComplete': function(transport) {
				},
			'onSuccess': function(transport) {
				if(transport.responseJSON==null) {
					thisObject.setError('Menus not found in '+parameters.baseMenuFolder);
					openModalAlert('Menus not found in '+parameters.baseMenuFolder);
				}
				if(thisObject.sourceJsonRoot==null)
					thisObject.getParameter('sourceJsonRoot',null,'json');
				thisObject.updateData(json2xml(thisObject.sourceJsonRoot,transport.responseJSON,null,(thisObject.json2xmlHexObject==undefined?null:thisObject.json2xmlHexObject)),true);
				},
			'onFailure': function(transport) {
				thisObject.setError('Failure in postGetMenu');
				openModalAlert('Failure in postGetMenu');
				},
			'onException': function(transport,exception) {
				var error = (exception==null ? transport.statusText : ( typeof(exception)=="object" ? exception.message : exception ));
				thisObject.setError(error);
				openModalAlert('Error in postGetMenu '+error);
				}
		});
	},
	postGetXMLDataAJAXRequest: function(action,query,processFunction,functionArg) {
		var thisObject = this;
		var thisProcessFunction = (processFunction==undefined?'updateData':processFunction);
		var thisFunctionArg=functionArg;
		POSTDATA = {
			 returntype		: 'JSON'
			,action			: action
			,USE_CONNECTION : getActiveDatabaseConnection()
		};
		if(Object.isString(query)) 
			POSTDATA.query      	= query;
		else {
			var i=0;
			query.each(function(value) {POSTDATA['query[' + (i++) + ']'] = value;});
		}
		if(this.exitSQL!=null) 
			POSTDATA.exitSQL=this.exitSQL;
		new Ajax.Request(ACTION_PROCESSOR, {
			'parameters': POSTDATA,
			onSuccess: function(transport) {
				var result = transport.responseJSON;
				if(result == null)	{
					thisObject.setError("An invalid JavaScript object was returned");
					return;
				}
				if(result.flagGeneralError == true && result.connectionError == true)
					initiateConnectionRefresh();
				if(result.flagGeneralError == true || result.returnCode == "false" || result.returnCode == false) {
					if(Object.isString(result.returnValue)) {
						thisObject.setError(result.returnValue==""?"Error but no message":result.returnValue);
						return;
					} 
					thisObject.setError(result.returnValue.STMTMSG);
					return;
				}
				try {thisObject[thisProcessFunction].call(thisObject,result.returnValue,thisFunctionArg);} 
				catch (e) {
					openModalAlert('Error in postGetXMLDataAJAXRequest when calling function '+thisProcessFunction+' '+e);
					thisObject.setError('Error in postGetXMLDataAJAXRequest when calling function '+thisProcessFunction+' '+e)
				}
			},
			onComplete: function(transport) {
			}
		});
	},
	postGetContentAJAXRequest: function(menuElement,title,query) {
		var thisObject = this;
		if(title==null)
			menuElement.innerHTML="<img height='40px' width='40px' style='float:none;' src='images/loadingpage.gif'/>";
		else
			menuElement.setContent("<img style='float:none;' src='images/loadingpage.gif'/>",title, null, null, null);
		POSTDATA = {
			 returntype		: 'JSON'
			,action			:'getSQLValue'
			,USE_CONNECTION : getActiveDatabaseConnection()
		};
		if(Object.isString(query)) 
			POSTDATA.query      	= query;
		else {
			var i=0;
			query.each(function(value) {POSTDATA['query[' + (i++) + ']'] = value;});
		}
		new Ajax.Request(ACTION_PROCESSOR, {
			'parameters': POSTDATA,
			onSuccess: function(transport) {
				var result = transport.responseJSON;
				if(result == null)	{
				 	var msg='<div>Error: An invalid JavaScript object was returned</div>';
				} else if(result.flagGeneralError == true && result.connectionError == true) {
					initiateConnectionRefresh();
					return;
				} if(result.flagGeneralError == true || result.returnCode == "false" || result.returnCode == false) {
			 		var msg='<div>'+result.returnValue+'</div>';
				} else
		 			var msg=result.returnValue;
				if(title==null)
					menuElement.innerHTML=msg;
				else
					menuElement.setContent(msg,title, null, null, null);
			},
			onComplete: function(transport) {
			}
		});
	},
	processActionStackAsynch: function () {
		setTimeout(this.processActionStack.bind(this),1);
	},
	processActionStack: function () {
		while (this.actionStack.length>0) {
			var action=this.actionStack.pop();
			switch (action[0]) {
				case 'addElement' :
				case 'updateChildNodeTag' :
				case 'updateElement' :
					try{
						this[action[0]](action[1],action[2]);
					} catch(e) {
						openModalAlert('Action ' + action[0] + ' error ' + e.toString());
						this.actionStack.push(action);
					}
					return true;
				case 'recoveryPoint' :
					break;
				case 'save' :
					this.saveNode();
					return true;
				case 'parentPanelReturnTrue' :
					setTimeout(this.parentPanel.returnCallTrue.bind(this.parentPanel),1);
					break;
				case 'destroy' :
					this.destroy();
					return true;
				case 'destroyParentPanel' :
					setTimeout(this.parentPanel.destroy.bind(this.parentPanel),1);
					return true;
				case 'call' :
					try{
						action[1].apply(action[2],action[3]);
					} catch(e) {
						alert("call error: " + e.toString() + "\nstack trace:\n\n"+e.stack);
					}
					return true;
				default: 
					openModalAlert('unknown action ' + action[0]);
					this.cancel();
					return;
			}
		}
		return true;
	},
	processAllNodes: function(node,callFunction) {
		if(node.nodeType!=1) return;
		for (var i=0;i<node.childNodes.length;i++)
			this.processAllNodes(node.childNodes[i],callFunction);
		callFunction.call(this,node);
    },
	redraw: function(show) {
		if(DEBUG_LOG_2_CONSOLE) console.log('chart nodal - redraw - show: '+show);
		if (show!=undefined) 
			this.show=show;
		if (this.nodeRefresh!=undefined) 
			for (var i=0;i< this.nodeRefresh.length;i++ )
				clearTimeout(this.nodeRefresh[i]);
		if(this.xmlData==null) {
			this.setError("No Data");
			return;
		}
		if(++this.redrawCount>1) return;
		this.redrawCount=1;
		switch (this.show) { 
			case 'EditViaReport':
				this.nodes=[];
				this.nodeRefresh=[];
				this.processAllNodes(this.xmlData.childNodes[0],this.calculateSetNode);
				this.showXMLTransformed(this.xmlData,'XSL/chartNodalDefaultEdit.xsl');
				callNodesByXPath(this
					,function(inputNode) {
							var node=this.getNodeById(inputNode.getAttribute('name'));
							if(this.hasAddableChildren(node)) return;
							inputNode.setAttribute('type','hidden');
						}
					,document
					,this.reportNode
					,"//input[@type='button' and @value='add child']"
					)
				break;
			case 'Menu': 
				this.nodes=[];
				this.nodeRefresh=[];
				this.menuOutput="<table>";
				for (var i=0;i<this.xmlData.childNodes.length;i++)
					this.drawMenu(this.xmlData.childNodes[i]);
				this.menuOutput+="</table>";
				this.setDisplay(this.menuOutput);
				break;
			case 'leftTree': 
			case 'menuTree': 
			case 'Diagram': 
				if (this.nodes.length > this.drawMaxNodes) {
					this.setError('Maximum nodes allowed diagram: ' + this.drawMaxNodes + ' xml contains : ' + this.nodes.length);
					break;
				}
				this.setNodeControlAttributes(this.xmlData);
				this.resize();
				break;
			case 'DisplayXML':
				this.showXMLTransformed(this.xmlData,'XSL/chartNodalXML2Text.xsl');
				break;
			case 'Report':
				this.nodes=[];
				this.nodeRefresh=[];
				this.processAllNodes(this.xmlData.childNodes[0],this.calculateSetNode);
				this.showXMLTransformed(this.xmlData,this.report,this.reportType);
				break;
			case 'SourceXML':
				this.setDisplay("<textarea style='width:100%;height:100%' rows='100%' cols='100%'>"+this.originalXML+"</textarea>");
				break;
			case 'noDisplay':
				return;
			default:
				this.setError("Unknown display type "+this.show);
		}
		if(--this.redrawCount>0) this.redraw();
	},
	redrawNodeCanvas: function(i,refreshInterval) {
		if(this.nodes==undefined) return;
		if(this.nodes[i]==undefined) return;
		if(this.nodeRefresh[i]==undefined) return;
		if(this.nodeDrawDetails[i]==undefined) return;
		this.drawNodeCanvas( this.nodeCntl['@'+this.nodes[i].node.nodeName] ,this.nodes[i].node,this.nodeDrawDetails[i].position,i,refreshInterval);
	},
	resize: function() {
		this.canvasOffset=this.canvas.cumulativeOffset(this.canvas);
 		this.width = this.parentPage.getWidth();
 		this.height = this.parentPage.getHeight();
		this.chartWidth = Math.max(this.width - 25,this.minChartWidth);
		this.chartHeight = Math.max(this.height - 25 ,this.minChartHeight);
		this.centerWidthOffset=0;
		this.logicalDepth=0;
		this.logicalWidth=0;
		this.calculateNode();
		this.logicalDepth+=this.nodeLength;
		this.logicalWidth+=this.nodeLength;
		if(this.initialBuild) {
			if(this.autoResize)	this.setFit2Panel();
			this.initialBuild=false;
		} 
		if (this.zoomRefactorFloor(this.logicalDepth)>this.chartHeight)
			this.chartHeight = this.zoomRefactorFloor(this.logicalDepth);
		if (this.zoomRefactorFloor(this.logicalWidth)>this.chartWidth)
			this.chartWidth = this.zoomRefactorFloor(this.logicalWidth);
		else this.centerWidthOffset= (this.chartWidth - this.zoomRefactorFloor(this.logicalWidth))/2; 
		try {  
			if(this.chartWidth>8196) {
				this.chartWidth=8196;
				throw "Diagram width too great";
			}
			if(this.chartHeight>8196) { 
				this.chartHeight=8196;
				throw "Diagram height too great";
			}
		} catch(e) {}
		this.canvas.setAttribute('width', this.chartWidth);
		this.canvas.setAttribute('height', this.chartHeight);
		switch (this.show) { 
			case 'leftTree': 
			case 'menuTree': 
			case 'Diagram': 
				this.ctx.clearRect(0,0,this.chartWidth,this.chartHeight);
				this.nodes=[];
				this.nodeRefresh=[];
				for (var i=0;i<this.xmlData.childNodes.length;i++) 
					this.drawNode(this.displayDOM.childNodes[i],Math.floor(this.centerWidthOffset/this.zoomRatio),0);
		}
	},
	resizeEnd: function() {
		this.redraw();
	},
	saveAndReturnTrue: function() {
        this.actionStack.push(['parentPanelReturnTrue']);
        this.actionStack.push(['save']);
        this.processActionStackAsynch();
        return true;
	},
	saveNode: function() {
		this.setLoading();
		if(this.xml2xmlDOM==null) {
			this.xml2xmlDOM=getDOMParsed('XSL/chartNodalInternalXML2XML.xsl',null,this.saveNodeCallback,this);
			if(this.xml2xmlDOM==null) return;
		}
		var thisObject = this;
		POSTDATA = {
			 returntype		: 'JSON'
			,value			: getXMLString(getXSLTransformed(this.xmlData,this.xml2xmlDOM))+' '
			,USE_CONNECTION	: getActiveDatabaseConnection()
			};
		switch (this.sourceType) {
			case 'element':
				this.source.value = POSTDATA.value;
				this.processActionStack();
				return;
			case 'SQL' :
				POSTDATA.action         = 'updateSQLXMLValue';
				POSTDATA.query         	= this.save;
				break;
			case 'JSON' :
				POSTDATA.action         = this.save;
				break;
			case 'xmlData' :
				if(this.callParameters.$object!=null) {
					GLOBAL_ACTION_TYPE.setActionResult(
							 this.callParameters.$object
							,this.callParameters.$localStack
							, 'true'
							,(this.originalXMLType=='string'?POSTDATA.value:getXSLTransformed(this.xmlData,this.xml2xmlDOM))
							);
					this.processActionStack();
					return;
				}
			default:
  				this.setError('save unknown source type: '+this.sourceType);
  				return;
		}
	
		new Ajax.Request(ACTION_PROCESSOR, {
			'parameters': POSTDATA,
			onSuccess: function(transport) {
				var result = transport.responseJSON;
				if(result == null)	{
					thisObject.setCanvas();
					thisObject.redraw();
					openModalAlert("An invalid JavaScript object was returned");
					return;
				}
				if(result.flagGeneralError == true && result.connectionError == true)
					initiateConnectionRefresh();
				if(result.flagGeneralError == true || result.returnCode == "false" || result.returnCode == false) {
					if(Object.isString(result.returnValue)) {
						thisObject.setError("Error saving, error: "+ result.returnValue);
						return;
					}
					openModalAlert("Error saving, error: "+ result.returnValue.STMTMSG+"\n SQL Statement: "+thisObject.save);
					return;
				}
				thisObject.getData();
				thisObject.processActionStack();
			},
			onFailure: function(transport,error) {
					thisObject.setError("Error saving, error: "+ error);
			},
			onComplete: function(transport) {
			}
		});
		this.processActionStack();
	},
	saveNodeCallback: function(xml2xmlDOM) {
		if(xml2xmlDOM==null)
			throw "Error load failed for XSL/chartNodalInternalXML2XML.xsl";
		this.xml2xmlDOM=xml2xmlDOM;
		this.saveNode()
	},
	setCanvas: function() {
		this.setDisplay( "<canvas id='" + this.elementUniqueID + "_chart' width='"+this.chartWidth+"' height='"+this.chartHeight+"'"
						+ ' onmousemove="' +  this.callThisObject + '.canvasEvent(event);"'
						+ ' onmousedown="' +  this.callThisObject + '.canvasEvent(event);"'
						+ ' onclick="' +  this.callThisObject + '.canvasEvent(event);"'
						+ ' ondblclick="' +  this.callThisObject + '.canvasEvent(event);"'
						+ "></canvas>"
						);
 		this.canvas = initCanvas(document.getElementById(this.elementUniqueID + "_chart"));
		if (!this.canvas.getContext) {
  			this.setError('canvas-unsupported');
  			return;
		}
 		this.ctx = this.canvas.getContext('2d');
	},
	setDetailCoords: function (callingEvent) {
		if(callingEvent==null) return;
		this.offsetX=Math.round(callingEvent.clientX) + this.parentPage.scrollLeft;
		this.offsetY=Math.round(callingEvent.clientY) + this.parentPage.scrollTop;
		this.detailNode.style.position="absolute";
		this.detailNode.style.top=this.offsetY+"px";
		this.detailNode.style.left=this.offsetX+"px";
	},
	setDisplay: function(data) {
		if(this.edit!=null)  {
			this.edit.setContent(data);
			this.edit.size();
			return;
		}
		if(this.parentPage != null)
			this.parentPage.update(data 
						+ "<table id='" + this.elementUniqueID + "_detailNode' style='border-style: solid; border-width:1px; font-size:10px; top:0px; left:60px ; position:absolute ; display:block; background-color: #FFFFFF;'"
						+	"></table>"
						);
 		this.detailNode = document.getElementById(this.elementUniqueID + "_detailNode");
	},
	setDOMLoad: function(xml,attribute) {
		if(xml==null) return;
		++this.loadCount;
		this.setDOMLoadCallback(xml,attribute);
	},
	setDOMLoadCallback: function(xml,attribute) {
		if(xml!=null) {
			this[attribute]=getDOMParsed(xml,null,this.setDOMLoadCallback,this,attribute);
			if(this[attribute]==null) return;
		}
		this.draw();	
	},
	setError: function(message) {
	 	try{
			if(message!=undefined)
				if(message!=null) {
					if (typeof message =='object')
						message=message.message;
					var msgId=message.split(" ",1)[0];
					if(msgId.substr(0,1)=="[") {
						msgParts=message.split("] ",2);
						if(msgParts.length>1) {
							msgId=msgParts[1].split(" ",1)[0];
							var messages=getNodesByXPath(this.settingsDOM,this.settingsDOM,'/settings/messages/*[name()="'+msgId+'"]');
							if (messages.length==1) 
								message=messages[0].textContent;
							else if (CORE_MESSAGE_STORE.LANGUAGE_TABLE_MESSAGES[msgId]!=undefined)
								message=CORE_MESSAGE_STORE.LANGUAGE_TABLE_MESSAGES[msgId];
						}
					}
				}
			if(this.show=='noDisplay')
				openModalAlert(unescape(message));
			else
				this.setDisplay("<table style='width:100%;height:100%'><tr><td align='center'><h2>"+unescape(message)+"</h2></td></tr></table>");
		} catch(e) {openModalAlert('setError failed: '+e+" "+message);}
	},
	setFit2Panel: function() {
 		this.zoomRatio = Math.min( (this.width)/this.logicalWidth , (this.height)/this.logicalDepth );
	},
	setGreatestCost: function(value) {
		if(value==null) {
			this.greatestCostAttribute=null;
		} else { 
			this.setGreatestCostNode(value,this.xmlData.childNodes[0]);
			this.greatestCostAttribute=value;
		}
		if(this.show!='noDisplay') this.resize();
		this.redraw();
	},
	setGreatestCostNode: function (attrName,node) {
		if(node.nodeType!=1) return 0;
		attr = document.createAttribute('node__max');
		attr.nodeValue='true';
		node.attributes.setNamedItem(attr);
		if(node.childNodes.length==0) return;
		if(node.childNodes.length==1) {
			this.setGreatestCostNode(attrName,node.childNodes[0]);
			return;
		}
		this.setGreatestCostNode(attrName,node.childNodes[this.getGreatestCostNode(attrName,node)]);
	},
	setLinePath: function(linePath) {
		this.linePath=linePath;
		this.redraw();
	},
	setLoading: function() {
		this.setDisplay(	"<table style='width:100%;height:100%'  cellpadding='0' cellspacing='0' >"
						+ 	"<tr><td align='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr>"
						+	"</table>"
						);
	},
	setNode: function(node) {
		var i=this.nodes.length;
		this.nodes[i]=[];
		this.nodes[i].node=node;
		return i;
	},
	setNodeControlAttributes: function (node) {
		if(node.nodeType==1) {
			var nodeCntl=this.getNodeControl(node.nodeName.toLowerCase());
			if(nodeCntl.outsideLabel.xpath!=null) {
				try{
					var value=getNodeByXPath(this.xmlData,node,nodeCntl.outsideLabel.xpath);
					if(value!=null) {
						attr = document.createAttribute('node__outsideLabel');
						attr.nodeValue=(value.constructor==String?value:value.nodeValue);
						node.attributes.setNamedItem(attr);
					}
				} catch(e) {openModalAlert('Outside Label on "'+node.tagName+'" error: '+e);}
			}
			if(nodeCntl.hideOnXpath!=null) {
				try{
					var value=getNodeByXPath(this.xmlData,node,nodeCntl.hideOnXpath);
					if(value!=null) {
							attr = document.createAttribute('node__Hide');
							attr.nodeValue="true";
							node.attributes.setNamedItem(attr);
						}
				} catch(e) {openModalAlert('Outside Label on "'+node.tagName+'" error: '+e);}
			}
		}
		for(var i=0;i<node.childNodes.length;i++)
			this.setNodeControlAttributes(node.childNodes[i]);
    },
	setNodeCanvasArea: function(node,min,max) {
		var i=this.setNode(node);
		this.nodes[i].xMin=min.x;
		this.nodes[i].xMax=max.x;
		this.nodes[i].yMin=min.y;
		this.nodes[i].yMax=max.y;
		this.nodes[i].node=node;
		return i;
    },
	setNodeControl: function(xml) { 
 		this.nodeCntl=[];
		this.nodeCntl['@default']=[];
		this.nodeCntl['@default'].colour='#66FF66';  //'lightgreen';
		this.nodeCntl['@default'].hide=false;
		this.nodeCntl['@default'].hideAble=false;
		this.nodeCntl['@default'].hideOnXpath=null;
		this.nodeCntl['@default'].shape='square';
		this.nodeCntl['@default'].shapeWhenHiddenChildren=null;
		this.nodeCntl['@default'].outsideLabel=[];
		this.nodeCntl['@default'].outsideLabel.font=[];
		this.nodeCntl['@default'].outsideLabel.font.size=12;
		this.nodeCntl['@default'].outsideLabel.font.family="sans-serif";
		this.nodeCntl['@default'].showChildren=true;
		this.nodeCntl['@default'].textSizeTag=10;
		this.nodeCntl['@default'].textSizeAttribute=6;
		this.createNodeControl('#text','default');
		if (this.allNodes) this.nodeCntl['@#text'].hide=true;
		if(xml==null) {
			this.draw();
			return;
		}
		if(typeof xml == 'string') {
			var nodeCntlDOM=getDOMParsed(xml,null,this.setNodeControl,this);
			if(nodeCntlDOM==null) return;
		} else
			var nodeCntlDOM=xml;
		nodeCntl=nodeCntlDOM.childNodes[0];
		if(nodeCntl.nodeName!='nodeControl') throw 'nodeControl not found as root tag, found tag: '+nodeCntl.nodeName+' xml: ' + xml;
		for (var i=0;i<nodeCntl.childNodes.length;i++) {
			var node=nodeCntl.childNodes[i];
			if(node.nodeName.in('#text','#comment')) continue
			if(node.nodeName!='node') throw 'unknown element '+node.nodeName+' found in nodeControl, xml: ' + xml;
			name=node.getAttribute('name').toLowerCase();
			if (name==null) continue;
			if (name!='default') this.createNodeControl(name,'default');
			nodeCntlNode=this.nodeCntl['@'+name];
			for (var j=1;j<node.attributes.length;j++) {
				switch (node.attributes[j].nodeName) {
					case 'name':
						break;
					case 'hide':
					case 'hideAble':
					case 'showChildren':
						nodeCntlNode[node.attributes[j].nodeName]=(node.attributes[j].nodeValue=='true');
						break;
					case 'outsideLabelXpath':
						nodeCntlNode.outsideLabel.xpath=node.attributes[j].nodeValue;
						break;
					case 'outsideLabelFontFamily':
						nodeCntlNode.outsideLabel.font.family=node.attributes[j].nodeValue;
						break;
					case 'outsideLabelFontSize':
						var size=node.attributes[j].nodeValue;
						switch (size) {
							case "nodeHeight":
							case "node":
								size=parseInt(this.nodeDrawLength);
								break;
						}
						nodeCntlNode.outsideLabel.font.size=size;
						break;
					default:
						nodeCntlNode[node.attributes[j].nodeName]=node.attributes[j].nodeValue;
						break;
				}
			}
		}
		this.draw();
	},
	setParameter: function(callParameters,name,value) {
		if(callParameters['$'+name]==undefined) callParameters['$'+name]=value;
	},
	setShapes: function(xml) {
		if(this.shape==undefined) this.shape=[];
		if(xml==null || xml=='') {
			this.draw();
			return;
		}
        if(typeof xml == 'string') {
        	var shapeDOM=getDOMParsed(xml,null,this.setShapes,this);
        	if(shapeDOM==null) 
        		return;
		} else 
			var shapeDOM=xml;
        var top=0;
        var bottom=this.nodeDrawLength;
        var maxSize=this.nodeDrawLength;
        var margin=this.nodeMargin;
		var shapes=shapeDOM.childNodes[0];
		if(shapes.nodeName!='shapes') throw 'shapes not found as root tag, found tag: '+shapes.nodeName+' xml: ' + xml;
		for (var i=1;i<shapes.childNodes.length;i++) {
			var shape=shapes.childNodes[i];
			if(shape.nodeName.in('#text','#comment')) continue;
			if(shape.nodeName!='shape') throw 'unknown element '+shape.nodeName+' found in shapes, xml: ' + xml;
			var name=shape.getAttribute('name');
			this.shape[name]=[];
			this.shape[name].image=shape.getAttribute('image');
			if (name==null) continue;
			for (var iP=1;iP<shape.childNodes.length;iP++) {
				var point=shape.childNodes[iP];
				if(point.nodeName.in('#text','#comment')) continue;
				if(point.nodeName!='point') throw 'unknown element '+point.nodeName+' found in shapes, xml: ' + xml;
				var x=null;
				var y=null;
				var cx=null;
				var cy=null;
				for (var j=0;j<point.attributes.length;j++) {
					switch (point.attributes[j].nodeName) {
						case 'x':
							x=eval(point.attributes[j].nodeValue);
							break;
						case 'y':
							y=eval(point.attributes[j].nodeValue);
							break;
						case 'cx':
							cx=eval(point.attributes[j].nodeValue);
							break;
						case 'cy':
							cy=eval(point.attributes[j].nodeValue);
							break;
						default:
							break;
					}
				}
				if(cx!=null && cy==null) cy=0; 
				if(cy!=null && cx==null) cx=0; 
				this.setShapePoint(name,x,y,cx,cy);
			}
		}
		this.draw();
	},
	setShapePoint: function(shape,x,y,cx,cy) {
    	if(this.shape[shape]==null) this.shape[shape]=[];
    	var i=this.shape[shape].length;
    	this.shape[shape][i]=[];
    	this.shape[shape][i].x=x;
    	this.shape[shape][i].y=y;
		if(cx!=null) this.shape[shape][i].cx=cx; 
		if(cy!=null) this.shape[shape][i].cy=cy; 
	},
	
	setSource: function(source,sourceType) {
		this.source=source;
		if (sourceType!=undefined) this.sourceType=sourceType;
		this.getData();	
	},
	setThrowError: function(error) {
		this.setError(error);
		throw error;
	},
	setValue: function(thisObject) {
		if(this.xml2xmlDOM==null) {
			this.xml2DOM=getDOMParsed('XSL/chartNodalInternalXML2XML.xsl',null,this.setValue,this,thisObject)
			if(this.xml2xmlDOM==null) return;
		}
		thisObject.source.value=getXMLString(getXSLTransformed(thisObject.xmlData,this.xml2xmlDOM))+' ';
		if(thisObject.source.element)
			if(thisObject.source.element.onchange)
				thisObject.source.element.onchange();
	},
	setZoomAdjust: function(factor) {
 		this.setZoomRatio(this.zoomRatio*factor);
	},
	setZoomRatio: function(ratio) {
		this.zoomRatio=ratio;
		this.resize();
	},
	showNodeDetails: function (callingEvent) {
		if(this.editMode) 
			if(this.detailNode.rows.length> 0) 
				return;
		if(this.actionStack.length>0) {
			this.cancel();
			this.currentNode=null;
		}
		this.detailNodeReset();
		var nodeInfo=this.getNodeForCanvasEvent(callingEvent);
		if(nodeInfo==null) return;
	 	this.detailNode.setStyle({'top':  nodeInfo.y + 'px'});
		this.detailNode.setStyle({'left': nodeInfo.x + 'px'});
		this.showDetail(nodeInfo.id);
	},
	showDetail: function (iN) {
		row=this.detailNode.insertRow(-1);
		row.insertCell(-1).innerHTML="<h2 style='text-transform:capitalize'>" + this.currentNode.nodeName.toTitle() + "</h2>";
		row=this.detailNode.insertRow(-1);
		cell=row.insertCell(-1);
		var aTable = document.createElement('table');
		cell.appendChild(aTable);
		switch (this.currentNode.nodeType) {
			case 1 :
				for (var iA=0;iA<this.currentNode.attributes.length;iA++) {
					if(this.currentNode.attributes[iA].nodeName.substr(0,6)=='node__') continue;
					if(this.currentNode.attributes[iA].nodeName.substr(0,2)=='__') {
						aRow=aTable.insertRow(-1);
						aRow.insertCell(-1).innerHTML=this.currentNode.attributes[iA].nodeName.substr(2).replace(/_/g," ");
						aRow.insertCell(-1).innerHTML=": " + this.currentNode.attributes[iA].nodeValue;
						continue;
					}
					aRow=aTable.insertRow(-1);
					aRow.insertCell(-1).innerHTML= this.currentNode.attributes[iA].nodeName.toTitle();
					aRow.insertCell(-1).innerHTML=": " + this.currentNode.attributes[iA].nodeValue;
				}
				break;
			case 3 :
				aTable.insertRow(-1).insertCell(-1).innerHTML='<textarea cols="60" rows="10"  readonly="readonly">'+this.currentNode.nodeValue+'</textarea>';
				break;
			default: break;
		}
		if (this.definitionDOM!=null) {
			switch (this.currentNode.nodeType) {
				case 1:	
					try{ var nodeDef=this.getTagDefinition('element',this.currentNode.nodeName);}
					catch (e) {
						this.setError("showDetail getTagDefinition "+e);
						return;
					}
					var nodeType=nodeDef.getAttribute('type');
					if (nodeType!=null) {
						aRow=aTable.insertRow(-1);
						aRow.insertCell(-1).innerHTML='';
						aRow.insertCell(-1).innerHTML=(this.currentNode.childNodes.length==1?this.currentNode.childNodes[0].nodeValue:'');
					}
					break;
				default: break;	
			}
		}
		this.detailNode.insertRow(-1).insertCell(-1).innerHTML='';
		cell=this.detailNode.insertRow(-1).insertCell(-1);
		var aTable = document.createElement('table');
		cell.appendChild(aTable);
		arow=aTable.insertRow(-1);
		if(this.editMode) {
			if(this.hasAddableChildren(this.currentNode,nodeDef)) 
				arow.insertCell(-1).innerHTML='<input onmousedown="" type="button" value="Add" onclick="' + this.callThisObject + '.addChildNode('+iN+')"/>';
			arow.insertCell(-1).innerHTML='<input onmousedown="" type="button" value="Update" onclick="' + this.callThisObject + '.updateNode('+iN+')"/>';
			arow.insertCell(-1).innerHTML='<input onmousedown="" type="button" value="Delete" onclick="' + this.callThisObject + '.deleteNode('+iN+')"/>';
		}
		if (this.currentNode.nodeType==1)
			for (var iA=0;iA<this.currentNode.attributes.length;iA++) {
				if(this.currentNode.attributes[iA].nodeName.substr(0,13)!='node__button_') continue;
				arow.insertCell(-1).innerHTML='<input onmousedown="" type="button" value="'+this.currentNode.attributes[iA].nodeName.substr(13).replace(/_/m," ")+'" onclick="'+this.currentNode.attributes[iA].nodeValue+'"/>';
			}
		arow.insertCell(-1).innerHTML='<input onmousedown="" type="button" value="Close" onclick="' + this.callThisObject + '.cancel()"/>';
		this.detailNode.style.display="block";
	},
	showXMLTransformed: function(xmlDOM,xsl,type) {
		this.setDisplay("<div id='"+this.elementUniqueID + "_report' style='width:100%;height:100%' rows='100%' cols='100%'></div>");
		this.reportNode=document.getElementById(this.elementUniqueID + '_report');
		if(xmlDOM==null) {
			this.reportNode.innerHTML="Nil Report";
			return;
		}
		try {
			var xslDOM=getDOMParsed(xsl,null,this.showXMLTransformedCallback,this,this.reportNode,xmlDOM,type);
			if(xslDOM==null) return;
			switch(type==undefined?"":type) {
				case 'text':
					this.reportNode.innerHTML="<textarea></textarea>";
					this.reportNode.firstChild.value= getXSLTransformed(xmlDOM,xslDOM,this.transformParameters).firstChild.textContent;
					this.reportNode.firstChild.setStyle({'width' : (parseInt(this.reportNode.getWidth())-20) + "px"});
					this.reportNode.firstChild.setStyle({'height' : (parseInt(this.reportNode.getHeight()) - 20) + "px"});
					break;
				default:
					appendXML2HTML(this.reportNode,xmlDOM,xslDOM,this.transformParameters);
			}
			if(this.autoResize) this.parentPanel.size();
		} catch (e) {this.setError(e);}
	},
	showXMLTransformedCallback: function (xsl,node,xmlDOM,type) {
		this.showXMLTransformed(xmlDOM,xsl,type);
	},
	storeSchema: function (xml,returnFunction) {
		try{
			this.definitionDOM=getDOMParsed(xml);
			this.definitionLoaded=xml;
			this.checkSchema(returnFunction);
		}
		catch(e) {throw e + " schema: "+xml;};
		if (this.edit!=null) {
			this.edit.setContent(null,null,null,null,this.menuSchema());
			this.edit.size();
		}
	},
	toggleHideNode: function(nodeType,action) {
		this.getNodeControl(nodeType).hide=(action=='hide');
		this.resize();
		this.redraw();
		return (this.getNodeControl(nodeType).hide?'show':'hide'); 
	},
	updateData: function (data) {
		this.nodes=[];
		this.nodeRefresh=[];
		this.originalXML=data;
		this.originalXMLType=typeof data;
		try {
			if (data==null || data=='' ) {
				this.setError('No data');
			  	this.xmlData=null;
				if(this.editMode && this.xmlData==null) {
					if (this.newRoot==null) 
						this.addChildNode();
					else 
						this.addChildNodeIndex(null,this.newRoot);
				}
			  	return;
			}
			if(this.originalXMLType == 'string') {
				this.xmlData=getDOMParsed(
					(data.indexOf('<')<0||data.indexOf('<?xml')>-1?data:'<?xml version="1.0" encoding="UTF-8"?>'+data)
					,null,this.updateData,this,data
					);
				if(this.xmlData==null) return; 
			} else this.xmlData= data;
			if (this.transform!=null) {
				if (this.transformDOM==null)
					throw "Logic timing issue as transform DOM not loaded";
				this.xmlData=getXSLTransformed(this.xmlData,this.transformDOM);
			}
			this.setCanvas();
		 } catch(e) {
	  		this.xmlData=null;
	  		this.setError(e+ 'results: <textarea>' + data + '</textarea>');
	  		throw e;
	  		return;
	  	}

		this.parentPanel.setSize();
		this.setGreatestCost(this.greatestCostAttribute);
	},
	updateElement: function (node,nodeDef) {
		var elements=[];
		var	mixed = false;
		var type=nodeDef.getAttribute('type');
		switch (type) {
			case this.schemaPrefix+'decimal':
			case this.schemaPrefix+'integer':
			case this.schemaPrefix+'positiveinteger':
			case this.schemaPrefix+'boolean':
			case this.schemaPrefix+'date':
			case this.schemaPrefix+'time':
			case this.schemaPrefix+'NCName': 
			case this.schemaPrefix+'string': 
				newText=this.xmlData.createTextNode(document.getElementById(this.elementUniqueID+'_intext').value);   
				node.childNode[0].value=newText;
				break;
			case '#text': 
				node.nodeValue=document.getElementById(this.elementUniqueID+'_intext').value;
			case null: 
				elements=this.getChildNodeByName(nodeDef,this.schemaPrefix+'complexType');
            	if(elements.length==1) break;
				var simpleType=this.getChildNodeByName(nodeDef,this.schemaPrefix+'simpleType');
				value=document.getElementById(this.elementUniqueID+'_intext').value;
				try{
					errors=this.isAttributeValueOK(simpleType,value);
				} catch(e) {
					errors=e.toString();
				}
				if (errors!=null) throw attributeName+': '+errors;
				newText=this.xmlData.createTextNode(value);   
				if(node.childNodes.length==0) node.appendChild(newText);
				else node.childNodes[0].value=newText;
            	break;
			default: 
				elements=getNodesByXPath(this.definitionDOM,nodeDef,'//'+this.schemaPrefix+'complexType[@name="'+type+'"]');
            	if(elements.length==1) break;
        		if(elements.length>1) throw 'updateElement complextype: ' +type+' too many found, number: '+elements.length;
				var simpleType=getNodesByXPath(this.definitionDOM,nodeDef,'//'+this.schemaPrefix+'simpleType[@name="'+type+'"]');
            	if(simpleType.length==0) throw 'updateElement type: ' +type+' simple or complex not found';
        		if(simpleType.length>1) throw 'updateElement simpleType: ' +type+' too many found, number: '+simpleType.length;
				value=document.getElementById(this.elementUniqueID+'_intext').value;
				try{
					errors=this.isAttributeValueOK(type,value);
				} catch(e) {
					errors=e.toString();
				}
				if (errors!=null) throw attributeName+': '+errors;
				for (var i=node.childNodes.length-1;i>=0;i--){node.removeChild(node.childNodes[i]);}
				newText=this.xmlData.createTextNode(value);
				node.appendChild(newText);
		        break;	
		}
		
		if (elements.length>1) throw 'tag ' +nodeDef.getAttribute('name')+' too many complexType';
		if (elements.length>0) {
			elements=this.getChildNodeByName(elements[0],this.schemaPrefix+'attribute');
			for (var iE=0;iE<elements.length;iE++) {
				var attributeName=elements[iE].getAttribute('name');
				if (attributeName==null) {
					attributeName=elements[iE].getAttribute('ref');
					attr=this.getTagDefinition('attribute',attributeName);
				} else
					var attr=elements[iE];
				var input=document.getElementById(this.elementUniqueID+'_in_'+attributeName);
				if (input.nodeName=='A') continue;   	
				if (input.nodeName=='SELECT') {	
					var attributeValue=(input.selectedIndex<0?'':input.options[input.selectedIndex].text);
				} else {
					var attributeValue=input.value;
					try{
						errors=this.isAttributeValueOK(attr.getAttribute('type'),attributeValue);
					} catch(e) {
						errors=e.toString();
					}
					if (errors!=null) throw attributeName+': '+errors;
				}
				if(elements[iE].getAttribute('use')=='required') 
					if(attributeValue==null || attributeValue=='')
						throw 'required attribute '+attributeName+' not completed';
				node.setAttribute(attributeName,attributeValue);
			}
		}
		this.detailNodeReset();
//		this.resize();
		this.redraw();
		this.processActionStack();
	},
    updateAttribute: function (attr,aTable,postLists,node,parentNode,checkAttributes) {
        var attributeName=attr.getAttribute('name')
        	,attrDefault=attr.getAttribute('default');
        if (attributeName==null) {
            attributeName=attr.getAttribute('ref');
            attr=this.getTagDefinition('attribute',attributeName);
            if (attrDefault==null) 
                attrDefault=attr.getAttribute('default');
        }
		attrDefaultValue="";
        if (this.isUpdate) {
            attrValue=node.getAttribute(attributeName);
            if(attrValue==null) attrValue='';
            else attrDefault='value="'+attrValue+'"';
        } else if (attrDefault==null) {
 	        defaultXpath=attr.getAttribute('db2mc:default');
	        if(defaultXpath==null || defaultXpath =='')
 	           attrDefault='';
 	        else {
				var defaultNode=getNodeByXPath(this.xmlData,parentNode,defaultXpath);
				if(defaultNode==null) attrDefault='';
	            else attrDefault='value="'+defaultNode.nodeValue+'"';
 	        }
        } else {
            if(attrDefault.substr(0,24)=='db2mc:nextSequenceAlpha(') 
                attrDefaultValue=this.nextSequenceAlpha(attrDefault.substr(24,attrDefault.indexOf(')')-24));
             else 
             	attrDefaultValue=attrDefault;
            attrDefault='value="'+attrDefaultValue+'"';
        }

        aRow=aTable.insertRow(-1);
        title=attr.getAttribute('db2mc:title');
        aRow.insertCell(-1).innerHTML=(title==null?attributeName.toTitle():title);
        aCell=aRow.insertCell(-1);
        switch (attr.getAttribute('type')) {
            case 'db2mc:list':
                checkAttributes.push(attributeName);
                var selectTag = document.createElement('SELECT');
                selectTag.id=this.elementUniqueID+'_in_'+attributeName;
                aCell.appendChild(selectTag);
                jO=0;
                for(var iO=0;iO<attr.childNodes.length;iO++) {
                    if (attr.childNodes[iO].nodeType!=1) continue;
                    jO++;
                    switch (attr.childNodes[iO].nodeName) {
                        case 'option':
                            var optionTag = document.createElement('OPTION');
                            optionTag.text=(window.ActiveXObject?attr.childNodes[iO].text:attr.childNodes[iO].textContent);
                            if(optionTag.text==(this.isUpdate?attrValue:attrDefaultValue)) optionTag.selected=true;
                            selectTag.add(optionTag,null);
                            break;
                        case 'db2mc:list':
                            var variable=attr.childNodes[iO].getAttribute('xpath');
                            if(variable!=null) {
                                var nodes=getNodesByXPath(this.xmlData,parentNode,variable);
                                for(var iL=0;iL<nodes.length;iL++) {
                                    var optionTag = document.createElement('OPTION');
                                    optionTag.text=nodes[iL].nodeValue;
                                    if(optionTag.text==(this.isUpdate?attrValue:attrDefaultValue)) optionTag.selected=true;
                                    selectTag.add(optionTag,null);
                                }
                            }
                            break;
                    }
                }
                if (jO==0) throw 'attribute '+attributeName+' type db2mc:list must have has children';
                selectTag.onchange=new Function(this.callThisObject+".checkDependencies('"+attributeName+"')");
                break;
            case 'db2mc:sql':
                var sTable = document.createElement('table');
                aCell.appendChild(sTable);
                sRow=sTable.insertRow(-1);
                sRow.insertCell(-1).innerHTML='<select id="'+ this.elementUniqueID+'_in_'+attributeName+'" onchange="' + this.callThisObject + '.checkDependencies(\''+attributeName+'\')" type="text" >'
											+	'<option selected="selected" value="'+(this.isUpdate?attrValue:attrDefaultValue)+'">'+(this.isUpdate?attrValue:attrDefaultValue)+'</option>'
                							+ '</select>';
                sRow.insertCell(-1).innerHTML='<img height="40px" width="40px" src="images/loadingpage.gif"/>';
                for (var iS=0;iS<attr.childNodes.length;iS++) { if (attr.childNodes[iS].nodeType==1) break;}
                if (iS==attr.childNodes.length) throw 'attribute '+attributeName+' type db2mc:sql has children';
                var sqlNode=attr.childNodes[iS];
                for (iS=iS+1;iS<attr.childNodes.length;iS++) if (attr.childNodes[iS].nodeType==1) throw 'attribute '+attributeName+' type db2mc:sql has too many children';
                if (sqlNode.nodeName!="db2mc:sql") throw 'attribute '+attributeName+' type db2mc:sql has no sql'
                var sql="";
                var depCnt=0;
                for (var iS=0;iS<sqlNode.childNodes.length;iS++) {
                      if(sqlNode.childNodes[iS].nodeType==3){
                          sql+=sqlNode.childNodes[iS].nodeValue;
                          continue;
                      }
                      if(sqlNode.childNodes[iS].nodeName=="db2mc:value") {
                        variable=sqlNode.childNodes[iS].getAttribute('id');
                        if(variable!=null) {
                            this.detailDependencies.push([attributeName,variable,sqlNode,parentNode]);
                            depCnt++;
                            continue;
                        }
                        variable=sqlNode.childNodes[iS].getAttribute('xpath');
                        if(variable!=null) {
                            var iVA=variable.indexOf('db2mc:attr(');
                            if(iVA>=0) {
                                variable=variable.substr(iVA+11);
                                variable=variable.substr(0,variable.indexOf(')'));
                                this.detailDependencies.push([attributeName,variable,sqlNode,parentNode]);
                                depCnt++;
                                continue;
                            }
                            var nodes=getNodesByXPath(this.xmlData,parentNode,variable);
                            if(nodes.length!=1)
                                throw "xpath "+variable+" for attribute "+attributeName+" should return 1 value, "+nodes.length+" returned";
                            sql+=nodes[0].nodeValue;
                            continue;
                        }
                        throw "db2mc:value not id or xpath for attribute "+attributeName;
                    }
                }
                if(depCnt==0) postLists.push([attributeName,sql]);
                break;
            default:
		        simpleType=getNodesByXPath(this.definitionDOM,attr,'//'+this.schemaPrefix+'simpleType[@name="'+attr.getAttribute('type')+'"]');
		        if(simpleType.length==0)
					simpleType=this.getChildNodeByName(attr,this.schemaPrefix+'simpleType');
		        if(simpleType.length==0) {
	                aCell.innerHTML='<input id="'+ this.elementUniqueID+'_in_'+attributeName+'" type="text" onchange="' + this.callThisObject + '.checkDependencies(\''+attributeName+'\')" '+attrDefault+'/>';
    	            break;
		       	}
		        if(simpleType.length!=1) throw 'simpleType: ' +type+' not found or too many, number: '+simpleType.length;
            	restriction=this.getChildNodeByName(simpleType[0],this.schemaPrefix+'restriction');
		        if(restriction.length!=1) throw 'restriction: ' +type+' not found or too many, number: '+restriction.length;

		        var base=restriction[0].getAttribute('base');
		        switch (base) {
        		    case this.schemaPrefix+'string':
        		    case this.schemaPrefix+'normalizedString':
        		    case this.schemaPrefix+'positiveInteger':
		            	enumeration=this.getChildNodeByName(restriction[0],this.schemaPrefix+'enumeration');
				        if(enumeration.length>0) {
			                var selectTag = document.createElement('SELECT');
            			    selectTag.id=this.elementUniqueID+'_in_'+attributeName;
                			aCell.appendChild(selectTag);
							enumeration=this.getChildNodeByName(restriction[0],this.schemaPrefix+'enumeration');
							for(var iN=0;iN<enumeration.length;iN++) {
	                            var optionTag = document.createElement('OPTION');
    	                        optionTag.text=enumeration[iN].getAttribute('value');
        	                    if(optionTag.text==(this.isUpdate?attrValue:attrDefaultValue)) optionTag.selected=true;
            	                selectTag.add(optionTag,null);
							}
				        	break;
						}
		            default:
						var attrLength=0;
						for (var iR=0;iR<restriction[0].childNodes.length;iR++) {
							var nodeRestriction=restriction[0].childNodes[iR];
							if(nodeRestriction.nodeType!=1) continue;
							var restrictionName=nodeRestriction.nodeName;
							switch (restrictionName) {
								case this.schemaPrefix+'maxLength':
								case this.schemaPrefix+'length':
									var restrictionValue=nodeRestriction.getAttribute('value');
						    		if(attrLength<restrictionValue) attrLength = restrictionValue;
						    		break;
							}
						}
	                	aCell.innerHTML='<input id="'+ this.elementUniqueID+'_in_'+attributeName+'" type="text"' +(attrLength==0? '' : ' size="'+ ( attrLength<60 ? attrLength  : 60 ) +'" maxLength="'+attrLength+'"')+' onchange="' + this.callThisObject + '.checkDependencies(\''+attributeName+'\')" '+attrDefault+'/>';
		                break;
		        }
        }
    },
    updateChildNodeTag: function (parentNode,tag,actionButtons) {
        this.isUpdate=(tag==undefined);
        if (this.isUpdate) {
            var node=parentNode;
            parentNode=node.parentNode;
            tag=node.nodeName;
        }

		switch (tag) {
			case "#text":
				heading='Text';
				var nodeDef=this.definitionDOM.createElement("element");
				nodeDef.setAttribute("name","#text");
				nodeDef.setAttribute("default","");
				nodeDef.setAttribute("type","#text");
				break;
			default:
		        var nodeDef=this.getTagDefinition('element',tag);
		        heading=tag;
		}
        var checkAttributes=[];
        this.detailNodeReset();
        this.detailNode.style.display="block";
        this.detailNode.insertRow(-1).insertCell(-1).innerHTML='<h2>'+heading.toTitle()+'</h2>';
        this.detailNode.insertRow(-1).insertCell(-1).innerHTML='';
        row=this.detailNode.insertRow(-1);
        cell=row.insertCell(-1);
        var aTable = document.createElement('table');
        cell.appendChild(aTable);
//IE7 can't handle        aTable.setStyle('white-space:nowrap');
       
        this.detailDependencies=[];
        var complexType=[];
        var type=nodeDef.getAttribute('type');
        switch (type) {
            case this.schemaPrefix+'decimal':
            case this.schemaPrefix+'integer':
            case this.schemaPrefix+'positiveinteger':
            case this.schemaPrefix+'boolean':
            case this.schemaPrefix+'date':
            case this.schemaPrefix+'time':
            case this.schemaPrefix+'NCName':
            case this.schemaPrefix+'string':
		        if (this.isUpdate) nodeDefault=node.value; 
        	    else var nodeDefault=nodeDef.getAttribute('default');
                aTable.insertRow(-1).insertCell(-1).innerHTML='<textarea id="'+ this.elementUniqueID+'_intext">'+(nodeDefault==null?'':nodeDefault)+'</textarea>';
                break;
            case '#text':
		        if (this.isUpdate) nodeDefault=node.nodeValue; 
        	    else var nodeDefault=nodeDef.getAttribute('default');
                aTable.insertRow(-1).insertCell(-1).innerHTML='<textarea cols="60" rows="10" id="'+ this.elementUniqueID+'_intext">'+(nodeDefault==null?'':nodeDefault)+'</textarea>';
                break;
            case null:
            	complexType=this.getChildNodeByName(nodeDef,this.schemaPrefix+'complexType');
            	if(complexType.length==1) break;
				var simpleType=this.getChildNodeByName(nodeDef,this.schemaPrefix+'simpleType');
		        if (this.isUpdate) {
		        	nodeDefault="";
		        	for( var i=0;i<node.childNodes.length;i++)
		        		nodeDefault+=node.childNodes[i].nodeValue;
		        }  else var nodeDefault=nodeDef.getAttribute('default');
                aTable.insertRow(-1).insertCell(-1).innerHTML='<textarea cols="60" rows="10" id="'+ this.elementUniqueID+'_intext">'+(nodeDefault==null?'':nodeDefault)+'</textarea>';
                break;
            default:
		        complexType=getNodesByXPath(this.definitionDOM,nodeDef,"//"+this.schemaPrefix+"complexType[@name='"+type+"']");
            	if(complexType.length==1) break;
        		if(complexType.length>1) throw 'updateChildNodeTag complextype: ' +type+' too many found, number: '+complexType.length;
				var simpleType=getNodesByXPath(this.definitionDOM,nodeDef,'//'+this.schemaPrefix+'simpleType[@name="'+type+'"]');
            	if(simpleType.length==0) throw 'updateChildNodeTag type: ' +type+' simple or complex not found';
        		if(simpleType.length>1) throw 'updateChildNodeTag simpleType: ' +type+' too many found, number: '+simpleType.length;
		        if (this.isUpdate) {
		        	nodeDefault="";
		        	for( var i=0;i<node.childNodes.length;i++) 
		        		nodeDefault+=node.childNodes[i].nodeValue;
		        }  else var nodeDefault=nodeDef.getAttribute('default');
                aTable.insertRow(-1).insertCell(-1).innerHTML='<textarea cols="60" rows="10" id="'+ this.elementUniqueID+'_intext">'+(nodeDefault==null?'':nodeDefault)+'</textarea>';
                break;   
        }

        if (complexType.length>1) throw 'tag ' +nodeDef.getAttribute('name')+' too many complexType';
        var postLists=[];
        if (complexType.length>0) {
            var attributes=this.getAttributes4Node(complexType[0]);
            for (var iE=0;iE<attributes.length;iE++)
            	this.updateAttribute(attributes[iE],aTable,postLists,node,parentNode,checkAttributes);
        }
        if(this.isUpdate)
        	this.actionStack.push(['updateElement',node,nodeDef]);
        else {
        	this.actionStack.push(['addElement',parentNode,nodeDef]);
        	if(aTable.firstChild==null) {
               	this.processActionStack();
                return;       		
        	}
        }
        if(actionButtons==null || this.actionButtons) {
        	aRow=aTable.insertRow(-1);
        	aRow.insertCell(-1).innerHTML='<input onmousedown="" type="button" value="'+(this.isUpdate?"update":"add")+'" onclick="' + this.callThisObject + '.processActionStack()"/>';
        	aRow.insertCell(-1).innerHTML='<input onmousedown="" type="button" value="cancel" onclick="' + this.callThisObject + '.cancel()"/>';
        }
        if(postLists==null) return;
        for (i=0;i<postLists.length;i++) {
            post=postLists[i];
            this.postSetListAJAXRequest(post[0],post[1]);
        }
        for (i=0;i<checkAttributes.length;i++) {this.checkDependencies(checkAttributes[i]);}
    },
	updateNode: function (i,event) {
		this.setDetailCoords(event);
		this.updateChildNodeTag(this.nodes[i].node);
	},
	validateAfacet: function (value) {},
	validateAlocalSimpleType: function (value) {},
	validateAnoFixedFacet: function (value) {},
	validateAnumFacet: function (value) {},
	validateAsimpleType: function (value) {},
	validateAtopLevelSimpleType: function (value) {},
	validateAanyURI: function (value) {},
	validateAbase64Binary: function (value) {},
	validateAboolean: function (value) {},
	validateAbyte: function (value) {this.validNumber(value);},
	validateAdate: function (value) {},
	validateAdateTime: function (value) {},
	validateAdecimal: function (value) {this.validNumber(value);},
	validateAderivationControl: function (value) {},
	validateAdouble: function (value) {this.validNumber(value);},
	validateAduration: function (value) {},
	validateAENTITIES: function (value) {},
	validateAENTITY: function (value) {},
	validateAfloat: function (value) {this.validNumber(value);},
	validateAgDay: function (value) {},
	validateAgMonth: function (value) {},
	validateAgMonthDay: function (value) {},
	validateAgYear: function (value) {},
	validateAgYearMonth: function (value) {},
	validateAhexBinary: function (value) {},
	validateAID: function (value) {},
	validateAIDREF: function (value) {},
	validateAIDREFS: function (value) {},
	validateAint: function (value) {this.validNumber(value);},
	validateAinteger: function (value) {this.validAinteger(value);},
	validateAlanguage: function (value) {},
	validateAlong: function (value) {this.validNumber(value);},
	validateAName: function (value) {},
	validateANCName: function (value) {},
	validateAnegativeInteger: function (value) {
		this.validNumber(value);
		if(new Number(value)>=0) throw 'must be negative integer';
	},
	validateANMTOKEN: function (value) {},
	validateANMTOKENS: function (value) {},
	validateAnonNegativeInteger: function (value) {this.validPositiveNumber(value);},
	validateAnonPositiveInteger: function (value) {
		this.validNumber(value);
		if(new Number(value)>0) throw 'must be zero or negative integer';
	},
	validateAnormalizedString: function (value) {},
	validateANOTATION: function (value) {},
	validateApositiveInteger: function (value) {
		this.validNumber(value);
		if(new Number(value)<=0) throw 'must be positive integer';
	},
	validateAQName: function (value) {},
	validateAshort: function (value) {this.validNumber(value);},
	validateAsimpleDerivationSet: function (value) {},
	validateAstring: function (value) {},
	validateAtime: function (value) {},
	validateAtoken: function (value) {},
	validateAunsignedByte: function (value) {this.validUnsignedNumber(value);},
	validateAunsignedInt: function (value) {this.validUnsignedNumber(value);},
	validateAunsignedLong: function (value) {this.validUnsignedNumber(value);},
	validateAunsignedShort: function (value) {this.validUnsignedNumber(value);},
	
	validNumber: function (value) {if(isNaN(value)) throw 'must be a number';},
	validUnsignedNumber: function (value) {
		this.validNumber(value);
		if(new Number(value)<0) throw 'must be zeror or positive integer';
	},
		validRestriction_minInclusive: function (value,restrictionValue) {
		if(value<restrictionValue) throw 'must be >= ' + restrictionValue;
	},
	validRestriction_minExclusive: function (value,restrictionValue) {
		if(value<=restrictionValue) throw 'must be > ' + restrictionValue;
	},
	validRestriction_maxInclusive: function (value,restrictionValue) {
		if(value>restrictionValue) throw 'must be <= ' + restrictionValue;
	},
	validRestriction_maxExclusive: function (value,restrictionValue) {
		if(value>=restrictionValue) throw 'must be < ' + restrictionValue;
	},
	validRestriction_minLength: function (value,restrictionValue) {
		if(value.length<restrictionValue) throw 'length must be >= ' + restrictionValue;
	},
	validRestriction_maxLength: function (value,restrictionValue) {
		if(value.length>restrictionValue) throw 'length must be <= ' + restrictionValue;
	},
	validRestriction_pattern: function (value,restrictionValue) {
		var pattern=new RegExp(restrictionValue);
		if(pattern.test(value)) return;
		throw 'Must match pattern ' + restrictionValue;
	},
	validRestriction_whiteSpace: function (value,restrictionValue) {
		if(restrictionValue=='collapse') {
			if(/^\s+$/.test(value))
				throw 'Cannot contain white space'; 
		}
	},
	validRestriction_totalDigit: function (value,restrictionValue) {},
	validRestriction_fractionDigits: function (restrictionValue) {},
	zoomRefactor: function(point) {
		return point*this.zoomRatio;
	},
	zoomRefactorFloor: function(point) {
		return Math.floor(point*this.zoomRatio);
	}
 }));