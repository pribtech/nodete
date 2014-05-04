<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2009 All rights reserved.
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

/**
 * This file contains the drivers for command input generation
 *
**/
global $errors;
$errors=false;

abstract class CommandClassesAbstract {
	public $help;
	public $spacePad=true;
	public function __construct(&$node) {
		if (isset($node) ) {
			$this->loadXMLNode($node);
		}
		if (memory_get_usage()>100000000) {
			throw new Exception('possible loop using loads of memory, object: "'.var_export($this,true));
		}
	}
	protected function setLevelUp($id) {
		global $commandLevel;
		global $commandLevelIndex;
		$commandLevel[++$commandLevelIndex]=$id.'_';
	}
	protected function setLevelDown() {
		global $commandLevel;
		global $commandLevelIndex;
		unset($commandLevel[$commandLevelIndex--]);
	}
	protected function getLevel() {
		global $commandLevel;
		global $commandLevelIndex;
		return $commandLevel[$commandLevelIndex];
	}
	protected function getNewId() {
		global $commandIdCntr;
		$commandIdCntr=$commandIdCntr+1;
		return $commandIdCntr;
	}
	protected function getHtmlId() {
		return $this->getLevel().$this->uniqueId;
	}
	function getValue($id) {
		$value=getParameter($this->getLevel().$id);
		if ($value!=null) return $value;
		global $errors;
		$errors=true;
		return '*** id:"'.$this->getLevel().$id.'" not set ***';
	}	
	public function getHtml()	{
		$this->stmt=$this->getHtmlPre();;
		if (isset($this->clauses)) {
			foreach($this->clauses as $value) {
				if ( get_class($value)== "") {
					if (isset($this->help)) {
						$this->stmt .=  '<a class="help" '.$this->hoverHelp().'>'.($this->spacePad?' ':'').$value.'</a>';	
					} else {
						$this->stmt .=  $value.($this->spacePad?' ':'');	
					}
				} else {
					$this->stmt .= $value->getHtml();
				}
			}
		}
		return $this->stmt.$this->getHtmlPost();
	}
	public function getStmt()	{
		if (!isset($this->clauses)) {return "";}
		if (!isset($this->clauses[0])) {return "";}
		$stmt="";
		foreach($this->clauses as $value) {
			if ( get_class($value)== "") {
				$stmt .=  $value.($this->spacePad?' ':'');
			} else {
				$stmt .= $value->getStmt();
			}
		}
		return $stmt;
	}
	protected function getHtmlPre() {return "";}
	protected function getHtmlPost() {return "";}
	protected function setClause ($value) {
		$this->clauses[] = $value;
	} 
	protected function loadXMLNode(&$node) {
		if ($node== null) {return;}
		if($node->hasAttributes()) {
    	   	$attributes = $node->attributes;
        	if(!is_null($attributes)) {
            	foreach ($attributes as $index=>$attr) {
					$this->setAttributes($attr);
				}
			}
		}
		if (!$node->hasChildNodes()) {return;}
		foreach($node->childNodes as $childNode) {
    		if($childNode->nodeType == XML_ELEMENT_NODE) {
    			$this->setTags($childNode);
    		}
		}
	}
	protected function setTags(&$node) {
		switch (strtolower($node->nodeName)) {
			default: 
				$message = "***error** class: ";
				$message .= get_class($this);
				$message .= " unknown tag: $node->nodeName";
				throw new Exception($message); 
				break;
    	}
	}
	protected function setAttributes(&$attr) {
       	switch (strtolower($attr->name)) {
       		case "help":
				$this->help=$attr->value;
				break;
       		case "spacepad":
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
	function hoverHelp () { 
		if (!isset($this->help)) {return;}
		if (!isset($_SESSION['CommandHelp'][$this->help])) {throw new Exception('Help '.$this->help.' not found for tag '.get_class($this));}
		$id=$_SESSION['CommandHelp'][$this->help];
		return 	' onmouseout="hideElements(\''.$id.'\')" '
				.' onmouseover="showCommandHelp(event,\''.$id.'\')" ';
	}
}

class Command extends CommandClassesAbstract {
	protected $clauses=array();
	protected $name;
	protected $title;
	public function __construct() {
		global $commandIdCntr;
		$commandIdCntr=0;
	}
	public function getName() {
		return $this->name; 
	} 
	protected function getHtmlPre() {
		global $commandLevelIndex;
		$commandLevelIndex=0;
		global $commandLevel;
		$commandLevel=array();
		$this->setLevelUp('cid'); 
		return '<style type="text/css">'
				.'a.help {background: transparent;white-space:nowrap;} '
				.'a.input {position:relative; z-index: 1; background: transparent;white-space:nowrap;}'
				.'a.note {white-space:nowrap; display:inline-block; background-color: lightblue; font-style:italic; font-size:xx-small; color:blue }'
				.'body {white-space:nowrap;} '
				.'button.cmd {white-space:nowrap;} '
				.'div.cmdDynRef {white-space:nowrap; display:inline} '
				.'div.cmdRefs {white-space:nowrap; display:inline} '
				.'div.help {z-index: 11;height: 200px width: 200px;display: none; border : groove ; background-color: #FFFFFF; position : absolute; top : 0; left : 0;} '
				.'div.cmd {white-space:nowrap; display:inline-block; float: inline;vertical-align:text-top}'
				.'div.cmdSelect {white-space:nowrap; display:inline-block;vertical-align:text-top}'
				.'img.cmdRepeatable {white-space:nowrap; display:inline}'
				.'img.cmdSelect {white-space:nowrap; display:inline; float:inline;}'
				.'input.text {position:relative; z-index: 2;  filter:alpha(opacity=80);  opacity:0.8;}'
				.'table.command {float:inline-table; display:inline-block; table-layout:auto; padding:1px; margin:1px; vertical-align:text-top}'
				.'table.cmdDynRef {white-space:nowrap;float:inline-table;display:inline-block;table-layout:auto; padding:1px; margin:1px; vertical-align:text-top}'
				.'table.cmdRefs {display:none;table-layout:auto} '
				.'table.cmdRepeatable {float:inline-table; display:inline-block; table-layout:auto; vertical-align:text-top}'
				.'table.cmdSelectList {white-space:nowrap; float:inline; display:inline; table-layout:auto; padding:1px; margin:1px; vertical-align:text-top}'
				.'textarea.text {white-space:nowrap; float:inline; display:inline; position:relative; z-index: 2;  filter:alpha(opacity=80);  opacity:0.8; vertical-align:text-top;}'
				.'td.cmd {white-space:nowrap; display:inline-block; float: inline; vertical-align:text-top;}'
				.'tr.cmdOption {display:block; border-style:groove; border-color: gray; border-width:1px; padding:1px; margin:0px; white-space:nowrap ;}'
				.'tr.cmdRepeatable {display:block; border-style:groove; border-color: blue; border-width:1px; padding:1px; margin:0px;}'
				.'</style><div class="cmd"><table id="commandForm" class="command"><tr><td class="cmd">';
	}
	protected function getHtmlPost() {
		$references='</td></tr></table></div><table class="cmdRefs">';
		$processed=array();
		$this->setLevelUp('rid'); 
		if(isset($_SESSION['CommandClause'])) {
			while (count($processed)<> count($_SESSION['CommandClause'])) {
				foreach($_SESSION['CommandClause'] as $key=>$clause) {
					if (!isset($processed[$key])) {
						$processed[$key]=true;
						$command = unserialize($clause);
						if ($command->isDynamicallyIncluded()) {
							$references .= '<tr id="'.$key.'"><td>'.$command->getHtmlExpand().'</td></tr>';
						}
						unset($command);
					}
				}		
			}
		}
		return $references.'</table>';
	}
	public function getStmt() {
		global $commandLevelIndex;
		$commandLevelIndex=0;
		global $commandLevel;
		$commandLevel=array();
		$this->setLevelUp('cid'); 
		$stmt = parent::getStmt();
		global $errors;
		if ($errors) return $stmt."\r\r*** dump ***\r\r".'get='.var_export($_GET,true)."\r".'*** post='.var_export($_POST,true).'***';
		return preg_replace('/'.PHP_EOL.'\s+'.PHP_EOL.'/', PHP_EOL,$stmt);
	}
	public function loadXML( &$xml ) {
		if($xml == "") 	{return;}
		try {
			$doc = new DOMDocument();
			if($doc->loadXML($xml)) {
				foreach($doc->childNodes as $node) {
					$this->loadXMLNode($node);
   				}
			} else 	{
				throw new Exception("load failed.");
			}
		}
		catch (Exception $e){
			$message = "Command definition failed due to an XML syntax error. {$e->getmessage()}";
			throw new Exception($message);
		}
		if (!isset($this->name)) {
			throw new Exception("xml load failed, command missing name attribute.");
		}
	}
	protected function setTags(&$node) {
		switch (strtolower($node->nodeName)) {
			case "command":
				$commandClause = new CommandClause($node);
				$this->clauses[] = $commandClause;
				break;
			default:
				CommandClause::setTags($node); 
				break;
    	}
	}
	protected function setAttributes(&$attr) {
		switch (strtolower($attr->name)) {
			case "name":
				$this->name = $attr->value;
				break;
			case "title":
				$this->title = $attr->value;
				break;
			default:
				parent::setAttributes($attr);
				break;
        } 
	}
}
class CommandNewLine extends CommandClassesAbstract  {
	private $statement=true;
	private $html=true;
	public function getHtml(){return ($this->html?"<br/>":"");}
	public function getStmt(){return ($this->statement?PHP_EOL:"");}
	protected function setAttributes(&$attr) {
		switch (strtolower($attr->name)) {
			case "statement":
				if ($attr->value=='true') {
					$this->statement = true;
				} else if ($attr->value=='false') {
					$this->statement = false;
				} else {
					throw new Exception("br tag attribute statement invalid, expected true or false found: ".$attr->value);
				}
				break;
			case "html":
				if ($attr->value=='true') {
					$this->html = true;
				} else if ($attr->value=='false') {
					$this->html = false;
				} else {
					throw new Exception("br tag attribute  html invalid, expected true or false found: ".$attr->value);
				}
				break;
			default:
				throw new Exception("***error** class: ".get_class($this)." unknown attribute:".$attr->name); 
        } 
	}
}
class CommandNote {
	private $value;
	public function __construct(&$node) {
		if (isset($node) ) {
			$this->value = utf8_decode($node->nodeValue);
		}
	}
	public function getHtml(){return '<a class="note">'.$this->value.'</a>';}
	public function getStmt(){return;}
}
class CommandText extends CommandClassesAbstract {
	private $value;
	public function __construct(&$node) {
		if (isset($node) ) {
			$this->value = utf8_decode($node->nodeValue);
			if($node->hasAttributes()) {
    		   	$attributes = $node->attributes;
        		if(!is_null($attributes)) {
            		foreach ($attributes as $index=>$attr) {
						$this->setAttributes($attr);
					}
				}
			}
		}
	}
	public function getHtml()	{
		if (isset($this->help))
			return '<a class="help" '.$this->hoverHelp().'>'.($this->spacePad?' ':'').$this->value.'</a>';	
		return $this->value.($this->spacePad?' ':'');	
	}
	public function getStmt()	{
		return $this->value.($this->spacePad?' ':'');
	}
}
class CommandClause extends CommandClassesAbstract {
	protected $clauses = array();
	protected $name;
	public $title;
	protected $dynamicallyIncluded=false;
	public function __construct(&$node) {
		if (isset($node) ) {
			$this->loadXMLNode($node);
		}
		if (isset($this->name)) {
			if (!isset($_SESSION['CommandClause'])) {$_SESSION['CommandClause']=array();}
			if (isset($_SESSION['CommandClause'][$this->name])) {
				$existing=unserialize($_SESSION['CommandClause'][$this->name]);
				if (isset($existing->name)) {throw new Exception('clause "'.$this->name.' "defined twice');}
			}
			if (isset($this->title)) {$this->dynamicallyIncluded=true;}
			$_SESSION['CommandClause'][$this->name]= serialize($this);
		}
	}
	public function getHtml()	{
		if (isset($this->name)) {return "";}
		return parent::getHtml();
	}
	public function getHtmlExpand()	{return parent::getHtml();}
	public function getStmt()	{return;}
	protected function getHtmlPre() {return '<div class="cmd">';}
	protected function getHtmlPost() {return '</div>';}
	public function getStmtExpand()	{return parent::getStmt();}
	public function isDynamicallyIncluded() {return $this->dynamicallyIncluded;}
	public function setDynamicallyIncluded() {
		$this->dynamicallyIncluded=true;
		$_SESSION['CommandClause'][$this->name]= serialize($this);
	}
	protected function setTags(&$node) {
		switch (strtolower($node->nodeName)) {
			case "text":
				$clause = new CommandText($node);
				$this->setClause($clause);
				break;
			case "note":
				$clause = new CommandNote($node);
				$this->setClause($clause);
				break;
			case "br":
				$clause = new CommandNewLine($node);
				$this->setClause($clause);
				break;
			case "clause":
				$clause = new CommandClause($node);
				$this->setClause($clause);
				break;
			case "clausereference":
				$clause = new CommandClauseReference($node);
				$this->setClause($clause);
				break;
			case "help":
				$clause = new CommandHelp($node);
				$this->setClause($clause);
				break;
			case "input":
				$clause = new CommandInput($node);
				$this->setClause($clause);
				break;
			case "repeatable":
				$clause = new CommandRepeatable($node);
				$this->setClause($clause);
				break;
			case "select":
				$clause = new CommandSelect($node);
				$this->setClause($clause);
				break;
			default: 
				parent::setTags($node);
				break;
 		}
	}
	protected function setAttributes(&$attr) {
    	switch (strtolower($attr->name)) {
			case "name":
				$this->name = $attr->value;
				break;
			case "title":
				$this->title = $attr->value;
				break;
			default:
				parent::setAttributes($attr);
				break;
		}
	}
}
class CommandInput extends CommandClassesAbstract{
    private $addSlashes;
    private $maxWidth=80;
    private $maxDepth=20;
    private $name;
    private $size=4;
    private $title;
    private $type;
    protected $uniqueId;
    private $value;
    private $valueDefault="";
	private $wrap='soft';
    public function __construct(&$node) {
		$this->uniqueId = $this->getNewId();
		parent::__construct($node);
	}
	private function width() {return $this->size*8;}
	public function getHtml () {
		$value=getParameter($this->name);
		$value=($value != null?htmlspecialchars($value, ENT_QUOTES):(isset($this->valueDefault)?$this->valueDefault:''));
		if ($this->type=='list') {
			return '<select name="'.$this->getHtmlId().'"'.$this->hoverHelp().'>'
					.'<option>'.implode('</option><option>',$this->value).'</option>'
					.'</select>';
		}
		if ($this->size > $this->maxWidth) {
			$depth=$this->size/$this->maxWidth;
			if ($depth<=2) {
				$depth=2;
				$width=($this->size+1)/2;
			} else {
				$width=$this->maxWidth;
				if (isset($value)) $depth = (strlen($value)+$width)/$width;
				if ($depth>$this->maxDepth)$depth=$this->maxDepth;
				if ($depth<2)$depth=2;
			}
			return '<textarea class="text" name="'.$this->getHtmlId().'"'
					.(isset($this->type)
						?'onchange="checkValue(this,\''.$this->type.'\')"'
						:'')
					.' cols="'.$width.'"'
					.' rows="'.$depth.'"'
					.' wrap="'.$this->wrap.'"'
					.$this->hoverHelp()
					.'/>'
					.$value
					.'</textarea>'
					.(isset($this->title)?'<a class="input" style="left: -'.$this->width().'px">'.$this->title.'</a>':'');
		}
		return '<input class="text" type="text" name="'.$this->getHtmlId().'"'
					.($value != null?' value="'.$value.'"':'')
					.(isset($this->type)
						?'onchange="checkValue(this,\''.$this->type.'\')"'
						:'')
					.' maxlength="'.$this->size.'"'
					.' style="width:'.$this->width().'px"'
					.$this->hoverHelp()
					.'/>'
					.(isset($this->title)?'<a class="input" style="left: -'.$this->width().'px">'.$this->title.'</a>':'');
	} 
	public function getStmt () {
		return (isset($this->addSlashes)?addcslashes($this->getValue($this->uniqueId),$this->addSlashes):$this->getValue($this->uniqueId))
				.($this->spacePad?' ':'');
	} 
	protected function setAttributes(&$attr) {
    	switch (strtolower($attr->name)) {
			case "addslashes":
				$this->addSlashes = $attr->value;
				break;
			case "maxwidth":
				$this->maxWidth = $attr->value;
				break;
			case "maxdepth":
				$this->maxDepth = $attr->value;
				break;
			case "name":
				$this->name = $attr->value;
				break;
			case "size":
				$this->size = $attr->value;
				break;
			case "title":
				$this->title = $attr->value;
				break;
			case "type":
				switch ($attr->value) {
					case "text":
					case "int":
					case "float":
					case "date":
						break;
					case "list":
						$this->value=array();
						break;
					default:
						throw new Exception('input type="'.$attr->value.'" is unknown');					
				}
				$this->type = $attr->value;
				break;
			case "valuedefault":
				$this->valueDefault = $attr->value;
				break;
			case "wrap":
				$this->wrap = $attr->value;
				break;
			default:
				parent::setAttributes($attr);
				break;
		}
	}
	protected function setTags(&$node) {
		switch (strtolower($node->nodeName))
		{
			case "option":
				if($this->type!="list") 
					throw new Exception('input type="'.$attr->value.'" required for option tag');					
				if (isset($node) ) {
					$this->value[] = utf8_decode($node->nodeValue);
				}
				break;
			default: 
				parent::setTags($node);
				break;
 		}   				
	}
	
}
class CommandSelect extends CommandClassesAbstract{
	protected $clauses=array();
	protected $hidden=false;
	protected $uniqueId;
	protected $title;
    public function __construct(&$node) {
		$this->uniqueId = $this->getNewId();
		parent::__construct($node);
	}
	public function isHidden() {return $this->hidden;}
	public function getHideIds() {
		if (!isset($this->clauses)) {return "";}
		if (!isset($this->clauses[0])) {return "";}
		$hideIds="";
		foreach($this->clauses as $hideValue) {
			if ( get_class($hideValue)== 'CommandOption') {
				$hide =  $hideValue->getHideIds();
				if($hide!="") {
					$hideIds .=  ",".$hideValue->getHideIds();
				}
			} 
		}
		return $hideIds==""?"":substr($hideIds,1);
	}
	public function getId() {return $this->uniqueId;}
	protected function getHtmlPre() {
		return	'<div class="cmdSelect">'
					.'<img class="cmdSelect" src="images/icon-down-on.gif" onclick="commandSwapDisplay(this)"/>'
					.'<table id="'.$this->getHtmlId().'" class="cmdSelectList">';
	}
	protected function getHtmlPost() {
		return 	'</table>'
				.(isset($this->help)?'<img class="cmdSelect" src="images/icon-information-blue.gif" '.$this->hoverHelp().'/>':'')
			.'</div>';
	}
	public function getStmt()	{
		$selection = getParameter($this->getHtmlId());
		foreach($this->clauses as $option) {
			 if ($selection== $option->getHtmlId() ) {return $option->getStmt();}
		}
		// look for default
		foreach($this->clauses as $option) {
			 if ($option->selected) {return $option->getStmt();}
		}
		global $errors;
		$errors=true;
		if (isset($this->title)) return ' *** missing selection for '.$this->title.' *** ';
		return '*** no option found for select "'.$this->getHtmlId().'" option selected "'.$selection.'" ***';
	}
	protected function setTags(&$node) {
		switch (strtolower($node->nodeName))
		{
			case "option":
				$clause = new CommandOption($node);
				$clause->setParent($this);
				$this->setClause($clause);
				break;
			default: 
				parent::setTags($node);
				break;
 		}   				
	}
	protected function setAttributes(&$attr) {
    	switch (strtolower($attr->name)) {
			case "title":
				$this->title=$attr->value;
				break;
/*			case "hidden":
				if ($attr->value='true') {
					$this->hidden = true;
				} else {
					throw new Exception(" option hidden invalid.");
				}
				break;
*/			default:
				parent::setAttributes($attr);
				break;
		}
	}
}
class CommandOption extends CommandClassesAbstract{
	protected $clauses;
	protected $parentInstance;
	public $selected;
	protected $title;
	protected $value;
	protected $uniqueId;
    public function __construct(&$node) {
		$this->uniqueId = $this->getNewId();
		parent::__construct($node);
	}
	public function setParent($parentInstance) {$this->parentInstance = $parentInstance;}
	protected function getHtmlPre() {
		return '<tr class="cmdOption">'
					.'<td><input type="radio" value="'.$this->getHtmlId().'"'
						.' name="'.$this->parentInstance->getHtmlId().'"'
							.($this->selected?' checked="checked"':'')
							.$this->hoverHelp()
							.' onclick="commandSelectSwap(this);"'
							.'/>'
					.'</td>'
					.'<td>'
					;
	}
	protected function getHtmlPost() {
		return '</td></tr>';
	}
	public function getHideIds() {
		if (!isset($this->clauses)) {return "";}
		if (!isset($this->clauses[0])) {return "";}
		$hideIds="";
		foreach($this->clauses as $hideValue) {
			if ( get_class($hideValue)== 'CommandSelect') {
				if($hideValue->isHidden()) {
					$hideIds .=  ",'".$hideValue->getId()."'";
				}
			} 
		}
		return $hideIds==""?"":substr($hideIds,1);
	}
	protected function setAttributes(&$attr) {
    	switch (strtolower($attr->name)) {
			case "default":
				if ($this->value='true') {
					$this->selected = true;
				} else {
					throw new Exception(" option default invalid.");
				}
				break;
			case "name":
				$this->title = $attr->value;
				break;
			case "value":
				$this->value = $attr->value;
				break;
			default:
				parent::setAttributes($attr);
				break;
		}
	}
	protected function setTags(&$node) {
		CommandClause::setTags($node);
	}
}
class CommandClauseReference extends CommandClassesAbstract{
	private $loopDetection=0;
	protected $name;
	protected $title;
	protected $uniqueId;
	public function __construct(&$node) {
		$this->uniqueId = $this->getNewId();
		parent::__construct($node);
	}
	public function getHtml () {
		if (!isset($_SESSION['CommandClause'][$this->name])) {
			if(file_exists("./commands/".$this->name.".xml")) {
				$commandToProcess="./commands/".$this->name.".xml";
			} else if(file_exists($this->name.".xml")) {
				$commandToProcess .= ".xml";
			} else if(!file_exists($this->name)) {
				throw new Exception('Clause reference name: '. $this->name.' not found in command tag or as file');
			}
			
			$doc = new DOMDocument();
			if($doc->loadXML(file_get_contents($commandToProcess))) {
				foreach($doc->childNodes as $node) {
					$clause = new CommandClause($node);
					$clause->setDynamicallyIncluded();
   				}
			} else 	{
				throw new Exception('load failed for clause reference name: '. $this->name);
			}
		}
		$clause = unserialize($_SESSION['CommandClause'][$this->name]);
		if (isset($this->title)) {
			if (!$clause->isDynamicallyIncluded()) {
				$clause->setDynamicallyIncluded();
			}
		}
		if (isset($clause->title)) {
			if ($clause->isDynamicallyIncluded()) {
				return '<div class="cmdDynRef" id="'.$this->getHtmlId().'" ><input type="hidden" value="" name="'.$this->getHtmlId().'" />'
					.'<button class="cmd" type="button" onClick="commandGetReference(this,\''.$this->name.'\');">'.(isset($this->title)?$this->title:$clause->title).'</button></div>';
			}
		}
		if (memory_get_usage()>100000000) { return '<div>*** a loop ****'.$this->name.'</div>';
			new Exception('possible loop using loads of memory, object: '.$this->name);
		}
		if($this->loopDetection>0) throw new Exception('clause reference "'.$this->name.' " in infinite loop');
		$this->loopDetection=$this->loopDetection+1;
		$this->setLevelUp($this->getHtmlId());
		$stmt=$clause->getHtmlExpand();
		$this->setLevelDown();
		return $stmt;
	}
	public function getStmtExpand() {return $this->getStmt();}
	public function getStmt () {
		$command = unserialize($_SESSION['CommandClause'][$this->name]);
		if (isset($command->title)) {
			if ($this->getValue($this->uniqueId)==$this->getHtmlId()) {
				$this->setLevelUp($this->getHtmlId().'_rid');
				$stmt=$command->getStmtExpand();
				$this->setLevelDown();
				return $stmt;
			}
			global $errors;
			$errors=true;
			return ' *** command reference: "'.$command->title.'" expecting "'.$this->getHtmlId().'" found "'.$this->getValue($this->uniqueId).'" *** ';
		}
		$this->setLevelUp($this->getHtmlId());
		$stmt=$command->getStmtExpand();
		$this->setLevelDown();
		return $stmt;
	}  
	protected function setAttributes(&$attr) {
    	switch (strtolower($attr->name)) {
			case "name":
				$this->name = $attr->value;
				break;
			case "title":
				$this->title = $attr->value;
				break;
			default:
				parent::setAttributes($attr);
				break;
		}
	}
}
class CommandHelp extends CommandClassesAbstract{
	protected $name;
	protected $value;
	protected $uniqueId;
	public function __construct(&$node) {
		$this->uniqueId = $this->getNewId();
		if (isset($node) ) {
			$this->value=$node->nodeValue;
			$this->loadXMLNode($node);
		}
		if (!isset($this->name)) {throw new Exception('help has no name attribute : '.$this->value);}
		$_SESSION['CommandHelp'][$this->name]= "cid_".$this->uniqueId;
	}
	protected function setAttributes(&$attr) {
    	switch (strtolower($attr->name)) {
			case "name":
				$this->name = $attr->value;
				break;
			default:
				parent::setAttributes($attr);
				break;
		}
	}
	public function getHtml () {
		return '<div class="help" id="cid_'.$this->uniqueId.'" >'.$this->value.'</div>';
	}
	public function getStmt () {}  
}
class CommandRepeatable extends CommandClassesAbstract{
	protected $clauses;
	protected $separator= ' , ';
	protected $uniqueId;
	public function __construct(&$node) {
		$this->uniqueId = $this->getNewId();
		if (isset($node) ) {
			$this->loadXMLNode($node);
		}
	}
	protected function setAttributes(&$attr) {
    	switch (strtolower($attr->name)) {
    		case 'separator':
    			$this->separator = $attr->value;
    			break;
			default:
				parent::setAttributes($attr);
				break;
		}
	}
	protected function setTags(&$node) {
		switch (strtolower($node->nodeName)) {
			default:
				CommandClause::setTags($node); 
				break;
    	}
	}
	protected function getHtmlPre() {
		$stmt='<table class="cmdRepeatable" id="'.$this->getHtmlId().'">'
					.'<tr id="'.$this->getHtmlId().'#0" style="display:none"><input type="hidden" value="1" id="'.$this->getHtmlId().'#0" name="'.$this->getHtmlId().'#0"/></tr>'
					.'<tr id="'.$this->getHtmlId().'#1" class="cmdRepeatable"><td>';
		$this->setLevelUp($this->getHtmlId().'#1');
		return $stmt;
	}
	protected function getHtmlPost() {
		$this->setLevelDown();
		return '</td><td vAlign="top"><img class="cmdRepeatable" src="images/icon-link-add-dark.gif" onClick="commandRepeatClause(this)"/>'
				.'</td></tr></table>';
	}
	public function getStmt () {
		$arraySize=$this->getValue($this->uniqueId.'#0');
		$stmt='';
		for ( $index = 1; $index <= $arraySize; $index++ ) {
			$this->setLevelUp($this->getHtmlId().'#'.$index);
			if ($index>1) {if(isset($this->separator)) {$stmt.=$this->separator;}}
			$stmt.=parent::getStmt();
			$this->setLevelDown();
		}
		return $stmt;
	}  
}

?>
