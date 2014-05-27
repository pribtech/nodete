/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2011 All rights reserved.
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

CORE_CLIENT_ACTIONS.set("commandForm",Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		$super(callParameters.uniqueID + "_commandForm", "commandForm");
			
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		this.callParameters = callParameters;
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		if(parentPanel != null)
			parentPanel.registerNestedObject(this.elementUniqueID, this);
		
		this.draw();
	},
	
	draw: function() {
		var menu = [];
		var thisObject = this;
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		if(parentPanel != null)
			parentPanel.setContent(output, 'Connection Form', "");
	},

	loadCommand: function(data) {
		if(data==null)
			this.cmdDOM=getDOMParsed((data.substr(0,10).indexOf('<?xml')>-1?'':'<?xml version="1.0" encoding="UTF-8"?>')+data);

		switch (this.definition.split(" ",1)[0].toLowerCase()) {
			case 'select':
			case 'with':
				this.postGetXMLDataAJAXRequest('getSQLValue',this.definition,'storeSchema',returnFunction);
				return;
			default:
				this.definitionDOM=getDOMParsed(this.definition);
				this.definitionLoaded=this.definition;
				this.checkSchema(returnFunction);
		}

	},
	
	postGetXMLDataAJAXRequest: function(action,query,processFunction,functionArg) {
		var thisObject = this;
		var thisProcessFunction = (processFunction==undefined?'updateData':processFunction);
		var thisFunctionArg=functionArg;
		POSTDATA = new Object();
		POSTDATA.returntype 	= 'JSON';
		if(Object.isString(query)) {
			POSTDATA.query      	= query;
		} else {
			var i=0;
			query.each(function(value) {POSTDATA['query[' + (i++) + ']'] = value;});
		}
		POSTDATA.action         = action;
		POSTDATA.USE_CONNECTION = getActiveDatabaseConnection();
		new Ajax.Request(ACTION_PROCESSOR, {
			'parameters': POSTDATA,
			onSuccess: function(transport) {
				var result = transport.responseJSON;
				if(result == null)
					throw "An invalid JavaScript object was returned"
				if(result.flagGeneralError == true && result.connectionError == true)
					initiateConnectionRefresh();
				if(result.flagGeneralError == true ||  isReturnCodeNotOK(result) )
					throw getReturnErrorMessage(result);
				try {eval('thisObject.'+thisProcessFunction+'(result.returnValue,thisFunctionArg)')} 
			},
			'onException': function(transport,exception) {
				openModalAlert( 'Command form, function: '+thisProcessFunction+' error:' + exception==null ? transport.statusText : ( typeof(exception)=="object" ? exception.name+" : "+exception.description : exception ));
			},
			'onFailure': function(transport,exception) {
				openModalAlert('Command form, function: '+thisProcessFunction+' error:' + exception==null ? transport.statusText : ( typeof(exception)=="object" ? exception.name+" : "+exception.description : exception ));
			},
			'onComplete' : function(transport) {
			}
		});
	},

	hoverHelp: function (node) {
		var id=getAttribute('help');
		if (id==null) return;
		var simpleType=getNodesByXPath(this.definitionDOM,nodeDef,'//command/help[@name="'+id+'"]');
		if(simpleType.length==0) throw new Exception('Help '+id+' not found for tag '+node);
		return 	' onmouseout="hideElements(\''+id+'\')" '
			+	' onmouseover="showCommandHelp(event,\''+id+'\')" ';
	}




}));




var Animal = Class.create({
  initialize: function(name, sound) {
    this.name  = name;
    this.sound = sound;
  },

  speak: function() {
    alert(this.name + " says: " + this.sound + "!");
  }
});

var Snake = Class.create(Animal, {
  initialize: function($super, name) {
    $super(name, 'hissssssssss');
  }
});

var ringneck = new Snake("Ringneck");
ringneck.speak();






var CommandAbstract = Class.create({
  initialize: function(name) {
    this.name  = name;
  },

});

	getHtml: function() {
		stmt=this.getHtmlPre();
		if (isset($this->clauses)) {
			foreach($this->clauses as $value) {
				if ( get_class($value)== "") {
					if (isset($this->help)) {
						stmt .=  '<a class="help" '.$this->hoverHelp().'>'.($this->spacePad?' ':'').$value.'</a>';	
					    continue;
					}
					if(this.spacePad) stmt += ' ';
					continue;	
				} 
				stmt += $value.getHtml();
			}
		}
		return stmt+this.getHtmlPost();
	},
	getStmt: function()	{
		if (!isset(this.clauses)) return "";
		if (!isset(this-.clauses[0])) return "";
		stmt="";
		foreach($this->clauses as $value) {
			if ( get_class($value)== "") {
				if(this.spacePad) stmt += ' ';
			} else 
				$stmt .= $value->getStmt();
		}
		return stmt;
	},
	getHtmlPre: function() {return "";},
	getHtmlPost: function() {return "";},
	setClause: function(value) {
		this.clauses[] = value;
	},
	loadXMLNode: function(node) {
		if (node== null) {return;}
		if(node->hasAttributes()) {
    	   	attributes = node->attributes;
        	if(!is_null(attributes)) {
            	foreach (attributes as index=>attr) {
					this->setAttributes(attr);
				}
			}
		}
		if (!node.hasChildNodes()) {return;}
		foreach(node.childNodes as childNode) {
    		if($childNode->nodeType == XML_ELEMENT_NODE) {
    			$this->setTags($childNode);
    		}
		}
	}
	protected function setTags(&$node) {
		switch (strtolower($node->nodeName)) {
			default: 
				throw "***error** class: "
						+ get_class($this)
						+ " unknown tag: $node->nodeName"
    	}
	}
	protected function setAttributes(&$attr) {
       	switch (strtolower($attr->name)) {
       		case "help":
				this->help=$attr->value;
				break;
       		case spacepad:
       			switch ($attr->value) {
       				case 'true':
       					$this->spacePad = true;
       					break;
       				case 'false':
       					$this->spacePad = false;
       					break;
       				default: throw new Exception(" attribute spacepad invalid.  Expect true or false found: ".$attr->value);
       			}
				break;
			default:
				throw new Exception("***error** class: ".get_class($this)." unknown attribute:".$attr->name); 
		}
	}
}