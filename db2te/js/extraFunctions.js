/*******************************************************************************
 *  Author: Peter Prib
 * 
 *   Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2014 All rights reserved.
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
 
 /* Added functions from core base.  */

if(!Array.prototype.move)
	Array.prototype.move = function(from, to) {
			if(from<to) to--;
			this.splice(to, 0, this.splice(from, 1)[0]);
		};
if(!Number.prototype.between)
	Number.prototype.between  = function (min, max) {
		    return !(this < min || this > max);
		};

if(!String.prototype.in)
    String.prototype.in = function (str) {
			for (var i = 0; i < arguments.length; i++)
				if(this==arguments[i]) return true;
			return false;
   		};

if(!String.prototype.startsWith)
    String.prototype.startsWith = function (str) {
        	return this.slice(0, str.length) == str;
   		};

if(!String.prototype.toTitle)
    String.prototype.toTitle = function () {
			var title=this.substr(0,1).toUpperCase()
				,lastLowerCase=false;
			for(var i=1 ; i<this.length; i++ ) {
				char=this.substr(i,1);
				if(char==char.toUpperCase()) {
					if(lastLowerCase) title+=' ';
					lastLowerCase=false;
					if(char=='_') continue;
					if(char==' ') continue;
				} else lastLowerCase=true;
				title+=char;
			}
			return title;
  		};
if(!String.prototype.to)
    String.prototype.to = function (type) {
		if (this==null) return null;
		if (type==null) return value;
		return this['to'+type.capitalize()];
	};
if(!String.prototype.toReal)
    String.prototype.toReal = function () {
		return parseFloat(this);
	};
if(!String.prototype.toInt)
    String.prototype.toInt = function () {
		return parseInt(this);
	};
if(!String.prototype.toTimestamp)
    String.prototype.toTimestamp = function () {
		return Date.parse(this.substr(0,4)+'/'+this.substr(5,2)+'/'+this.substr(8,11))
			+ parseInt(this.substr(21,3));
	};
if(!String.prototype.toTime)
    String.prototype.toTime = function () {
		return  Date.parse(this);
	};
if(!String.prototype.toDatetime)
    String.prototype.toDatetime = String.prototype.toTime;
if(!String.prototype.toDate)
    String.prototype.toDate = String.prototype.toTime;
	
function hideElements() {
	for (var i = 0; i < arguments.length; i++) document.getElementById(arguments[i]).style.display="none";
}

function displayElements() {
	for (var i = 0; i < arguments.length; i++) document.getElementById(arguments[i]).style.display="block";
}

function swapDisplayNext(icon) {
	if (icon.name=="collapsed") {
		icon.src = "images/icon-down-on.gif";
		icon.name="expanded";
		if(icon.nextSibling!=null)
			icon.nextSibling.style.display="block";
	} else {
		icon.src = "images/icon-right-on.gif";
		icon.name="collapsed";
		if(icon.nextSibling!=null)
			icon.nextSibling.style.display="none";
	}
	activeModalPanel.each(function(ID) { ID.value.size(); });
}

function commandSwapDisplay(icon) {
	var i = 0;
	if (icon.name=="collapsed") {
		icon.src = "images/icon-down-on.gif";
		icon.name="expanded";
		for (i = 0; i < icon.nextSibling.rows.length; i++) { 
			icon.nextSibling.rows[i].style.display="block";
			icon.nextSibling.rows[i].cells[0].style.display="";
		}
	} else {
		selected=false;
		for (i = 0; i < icon.nextSibling.rows.length; i++) 
			if(icon.nextSibling.rows[i].cells[0].childNodes[0].checked) 
				selected=true;
		if (!selected) {
			alert("Item not selected so can't collapse");
			return;
		}
		icon.src = "images/icon-right-on.gif";
		icon.name="collapsed";
		for (i = 0; i < icon.nextSibling.rows.length; i++) { 
			if(!icon.nextSibling.rows[i].cells[0].childNodes[0].checked) 
				icon.nextSibling.rows[i].style.display="none";
			else
				icon.nextSibling.rows[i].cells[0].style.display="none";
		}
	}
	activeModalPanel.each(function(ID) { ID.value.size();});
}

function commandSelectSwap(element) {
	icon=element.parentNode.parentNode.parentNode.parentNode.previousSibling;
	commandSwapDisplay(icon);
}

function checkFormCompleted(form) {
	return true;
}

function checkValue(inObject,type) {
    input=inObject.value;
	if (input==null || input=="" ) return true;
   	switch (type) {
   		case "int" :
   			//Added by Matthew
   			if(input.match(/^[0-9]*$/) == null) {
   				input = prompt('Invalid integer, please change',input);
           		inObject.value=input;
   			}
   			break;
   		default:
   			break;
    	}
   	return true;
}

function centerElement(elementIdToCenter) {
	if(elementIdToCenter == null)	return;
	var toCenter = document.getElementById(elementIdToCenter);
	var width = toCenter.getWidth();
	var height = toCenter.getHeight();
	var elementParent = toCenter.ancestors();
	var Pwidth = elementParent[0].getWidth();
	var Pheight = elementParent[0].getHeight();
	width = parseInt(Pwidth/2, 10) - parseInt(width/2, 10);
	height = parseInt(Pheight/2, 10) - parseInt(height/2, 10);
	toCenter.setStyle({'top': height + 'px'});
	toCenter.setStyle({'left': width + 'px'});
}

function showCommandHelp (callingEvent,elementId) {
	centerElement(elementId);
    var helpPanel=document.getElementById(elementId);
    helpPanel.style.display="block";
    helpPanel.style.border="groove";
    helpPanel.style.backgroundColor="#B8BFD8";
    helpPanel.style.position="absolute";
 	helpPanel.setStyle({'top': (callingEvent.clientY + 10) + 'px'});
	helpPanel.setStyle({'left': callingEvent.clientX + 'px'});
}

function commandRepeatClause (element) {
	tBody=element.parentNode.parentNode.parentNode;
	rowIndex=element.parentNode.parentNode.sectionRowIndex;
	newRow=tBody.insertRow(rowIndex+1);
	idOld=tBody.rows[rowIndex].getAttributeNode("id").value;
	newRow.innerHTML=tBody.rows[rowIndex].innerHTML;
	newRow.className="cmdRepeatable";
	newRow.setAttribute('id',idOld);
	commandRepeatClauseRebuild (tBody);
}

function commandRepeatClauseRebuild (tBody) {
	idTable=tBody.parentNode.getAttributeNode("id").value;
	for (i=0;i<tBody.childNodes.length;i++) {
		idOld=tBody.childNodes[i].getAttributeNode("id").value;
		idNew=idTable+'#'+i;
		tBody.childNodes[i].getAttributeNode("id").value=idNew;
  		node = tBody.childNodes[i].getElementsByTagName('*');
  		idOld=idOld+"_";
  		idNew=idNew+"_";
  		for (j=0;j<node.length;j++) {
			attnode=node[j].getAttributeNode("id");
			if (attnode!=null) attnode.value=attnode.value.replace(idOld,idNew);
			attnode=node[j].getAttributeNode("name");
			if (attnode!=null) attnode.value=attnode.value.replace(idOld,idNew);
			if (node[j].nodeName=='INPUT') {
				if (	node[j].getAttributeNode("type").value=='radio'
					|| node[j].getAttributeNode("type").value=='hidden'
					) {
					attnode=node[j].getAttributeNode("value");
					if (attnode!=null) attnode.value=attnode.value.replace(idOld,idNew);
				}
			}
  		}
  	}
  	i--;
	tBody.childNodes[0].childNodes[0].value=i;
   	activeModalPanel.each(function(ID) { ID.value.size();});
}

function commandGetReference (element,reference) {
	var divOverride=element.parentNode;
	var prefixId=divOverride.getAttributeNode("id").value;
	var referenceElement=document.getElementById(reference);
	if(referenceElement==null) {
		alert(" reference: "+reference+" not found");
		return;
	}
  	divOverride.innerHTML=referenceElement.cells[0].innerHTML;
  	var node = divOverride.getElementsByTagName('*');
  	for (i=0;i<node.length;i++) {
		attnode=node[i].getAttributeNode("id");
		if (attnode!=null) attnode.value = prefixId+'_'+attnode.value;
		attnode=node[i].getAttributeNode("name");
		if (attnode!=null) attnode.value = prefixId+'_'+attnode.value;
		if (node[i].nodeName=='INPUT')
			if (node[i].getAttributeNode("type").value=='radio')
				node[i].value = prefixId+'_'+node[i].value;
  	}
  	divOverride.innerHTML='<input type="hidden" value="'+prefixId+'" name="'+prefixId+'"/>'+divOverride.innerHTML;
   	activeModalPanel.each(function(ID) { ID.value.size();});
}

function commandCheckCompleted (node) {
	var isOK=true;
	var i;
	if (arguments.length==0) {
		var errNodes=document.getElementsByName("commandErrorMessage"); 
		for (i=0;i<errNodes.length;i++) 
			errNodes[i].parentNode.removeChild(errNodes[i]);
		var node = document.getElementById('commandForm');
	}
	if (node == null) throw 'commandCheckCompleted came across null node';
	try {
	  	switch(node.nodeName) {
			case '#text': break;
			case 'TEXTAREA':
			case 'INPUT':
				if (node.type != 'text' &&  node.type != 'textarea') break; 
				if (node.value != null)  
			 		if (node.value != '') break;
			    node.style.backgroundColor="red";
			    node.setAttribute('onchange','this.style.backgroundColor="#FFFFFF";this.setAttribute("onchange",null)');
			 	isOK=false;
			 	break;
			case 'TABLE':
				switch (node.className) {
					case 'cmdSelectList':
						for (i=0;i<node.rows.length;i++) {
							if (node.rows[i].cells[0].childNodes[0].checked)
								return commandCheckCompleted (node.rows[i].cells[1]);
						}
						for (i=0;i<node.rows.length;i++) {
							if (node.rows[i].cells[0].childNodes[0].defaultChecked)
								return commandCheckCompleted (node.rows[i].cells[1]);
						}
						node.parentNode.childNodes[0].src='images/error.gif';
						return false;
						break;
					case 'cmdDynRef':
						if(node.rows[0].cells[1].childNodes[0].nodeName == 'BUTTON') {
							node.rows[0].cells[1].childNodes[0].style.backgroundColor="red";
							isOK = false;
							break;
						}
						isOK = (isOK && commandCheckCompleted (node.rows[0].cells[1]));
						break;
					default:
						for (i=0;i<node.rows.length;i++) isOK = (isOK && commandCheckCompleted (node.rows[i]));
						break;
				}
				break;
			case 'BUTTON':
				node.style.backgroundColor="red";
				isOK=false;
				break;
			case 'TR':
				for (i=0;i<node.cells.length;i++) isOK = ( isOK && commandCheckCompleted (node.cells[i]));
  				break;
			default:
				for (i=0;i<node.childNodes.length;i++)
					if (!(node.childNodes[i].nodeName == '#text'))
						isOK = (isOK && commandCheckCompleted (node.childNodes[i]));
				break;
		} 
	} catch (e) {
		commandSetError(node,e);
		isOK = false;
	}
	if(arguments.length==0) 
		if(!isOK) 
			alert('Not completed\n\n Complete missing items before proceeding or cancel');
	return isOK;		
}

function commandSetError (node,errorMessage){
	var top=0;
	var nodePos=node;
	while (nodePos != null ) {
		top+=nodePos.offsetTop;
		nodePos=nodePos.offsetParent;
	}	
	var div = document.createElement('div');
	div.setAttribute('name','commandErrorMessage');
	div.style.display="block";
	div.style.border="groove";
	div.style.backgroundColor="red";
    div.style.position="absolute";
 	div.setStyle({'top': (top + 10) + 'px'});
  	div.innerHTML=errorMessage;
  	node.parentNode.insertBefore(div,node);
 }

function getNodeByXPath (xmlDOM,node,xPath,messageNotFound,messageTooMany) {
	if(node==null) node=xmlDOM;
	try{
		if (window.ActiveXObject) {    // IE
				var nodes=node.selectNodes(xPath);
				if(nodes.length==1) return nodes[0].childNodes[0];
				if(nodes.length==0) {
					if(messageNotFound==null)
						return null;
					throw messageNotFound
				}
				throw messageTooMany==null 
					? "At most one expect, more than one returned"
					: messageTooMany;	
		} if (document.implementation && document.implementation.createDocument) {
			var xpe = new XPathEvaluator();
			var nsResolver = xmlDOM.createNSResolver( xmlDOM.ownerDocument == null ? xmlDOM.documentElement : xmlDOM.ownerDocument.documentElement);
			var iterator=xpe.evaluate(xPath,node,nsResolver,XPathResult.ANY_TYPE,null);
  			item = iterator.iterateNext();
  			if(item==null) {
  				if(messageNotFound==null)
					return null;
				throw messageNotFound
			}
  			next = iterator.iterateNext();
  			if(next==null) return item;
			throw messageTooMany==null 
					? "At most one expect, more than one returned"
					: messageTooMany;	
  			
 	  	}
	} catch (e) {
		throw 'Xpath issue, path "'+xPath+'" error: ' + (typeof(e)=="object"?e.name + ": " +(e.description==null?e.message:e.description):e);
	}
   	throw 'Browse cannot handle xpath';
 }

function getNodesByXPath (xmlDOM,node,xPath) {
	var selectedNodes = null;
	if(node==null) node=xmlDOM;
	if (window.ActiveXObject!=undefined) {    // IE
		try{
			var nodes=node.selectNodes(xPath);
			selectedNodes=[];
			for (i=0;i<nodes.length;i++)
				selectedNodes.push(nodes[i].childNodes[0]);
	  		return selectedNodes;
		}
		catch (e) {throw "Xpath issue, path "+xPath+" error: " + (typeof(e)=="object"?e.name + ": " +e.description:e);}
	}
	if (document.implementation && document.implementation.createDocument) {
		selectedNodes=[];
		var xpe = new XPathEvaluator();
		var nsResolver = xmlDOM.createNSResolver( xmlDOM.ownerDocument == null ? xmlDOM.documentElement : xmlDOM.ownerDocument.documentElement);
		try{var iterator=xpe.evaluate(xPath,node,nsResolver,XPathResult.ANY_TYPE,null);}
		catch (e) {
			throw "Xpath issue, path "+xPath+" error: " + (typeof(e)=="object"?e.name + ": " +e.description:e);
		}
  		while(item = iterator.iterateNext()) {selectedNodes.push(item);}
  		return selectedNodes;
   	}
   	throw 'Browse cannot handle xpath';
}

function callNodesByXPath (aObject,aFunction,xmlDOM,node,xPath) {
	var nodes = getNodesByXPath(xmlDOM,node,xPath);
	for(var i=0;i<nodes.length;i++) 
		aFunction.apply(aObject,[nodes[i]]);
}

function callNodesWithArgsByXPath (aObject,aFunction,withArgs,xmlDOM,node,xPath) {
	var nodes = getNodesByXPath (xmlDOM,node,xPath);
	for(var i=0;i<nodes.length;i++) 
		aFunction.apply(aObject,[nodes[i]].concat(withArgs));
}

function callBack (callBackFunction,object,p1,p2,p3,p4,p5,p6,p7,p8,p9) {
	if(p9!=undefined)
		callBackFunction.call(object,p1,p2,p3,p4,p5,p6,p7,p8,p9);
	else if(p8!=undefined)
		callBackFunction.call(object,p1,p2,p3,p4,p5,p6,p7,p8);
	else if(p7!=undefined)
		callBackFunction.call(object,p1,p2,p3,p4,p5,p6,p7);
	else if(p6!=undefined)
		callBackFunction.call(object,p1,p2,p3,p4,p5,p6);
	else if(p5!=undefined)
		callBackFunction.call(object,p1,p2,p3,p4,p5);
	else if(p4!=undefined)
		callBackFunction.call(object,p1,p2,p3,p4);
	else if(p3!=undefined)
		callBackFunction.call(object,p1,p2,p3);
	else if(p2!=undefined)
		callBackFunction.call(object,p1,p2);
	else if(p1!=undefined)
		callBackFunction.call(object,p1);
	else 
		callBackFunction.call(object);
}

function getXSLTransformedCallbackXML (xml,xsl,parameters,callBackFunction,object,p1,p2,p3,p4,p5,p6,p7,p8) {
	getXSLTransformed(xml,xsl,parameters,callBackFunction,object,p1,p2,p3,p4,p5,p6,p7,p8);
}

function getXSLTransformedCallbackXSL (xsl,xml,parameters,callBackFunction,object,p1,p2,p3,p4,p5,p6,p7,p8) {
	getXSLTransformed(xml,xsl,parameters,callBackFunction,object,p1,p2,p3,p4,p5,p6,p7,p8);
}

function getXSLTransformed (xml,xsl,parameters,callBackFunction,object,p1,p2,p3) {
	xmlDOM=(typeof xml == "string" ? getDOMParsed(xml,null,getXSLTransformedCallbackXML,object,callBackFunction,object,p1,p2,p3) : xml );
	if (xsl==null || xsl=="" ) throw "xsl is null or blank";
	if( typeof xsl == "string" )
		try {var xslDOM = getDOMParsed(xsl,null,getXSLTransformedCallbackXSL,object,callBackFunction,object,p1,p2,p3);}
	    catch (e) {
	    	throw "error parsing xsl, exception: " + e.toString() +  (typeof xsl == "string" ? ' xsl: '+ xsl : ""); 
		}
	else xslDOM=xsl;
	if (window.ActiveXObject) {   //ie code
		if(parameters!=undefined)
			for (var paramName in parameters)
				xmlDOM.addParameter(paramName, parameters[paramName]);
		if(callBackFunction!=undefined)
			return getDOMParsed(xmlDOM.transformNode(xslDOM));
		else {
			callBack(callBackFunction,object,getDOMParsed(xmlDOM.transformNode(xslDOM)),p1,p2,p3);
			return;
		}
 										  // code for Mozilla, Firefox, Opera, etc.
	} else if (document.implementation && document.implementation.createDocument)  {
		if (xmlDOM==null) throw "parsed xsl is null, may be bug due to only asych get";
		xsltProcessor=new XSLTProcessor();
		try { xsltProcessor.importStylesheet(xslDOM);
		} catch (e) {
			throw "error in xsl syntax, exception: " + e.toString() +  (typeof xsl == "string" ? ' xsl: '+ xsl : ""); 
		}
		if(parameters!=undefined)
			for (var paramName in parameters) 
				if(parameters[paramName]!=null)
					xsltProcessor.setParameter(null,paramName,parameters[paramName]);
		if(callBackFunction==undefined) 
			return xsltProcessor.transformToDocument(xmlDOM,document);
		else {
			callBack(callBackFunction,object,xsltProcessor.transformToDocument(xmlDOM,document),p1,p2,p3);
			return;
		}
	}
	throw "browser not supported for xsl transform";
}

function getDOMParsedhandler () {
	switch (this.readyState) {
		case 0: return; //UNSENT
		case 1: return; //OPENED
		case 2: return; //HEADERS_RECEIVED
		case 3: return; //LOADING
		case 4:  //done
			if(this.status == 200) { // so far so good
				if(this.responseXML != null ) return;   // success!
  				else throw 'Empty response';
 			}
  			throw 'fetched the wrong page or network error, status: '+ this.status;
  		default:
  		throw 'unknown ready state:'+this.readyState + ' status: '+ this.status;
	}
}

function appendXML2HTML (node,xmlDOM,xslDOM,parameters) {
	if (window.ActiveXObject) {    //IE
		if(parameters!=undefined)
			for (var paramName in parameters) {
				xmlDOM.addParameter(paramName, parameters[paramName]);
			}
		node.innerHTML=xmlDOM.transformNode(xslDOM);
  	} else if (document.implementation && document.implementation.createDocument) {
  		xsltProcessor=new XSLTProcessor();
  		xsltProcessor.importStylesheet(xslDOM);
		if(parameters!=undefined)
			for (var paramName in parameters)
				xsltProcessor.setParameter(null,paramName,parameters[paramName]);
  		node.appendChild(xsltProcessor.transformToFragment(xmlDOM,document));
  	}
}

var DOMParsed = $H();

function getDOMParsed (data,xmlName,callBackFunction,object,p1,p2,p3,p4,p5,p6,p7,p8) {
  	if(xmlName!=null) {
  		var DOMxmlName = DOMParsed.get(xmlName);
		if (DOMxmlName !==null) { 
			if(callBackFunction==null)
				return DOMxmlName; 
			callBack(callBackFunction,object,DOMxmlName,p1,p2,p3,p4,p5,p6,p7,p8);
			return;
		}
	}
	switch(typeof data) {
	 	case 'string':
	 		break;
	 	case 'object':
	 		return data;
	 	default:
	 		throw "getDOMParsed unknown data type: " + typeof data ; 
	 }

  	
	var xhttp = null;
	if (data.indexOf('<')<0) {
  		var DOMxmlName = DOMParsed.get(data);
		if (DOMxmlName!==undefined)
			return DOMxmlName; 
		xmlName=data;
		if (window.XMLHttpRequest) xhttp=new window.XMLHttpRequest();
		else xhttp=new ActiveXObject("Microsoft.XMLHTTP");
		xhttp.withCredentials = "true";
		if(DEVELOPMENT_MODE) // forces bypasses of browser cache
			data += (data.match(/\?/) == null ? "?" : "&") + (new Date()).getTime();
		if (callBackFunction==null) 
			try{
				xhttp.open("GET",data,false);
			} catch(e) {
				throw 'Load xml failure: ' + e + ' xml: '+ data+ ' may be a browser compatiblility issue';
			}
		else {
		    xhttp.onreadystatechange= function() { 
				if (xhttp.readyState==4)
        	    	if (xhttp.status==200) {
        	    		var DOMxml=getDOMParsedParse(xhttp.responseText);
        	    		if(DEVELOPMENT_MODE)
        	    			data=data.split('?')[0];
        	    		DOMParsed.set(data,DOMxml);
        	    		callBack (callBackFunction,object,DOMxml,p1,p2,p3,p4,p5,p6,p7,p8)
            	    }
    		}
			xhttp.open("GET",data );
    	}
		xhttp.setRequestHeader('Content-Type', 'application/xml');  
		xhttp.setRequestHeader('Access-Control-Allow-Origin', '*');
		xhttp.setRequestHeader("If-Modified-Since", new Date(0));
		xhttp.setRequestHeader("Cache-Control","no-cache, no-store, must-revalidate, max-age=0, post-check=0, pre-check=0 ");
		xhttp.setRequestHeader("Pragma","no-cache");
		xhttp.setRequestHeader("Expires","-1");
//		xhttp.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;
		xhttp.send();
		if (callBackFunction!=null) return null;
		data= xhttp.responseText; 
	}
	var DOMxmlName=getDOMParsedParse(data);
  	if(xmlName!==undefined) 
	  	if(xmlName!==null) 
   			DOMParsed.set(xmlName,DOMxmlName);
	return DOMxmlName;
}

function getDOMParsedParse(data) {
	if (window.DOMParser) {
		parser=new DOMParser();
		var xmlDOM=parser.parseFromString(data,"text/xml");
	  	if (xmlDOM.documentElement.nodeName=="parsererror") throw " xml parser error: "+xmlDOM.documentElement.childNodes[0].nodeValue+ ' xml: '+ data;
	} else { //try Internet Explorer
	 	try {
	 		xmlDOM=new ActiveXObject("Microsoft.XMLDOM");
			xmlDOM.async="false";
			xmlDOM.loadXML(data);
			xmlDOM.setProperty("Cache-Control", "no-cache");
			xmlDOM.setProperty("SelectionLanguage","XPath");
			xmlDOM.setProperty("SelectionNamespaces","xmlns:xhtml='http://www.w3.org/1999/xhtml' xmlns:xsl='http://www.w3.org/1999/XSL/Transform' xmlns:xs='http://www.w3.org/2001/XMLSchema'");  
		} catch(e) {
				throw 'Load xml failure: ' + e + ' xml: '+ data;
		}
  	}
  	return xmlDOM;
}

function getXMLString(xmlDOM){
	try { //  Mozilla browsers
		var serializer = new XMLSerializer();
		return serializer.serializeToString(xmlDOM);
	} 
	catch (e) { // Internet Explorer 
		return xmlDOM.xml;
	}
}

function initCanvas(canvas) {
    if (window.G_vmlCanvasManager && window.attachEvent && !window.opera)
    	canvas = window.G_vmlCanvasManager.initElement(canvas);
    return canvas;
}

//***** used for filling in options on select
function selectGetListAJAXRequest(id,inSQL) {
	var i =0;
	var selectNode = document.getElementById(id);
	if (selectNode==null) {alert('selectGetListAJAXRequest could find id: '+id);return;}
	for (i=selectNode.length-1;i>=0;i--) {selectNode.remove(selectNode.i);}
	selectNode.insertRow(-1).insertCell(-1).innerHTML='<img height="40px" width="40px" src="images/loadingpage.gif"/>';
	POSTDATA = new Object();
	POSTDATA.SQL = inSQL;
	POSTDATA.returntype 	= 'JSON';
	POSTDATA.action         = 'executeSQL';
	POSTDATA.USE_CONNECTION = getActiveDatabaseConnection();
	new Ajax.Request(ACTION_PROCESSOR, {
		'parameters': POSTDATA,
		onSuccess: function(transport) {
			var i = 0;
			var opt = null;
			for (i=selectNode.length-1;i>=0;i--) {selectNode.remove(selectNode.i);}
			selectNode.parentNode.nextSibling.childNodes[0].style.display="none";
			var result = transport.responseJSON;
			try{
				if(result == null) throw "An invalid JavaScript object was returned";
				if(result.flagGeneralError == true && result.connectionError == true) initiateConnectionRefresh();
				if(result.flagGeneralError == true || result.returnCode == "false" || result.returnCode == false) 
					throw (Object.isString(result.returnValue)?result.returnValue:result.returnValue.STMTMSG);
			} catch(e) {
				opt=document.createElement('option');
				opt.text=e;
				try{selectNode.add(opt,null);} catch (e) {selectNode.add(opt);}
				return;
			}
			for (i=1;i<result.returnValue.resultSet[0].data.length;i++) {
				opt=document.createElement('option');
				opt.text=result.returnValue.resultSet[0].data[i];
				try{selectNode.add(opt,null);} catch (e) {selectNode.add(opt);}
			}
			selectCheckDependencies(id);
		},
		'onException': function(transport,exception) {
			var opt=document.createElement('option');
			opt.text=exception;
			try{selectNode.add(opt,null);} catch (e) {selectNode.add(opt);}
		},
		onComplete: function(transport) {
		}
	});
}
function selectCheckDependencies(id,detailDependencies) {
		var path = null;
		var selectNode = null;
		var i = 0;
		var j = 0;
		var changed=[];
		for(i=0;i<detailDependencies.length;i++) {
			dep=detailDependencies[i];
			if(dep[1]!=id) continue;
			for (j=0;j<changed.length;j++) {change=changed[j];if(dep[0]==change[0]) break;}
			if(j==changed.length) changed.push(j);
		}
		for (i=0;i<changed.length;i++) {
			var dep=detailDependencies[i];	
			sqlNode=dep[2];
			var sql='';
			var sqlOK=true;
			for (var iS=0;iS<sqlNode.childNodes.length;iS++) {
               	if(sqlNode.childNodes[iS].nodeType==3) {
               		sql+=sqlNode.childNodes[iS].nodeValue;
               		continue;
               	}
               	if(sqlNode.childNodes[iS].nodeName=="db2mc:value") {
					variable=sqlNode.childNodes[iS].getAttribute('id');
					if(variable!=null) {
						selectNode = document.getElementById(id);
						if (selectNode.length==0) {
							sql+="***logic error not found***";
							sqlOK=False;
							continue;
						}
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
							selectNode = document.getElementById(this.elementUniqueID+'_in_'+attr);
							if (selectNode.length==null || selectNode.length==0) {
								//alert("logic error attribute "+attr+" not found" );
								continue;
							}
							path =variable.substr(0,iVA)+selectNode.options[selectNode.selectedIndex].text+variable.substr(iVA+12+iVAe);
						} else path=variable;
						var parentNode=dep[3];
						nodes=getNodesByXPath(this.xmlData,parentNode,path);
						if(nodes.length!=1) {
							alert("logic error expected 1 but found "+nodes.length+" xpath: "+path);
							sql+="***logic error too many nodes***";
							sqlOK=false;
						} else sql+=nodes[0].nodeValue;
						continue;
					}
				}
			}
			selectNode=document.getElementById(this.elementUniqueID+'_in_'+dep[0]);
			selectNode.parentNode.nextSibling.childNodes[0].style.display="block";
			selectGetListAJAXRequest(dep[0],sql); 
		}
}

function getPHPSessionId() {
	try {
	    var PHPSESSID=document.cookie.substr(document.cookie.lastIndexOf('PHPSESSID=')+10,document.cookie.length);
   		return PHPSESSID.substr(0,PHPSESSID.indexOf(';'));
   	} catch(e) {return null;}
}

function resetCaching() {
	DOMParsed = $H();
}

function formatNumberToAbbreviated(value) {
	isAbbreviated=true;
	if(typeof value!='number') value=parseFloat(value);
	if (value>Math.pow(10,16)) valueAbbr = Math.round(value/Math.pow(10,15)).toString()+'P';
	else if (value>Math.pow(10,13)) valueAbbr = Math.round(value/Math.pow(10,12)).toString()+'T';
	else if (value>Math.pow(10,10)) valueAbbr = Math.round(value/Math.pow(10,9)).toString()+'G';
	else if (value>Math.pow(10,7)) valueAbbr = Math.round(value/Math.pow(10,6)).toString()+'M';
	else if (value>Math.pow(10,4)) valueAbbr = Math.round(value/Math.pow(10,3)).toString()+'K';
	else { 
		isAbbreviated=false;
		if (value == Math.round(value)) valueAbbr = value.toString();
		else if (value>=10000) valueAbbr = value.toFixed(0).toString();
		else if (value>=1000) valueAbbr = value.toFixed(1).toString();
		else if (value>=100) valueAbbr = value.toFixed(2).toString();
		else if (value>=10) valueAbbr = value.toFixed(3).toString();
		else if (value<10) valueAbbr = value.toPrecision(2).toString();
		else valueAbbr = value.toString();
	}
	return valueAbbr;
}

function formatHexToString (value) {
	if(value==null) return null;
	var valueString = '';
    for (var i = 0; i < value.length; i += 2)
    	valueString += String.fromCharCode(parseInt(value.substr(i, 2), 16));
    return valueString;
}

function formatStringToHex(value) {
	if(value==null) return null;
    var hex = '';
    for(var i=0;i<value.length;i++) 
        hex += ''+value.charCodeAt(i).toString(16);
    return hex;
}

function xmlEncodeString(value) {
	if(value==null) return null;
	return value.toString().replace(/([\&"<>])/g, function(str, item) {
		return {
			'&': '&amp;',
			'"': '&quot;',
			'<': '&lt;',
			'>': '&gt;'
		}[item];
	});
}

function jsonParserDecoder(key,value) {
	if (typeof value !== 'string') return value;
	if(value==null) return "";
	if(value=='null') return null;
	if(value.length<2) return value;
	if(value.substr(0,1)!='"') {
		if(value.substr(0,1)!='[' && value.substr(0,1)!='{') 
		 	return value;
		return JSON.parse(value,jsonParserDecoder);
	} else if(value.substr(1,1)!='[' && value.substr(1,1)!='{') 
		return value;
	return JSON.parse(value.substr(1,jsonText.length-2),jsonParserDecoder);
}

function xmlDOM2json(node) {
	if(node==null) return;
	if(node.childNodes.length==0  && node.attributes.length==0) {
		switch (node.nodeValue) {
			case 'jsonTrue': return true;
			case 'jsonFalse': return false;
			case 'jsonNull': return null;
		}
		return node.nodeValue;
	}
	if(node.childNodes.length>0)
		switch (node.childNodes[0].nodeName) {
			case 'jsonObject': 
				var jsonText = formatHexToString(node.childNodes[0].textContent);
				if(jsonText==null) return "";
				if(jsonText.length==0) return jsonText;
				if(jsonText.substr(0,1)=='"') {
					jsonText=jsonText.substr(1,jsonText.length-2);
					if(jsonText.length==0) return "";
					jsonText=jsonText.replace(/\\'/g,'\'').replace(/\\"/g, '"').replace(/\\0/g, '\0').replace(/\\\\/g, '\\');
				}
				return JSON.parse(jsonText,jsonParserDecoder);
			case 'jsonArrayElement':
				var nodeJSON=[];
				for (var i=0;i<node.childNodes.length;i++)  
					nodeJSON[nodeJSON.length]=xmlDOM2json(node.childNodes[i]);
				return nodeJSON 
		}
	var nodeJSON={}
	for (var i=0;i<node.childNodes.length;i++) 
		if (node.childNodes[i].nodeType == 1) {
			switch (node.childNodes[i].nodeName) {
				case 'jsonDollarParameter':
					nodeJSON[node.childNodes[i].getAttribute('name')]=node.childNodes[i].textContent;
					continue;
			}
			nodeJSON[node.childNodes[i].nodeName]=xmlDOM2json(node.childNodes[i]);
		}
	for (var i=0;i<node.attributes.length;i++) {
		switch (node.attributes[i].nodeValue) {
			case 'jsonTrue':
				nodeJSON[node.attributes[i].nodeName]=true;
				continue;
			case 'jsonFalse':
				nodeJSON[node.attributes[i].nodeName]=false;
				continue;
			case 'jsonNull':
				nodeJSON[node.attributes[i].nodeName]=null;
				continue;
		}
		nodeJSON[node.attributes[i].nodeName]=node.attributes[i].nodeValue;
	}
	return nodeJSON 
}

function json2xml(tag, obj, emptyIsNull, hexObjectWhenTag) {
	try{
		if(hexObjectWhenTag!=null)
			for(var i=0;i<hexObjectWhenTag.length;i++)
				if(hexObjectWhenTag[i]==tag)		
					return '<' + tag + '><jsonObject>' 
						+ formatStringToHex(JSON.stringify(obj)) 
						+ '</jsonObject></' + tag + '>';
		if (typeof obj === 'undefined' || obj === null) 
			return '<' + tag + '/>';
		if (typeof obj !== 'object')
			return '<' + tag + '>' 
				+ xmlEncodeString(obj) 
				+ '</' + tag + '>';

		var elementValue ='';
		if (obj.constructor === Array) {
			for (var i = 0; i < obj.length; i++) {
				if (typeof obj[i] !== 'object'
				|| obj[i].constructor == Object) {
					elementValue += json2xml('jsonArrayElement', obj[i],emptyIsNull, hexObjectWhenTag);
					continue;
				}
				throw new Error((typeof obj[i]) + ' is not supported.');
			}
			return '<'+tag+'>' + elementValue + '</'+tag+'>';
		}
		if (obj.constructor !== Object)
			return '<' + tag + '/>';
		var attributes ='';
		if (typeof obj['#text'] !== 'undefined') {
			if (typeof obj['#text'] == 'object')
				throw new Error((typeof obj['#text']) + ' which is #text, not supported.');
			elementValue += xmlEncodeString(obj['#text']);
		}
		for (var name in obj) {
			if(name==null) continue;
			var objElement=obj[name];
			if(objElement==null) continue
			if (name.charAt(0) == '$') {
				elementValue += '<jsonDollarParameter name="' + name + '">'+xmlEncodeString(objElement)+'</jsonDollarParameter>';
				continue;
			}
			if (name.charAt(0) == '@') {
				if (typeof obj[b] == 'object')
					throw new Error((typeof objElement) + ' attribute not supported.');
				attributes += ' ' + name.substring(1) + '="' + xmlEncodeString(objElement) + '"';
				continue;
			} 
			switch (obj[name].constructor) {
				case Array :
					if(hexObjectWhenTag!=null) {
						for(var i=0;i<hexObjectWhenTag.length;i++)
							if(hexObjectWhenTag[i]==name) {		
								elementValue += '<' + name + '><jsonObject>' 
									+ formatStringToHex(JSON.stringify(objElement)) 
									+ '</jsonObject></' + name + '>';
								break;
							}
						if( i<hexObjectWhenTag.length) continue;
					}

					elementValue+='<'+name+'>';
					for (var i = 0; i < objElement.length; i++) {
						if (typeof objElement[i] !== 'object'
						|| objElement[i].constructor == Object) {
							elementValue += json2xml('jsonArrayElement', objElement[i],emptyIsNull, hexObjectWhenTag);
							continue;
						}
						throw new Error((typeof objElement[i]) + ' is not supported.');
					}
					elementValue+='</'+name+'>';
					continue;
				case Object :
					elementValue += json2xml(name, objElement,emptyIsNull, hexObjectWhenTag);
					continue;
				case String :
					if(objElement==null) continue;
					if(emptyIsNull&&objElement=="") continue;
					if(objElement.length<36) {
						attributes += ' '+name+'="'+xmlEncodeString(objElement)+'"';
						continue;
					}
					elementValue += '<' + name + '>' + xmlEncodeString(objElement) + '</' + name + '>';
					continue;
				case Number :
					attributes += ' '+name+'="'+objElement+'"';
					continue;			
				case Boolean :
					attributes += ' '+name+'="'+(objElement?'jsonTrue':'jsonFalse')+'"';
					continue;			
				default:
					throw new Error((typeof objElement) + ' is not supported.');
			}
		}
		return '<' + tag + attributes + ( elementValue =='' ? '/>' : '>'+ elementValue + '</' + tag + '>' );
   	} catch(e) {
		throw new Error('jso2xml error: '+e);
   	}
}

function compareNodes(oldNode, newNode, compare) {      //  this function under construction
	if( compare==null)
		var compare= {
			 attribute: {
				 match: function(attribute) {
				 	}
				,mismatch: function(oldAttribute,newAttribute) {
					return '<attribute key="'+oldAttribute.nodeName+'" old="'+oldAttribute.nodeValue+'" new="'+newAttribute.nodeValue+'"/>';
					}
				,missingNew: function(attribute) {
					return '<attribute key="'+attribute.nodeName+'" new="'+attribute.nodeValue+'"/>';
					} 
				,missingOld : function(attribute) {
					return '<attribute key="'+attribute.nodeName+'" old="'+attribute.nodeValue+'"/>';
					}
				}
			,node: {
				 isSameElement: function(oldNode,newNode) {
				 		if(oldNode.nodeType != newNode.nodeType) return false;
				 		if(oldNode.nodeType != 1) return true;
						return (oldNode.nodeName = newNode.nodeName);
				 	}
				,match: function(node) {
				 	}
				,mismatch: function(oldNode,newNode) {
						return '<pair><new th>"'+node.nodeValue+'</new></node>'
					}
				,missingNew: function(node) {
						return '<node key="'+node.nodeName+'"><new>"'+node.nodeValue+'</new></node>'
					} 
				,missingOld : function(node) {
						return '<node key="'+node.nodeName+'"><old>"'+node.nodeValue+'</old></node>'
					}
				}
			};
	var diff="";
	if(oldNode == null)
		var oldAttributes=[] , oldNodes=[];
	else 
		var oldAttributes=oldNode.attributes , oldNodes=oldNode.childNodes;
	if(newNode == null)
		var newAttributes=[] , newNodes=[];
	else 
		var newAttributes=newNode.attributes , newNodes=oldNode.childNodes;
    if( !compare.node.isSameElement(oldNode,newNode)   	
	|| oldNode.nodeValue != newNode.nodeValue )
		diff += compare.node.mismatch(oldNode,newNode);
	else
		diff += compare.node.match(oldNode,newNode);
	var o=0;n=0;
	while (o<oldAttributes.length || n<newAttributes.length) {
		var oldAttribute=oldAttributes[o],newAttribute=newAttributes[n];
		if(oldAttributes.nodeName==newAttribute.nodeName) {
			if(oldAttribute.nodeValue==newAttribute.nodeValue)
				diff += compare.attribute.match(oldAttribute);
			else
				diff += compare.attribute.mismatch(oldAttribute,newAttribute);
			o++;n++;
			continue;
		}
		if(oldAttribute.nodeName>newAttribute.nodeName) {
			diff += compare.attribute.missingNew(newAttribute);
			n++;
			continue;
		}
		diff+= compare.attribute.missingOld(oldAttribute);
		o++;
	}
	for (o=o;oldAttributes.length;o++) diff += compare.attribute.missingOld(oldAttributes[o]);
	for (n=n;newAttributes.length;n++) diff += compare.attribute.missingANew(newAttributes[n]);
	o=0;n=0;
	while (o<oldNodes.length || n<newNodes.length) {
		var oldNode=oldNodes[o]; newNode=newNodes[n]; 
		if(compare.node.isSameElement(oldNode,newNode)) {
			diff+=compareNodes(oldNode,newNode,compare);
			n++;o++;
			continue;
		}
		for (i=o;i<oldNodes.length;i++)    // search for same element 
			if(compare.node.isSameElement(oldNodes[i],newNode)) break;
		for (j=n;j<newNodes.length;j++)    // search for same element
			if(compare.node.isSameElement(oldNode,newNodes[j])) break;

		if(i>=oldNodes.length) i=9999; 
		if(j>=newNodes.length) j=9999;
		if((i-o)>(j-n))
			for (n=n;n<j;n++) compare.node.missingNew(newNodes[n]);
		else 
			for (o=o;o<i;o++) compare.node.missingOld(oldNodes[o]);
		continue;
	}
	for (o=o;o<oldNodes.length;o++) compare.node.missingOld(oldNodes[o]);
	for (n=n;n<newNodes.length;n++) compare.node.missingNew(newNodes[n]);
}

function callEval (inCallFunction) {
	try{
		eval(inCallFunction);
	} catch(e) {
		alert("callEval: " + inCallFunction + "\nerror: " + e.toString() + "\nstack trace:\n\n" + e.stack);
	}
}
function callWithArgs (inCallFunction,localStack,argArray) {
	try{
		inCallFunction.apply(localStack,argArray);
	} catch(e) {
		alert("callWithArgs error: " + e.toString() + "\nstack trace:\n\n"+e.stack);
	}
}

function getXmlNodeAsString(xmlNode) {
	return (typeof XMLSerializer!=="undefined") 
			? (new window.XMLSerializer()).serializeToString(xmlNode)
			: xmlNode.xml;
 }
 
function coalesce() {
	var args = coalesce.arguments;
	for (var i=0; i<args.length; ++i)
 		if (args[i] !=  null) return args[i];
	return null; 
}
function nullif(a,b) {
	return (a==b?null:a)	
}
function getWord(value,wordPosition) {
    return value.split(/\s+/g,wordPosition+1)[wordPosition-1];
}

function deepClone (deepObject) {
	if(deepObject==null) return null;
	if(deepObject instanceof Array) 
		var newObj=[];
	else if(deepObject instanceof String) 
		return new String(deepObject);  
	else if(deepObject instanceof Number) 
		return new Number(deepObject);  
	else if(deepObject instanceof Date)  
		return new Date(deepObject);
	else if(typeof deepObject == "object")
		var newObj={};
	else return deepObject;
	for (i in deepObject)
		newObj[i]=deepClone(deepObject[i]);
	return newObj;
}
function rangeLimit (value,min,max) {
	if(min!=null)
		if(value<min) 
			return min;	
	if(max!=null) 
		if(value>max) 
			return max;
	return value;
}

var GLOBAL_TRANSFORMS = {
	  debugMode : false
	 ,toogleDebugMode : function () {
	 		this.convert=(this.debugMode?this.convertNoDebug:this.convertDebug);
	 		this.debugMode=!this.debugMode; 
	 		alert('GLOBAL_TRANSFORMS debug mode is '+(this.debugMode?"on":"off"));
	 	}
	 ,convertNoDebug:  function (value,options) {
			if(value == null) return value;
			if(options == null) return value;
			try{
				return this[options.transform.toLowerCase()](value,options);
		 	} catch (e) {
				alert("GLOBAL_TRANSFORMS  error : " + e.toString() + "\nstack trace:\n\n"+e.stack);
			}
		 }
	 ,convertDebug:  function (value,options) {
		 	alert("Debug GLOBAL_TRANSFORMS - Before: "+value);
			return this.convertNoDebug(value,options);
			alert("Debug GLOBAL_TRANSFORMS - After: "+value);
		}
	,"camelize"		: function(value) {return value.camelize();}
	,"capitilize"	: function(value) {return value.capitalize();}
	,"dasherize"	: function(value) {return value.dasherize();}
	,"deunderscore"	: function(value) {return value.replace("_"," ");}
	,"deunderscorecapitilize"	: function(value) {return value.replace("_"," ").capitalize();}
	,"dropsquarebracketprefix"	: function(value) {
			if(value.substr(0,1)!="[") return value;
			return value.split("]")[1];
		}
	,"replace"		: function(value, options) {
			if(options.pattern==null)
				return value.replace(options.from,options.to);
			if(options.regExp==null)
				options.regExp=new RegExp(options.pattern,options.modifiers);
			return value.replace(options.regExp,options.to);
		 }
	,"tolowercase"	: function(value) {return value.toLowerCase();}
	,"touppercase"	: function(value) {return value.toUpperCase();}
	,"underscore"	: function(value) {return value.underscore();}
	,"xpath"	: function(value,options) {
			if(value==null) return;
			switch (typeof value) {
				case 'string':
					var node = getXMLString(getNodeByXPath(getDOMParsed(value),null,options.$xpath));
				case 'object':
					switch (Object.prototype.toString.call(value)) {
					case "[object XMLDocument]":
						var node = getNodeByXPath(value,null,options.$xpath);
					}
			}
			if(node==undefined)
				throw 'xpath expecting string or xml object found type: "'+typeof value+'"'+(typeof value=='object'?' class: "'+Object.prototype.toString.call(value)+'"':"")+" value:"+value;
			switch (node.nodeType) {
				case 2:
					return node.value;
			}
			return node;
		}
	};

	GLOBAL_TRANSFORMS.convert=GLOBAL_TRANSFORMS.convertNoDebug;
	GLOBAL_TRANSFORMS.camelise=GLOBAL_TRANSFORMS.camelize;
	GLOBAL_TRANSFORMS.capitilise=GLOBAL_TRANSFORMS.capitilize;
	GLOBAL_TRANSFORMS.deunderscorecapitilise=GLOBAL_TRANSFORMS.deunderscorecapitilize;
	GLOBAL_TRANSFORMS.lowercase=GLOBAL_TRANSFORMS.tolowercase;
	GLOBAL_TRANSFORMS.uppercase=GLOBAL_TRANSFORMS.touppercase;

var pribProcess = Class.create({
	initialize: function(backoutFunction) {
		this.process=[];
		this.backout=backoutFunction
	}
	,add: function() {
		this.process.push({
			object: null
			,callFUnction: null
			,args: null
			,async: null
			});
	}
	,backout: function() {}
	,callWithArgs: function(inCallFunction,localStack,argArray) {
		try{
			this.executeAction();
		} catch(e) {
			alert("task call error: " + e.toString() + "\nstack trace:\n\n"+e.stack);
			this.backout();
		}
	}
	,execute: function() {
		while (this.process.length>0) {
			this.action=this.process.pop();
			if(this.action.async) {
				setTimeout(this.callWithArgs.bind(this),1);
				return;
			}
			this.executeAction();
		}
	}
	,executeAction: function() {
		this.action.callFunction.apply(this.action.object,this.action.args);
	}
});