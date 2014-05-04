/*******************************************************************************
 * Author: Matthew Vandenbussche
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
function EditRowDataForm_toggleFieldsOnInput(object, elementID, index, original, originalNull,dataType) {
	var update = $(elementID + "_Option_COLUMN_" + index);
	var image = $(elementID + "_Img_COLUMN_" + index);
	if(object == null || update == null || image == null) return;
	try {
		switch (dataType) {
			case 'int':
			case 'integer':
			case 'long':
				if(isNaN(object.value)) throw object.value+" is an invalid number";
				break;
			case 'float':
			case 'real':
				if(isNaN(object.value)) throw object.value+" is an invalid number";
				break;
			default:
		}
	} catch (e) {
		object.setStyle({background:"red"});
		alert(e);
		object.value=original;
	}
	if(originalNull && object.value==null
	||	object.value == original) {
		object.setStyle({background:""});
		update.checked= "false";
		image.hide();
		return;
	}

	object.setStyle({background:"#77FF77"});
	update.checked= "true";
	image.show();

}

function EditRowDataForm_toggleFieldsOnNull(object, elementID, index, original, originalNull, editRow) {
	var field = $(elementID + "_COLUMN_" + index);
	var update = $(elementID + "_Option_COLUMN_" + index);
	var image = $(elementID + "_Img_COLUMN_" + index);
	if(field == null || update == null || image == null || object == null) return;
	if (object.checked == true)  {
		field.disable();
		object.value = "true";
		field.setStyle({background:""});
		if (originalNull == true && editRow == true) {
			update.checked = false;
			image.hide();
		} else {
			update.checked = true;
			image.show();
		}
	} else {
		field.enable();
		object.value = "";
		EditRowDataForm_toggleFieldsOnInput(field, elementID, index, original, originalNull);	
	}
}

function EditRowDataForm_toggleFieldsOnUpdate(object, elementID, index) {
	var field = $(elementID + "_COLUMN_" + index);
	var image = $(elementID + "_Img_COLUMN_" + index);
	if(field == null || object == null || image == null) return;
	if (object.checked == true) {
		field.setStyle({background:"#77FF77"});
		image.show();
		object.value = "true";
	} else  {
		object.value = "";
		field.setStyle({background:""});
		image.hide();
	}
}

function FixPrefiledValue(object) {
	if(object.value.length < 2) return;
	if(object.value.substring(0,1) != "'") return;
	var oldValue = object.value;
	object.value = oldValue.substring(1,oldValue.length-1);
}

CORE_CLIENT_ACTIONS.set("EditRowDataForm",Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		$super(callParameters.uniqueID + "_EditForm", "EditRowDataForm");
			
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		this.callParameters = callParameters;
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		
		this.callingTableID = this.callParameters['#Calling_Table_ID'];
		if(parentPanel != null)
			parentPanel.registerNestedObject(this.elementUniqueID, this);
				
		this.draw();
	},
	
	draw: function() {
		var menu = [];
		var thisObject = this;
		var output = "";
		var original = "";
		var originalNull = false;		
		var showUpdateCheckbox = (this.callParameters['Title'] == "Create Like" || this.callParameters['Title'] == "Insert Row");
		var editRow = (this.callParameters['Title'] == "Edit Row Data");
		var components = [];
		
		output += '<script type="text/javascript"> function toggleTextField(textField) { textField.disabled = !textField.disabled } </script>'
				+ '<div class="groupTableTitle">' + this.callParameters['TableName'] + ' </div>'
				+ '<span class="groupTableContent"><table width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td style="vertical-align: bottom;">'
				+ "<table width=100% cellpadding='3px' style='position:static;padding-top:5px;'>"
				+ "<tbody>";
		
		
		if (this.callParameters['Title'] == "Delete Row") {
			output += '<tr><td align="left"><b> Permanently delete the row with the following data? </b></td></tr>';
			for(var i = 0; i < this.callParameters['ColumnInfo'].name.length; i++)
				output += '<tr><td align="left"><b>' + this.callParameters['ColumnInfo'].name[i] + ' :</b> ' + this.callParameters['RowData'][i] + '</td></tr>';
		} else {
			// Create column titles for form
			output += '<tr><td align="left"><b>Column</b></td><td align="left"><b>Null</b></td><td align="left"><b>Value</b></td><td align="left"><b>Type</b></td>';
					+ '<td align="left"><b>Update</b></td><td align="left"><b></b></td></tr>';
			
			for(var i = 0; i < this.callParameters['ColumnInfo'].name.length; i++) {
				originalNull = (this.callParameters['RowData'][i] == null);
				original = (!originalNull) ? this.callParameters['RowData'][i] : "";
				components = this.callParameters['Components']["column"][this.callParameters['ColumnInfo'].name[i]];
				var inputOnFocus="";
				switch (this.callParameters['ColumnInfo'].type[i]) {
					case 'float':
					case 'real':
						var size=' size="20" maxlength="20" ';
						break;
					case 'date':
						inputOnFocus = ' onfocus="'+this.callBackText+'.editColumn(this,\''+this.callParameters['ColumnInfo'].type[i]+'\',\''+this.callParameters['ColumnInfo'].name[i]+'\');"';
						var size=' size="10" maxlength="10" ';
						break;
					case 'time':
						inputOnFocus = ' onfocus="'+this.callBackText+'.editColumn(this,\''+this.callParameters['ColumnInfo'].type[i]+'\',\''+this.callParameters['ColumnInfo'].name[i]+'\');"';
						var size=' size="21" maxlength="21" ';
						break;
					case 'timestamp':
						inputOnFocus = ' onfocus="'+this.callBackText+'.editColumn(this,\''+this.callParameters['ColumnInfo'].type[i]+'\',\''+this.callParameters['ColumnInfo'].name[i]+'\');"';
						var size=' size="32" maxlength="32" ';
						break;
					default:
						var size=' size="'+this.callParameters['ColumnInfo'].precision[i]
						 	+'" maxlength="'+this.callParameters['ColumnInfo'].precision[i]+'" ';
				}
				if(components.chartNodal!=null) 
						inputOnFocus = ' onfocus="'+this.callBackText+'.editColumn(this,\'xml\',\''+this.callParameters['ColumnInfo'].name[i]+'\');"';
				output += '<tr>'
						+ '<td align="left"><b>' + this.callParameters['ColumnInfo'].name[i] + '</b></td>'
						+ '<td>'+(components.nullable?'<input id="' + this.elementUniqueID + '_Null_COLUMN_' + i + '" name="' + 'Null_COLUMN_' + i + '" type="checkbox" value="true" '
						                              + ' onClick="EditRowDataForm_toggleFieldsOnNull(this, \''+this.elementUniqueID + '\' , ' + i + ', \''+original + '\', ' + originalNull + ', ' + editRow + ');" /></td>'
						                              : '' )
						+ '<td >';
				if(components.isPrefiled)
					output += '<table id="' + this.elementUniqueID + '_COLUMN_' + i + '" cellpadding="0px" cellspacing="0px">'
							+ 	'<tbody><tr><td style="width:100%;">'
							+ 		'<input'+size+inputOnFocus+' type="text" id="' + this.elementUniqueID + '_COLUMN_' + i + '_textInput' + '" style="background:;"  value="" name="' + 'COLUMN_' + i + '"'
									+ ' onChange="EditRowDataForm_toggleFieldsOnInput(this, \''+this.elementUniqueID + '\' , ' + i + ', \''+original + '\', ' + originalNull + ', \''+this.callParameters['ColumnInfo'].type[i]+'\');FixPrefiledValue(this);" />'
							+ 		'</td><td id="' + this.elementUniqueID + '_COLUMN_' + i + '_buttonHolder" style="width:0%;">'
							+ '</td></tr></tbody></table>';
				else if( this.callParameters['ColumnInfo'].precision[i] < 129 ) 
					output += '<input'+size+inputOnFocus+' type="text" id="' + this.elementUniqueID + '_COLUMN_' + i + '" style="background:;"  value="" name="' + 'COLUMN_' + i + '"'
								+	(components.xmlSchema?'':'')
								+ 	' onChange="EditRowDataForm_toggleFieldsOnInput(this, \''+this.elementUniqueID + '\' , ' + i + ', \''+original + '\', ' + originalNull + ', \''+this.callParameters['ColumnInfo'].type[i]+'\');" />';
				else 
					output += '<textarea '+inputOnFocus+'rows="1" cols="128" id="' + this.elementUniqueID + '_COLUMN_' + i + '" style="background:;"  value="" name="' + 'COLUMN_' + i + '"'
								+ ' onChange="EditRowDataForm_toggleFieldsOnInput(this, \''+this.elementUniqueID + '\' , ' + i + ', \''+original + '\', ' + originalNull + ', \''+this.callParameters['ColumnInfo'].type[i]+'\')" ></textarea>';
				output += '</td>'
						+ '<td align="left"><b>(' + this.callParameters['ColumnInfo'].type[i] + ')</b></td>';
				//Show update check box (default checked) OR show image check 
				if (showUpdateCheckbox && components.nullable )
					output += '<td><input id="' + this.elementUniqueID + '_Option_COLUMN_' + i + '" name="' + 'Option_COLUMN_' + i + '" type="checkbox" value="true" checked'
							+ ' onClick="EditRowDataForm_toggleFieldsOnUpdate(this, \''+this.elementUniqueID + '\' , ' + i + ');"/></td>'
							+ '<td><img id="' + this.elementUniqueID + '_Img_COLUMN_' + i + '" style="display:none;" src="./images/typevalue_ok.gif" alt="marked for update" style="visibility:hidden" /></td>';
				else 
					output += '<td><img id="' + this.elementUniqueID + '_Img_COLUMN_' + i + '" style="display:none;" src="./images/typevalue_ok.gif" alt="marked for update" /></td>'
							+ '<td><input id="' + this.elementUniqueID + '_Option_COLUMN_' + i + '" name="' + 'Option_COLUMN_' + i + '" type="checkbox" value="true" '
							+ ' style="visibility:hidden" /></td>';
				output += '</tr>';
			}	
		}
		output += "</tbody>"
				+ "</table>"		
				+ '</td></tr></tbody></table></span>';
		
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		if(parentPanel != null)
			parentPanel.setContent(output, this.callParameters['Title'], "");
		
		for(var i = 0; i < this.callParameters['ColumnInfo'].name.length; i++) {
			components = this.callParameters['Components']["column"][this.callParameters['ColumnInfo'].name[i]];
			if(components.isPrefiled)
				TABLE_MANIPULATION_MODULES.get("Integrated_PrefillSelection").requestPrefill(this.callingTableID, this.callParameters['ColumnInfo'].name[i], this.elementUniqueID + '_COLUMN_' + i);
		}
		if (this.callParameters['Title'] == "Edit Row Data" || this.callParameters['Title'] == "Create Like" ) {
			for(var i = 0; i < this.callParameters['ColumnInfo'].name.length; i++) {
				components = this.callParameters['Components']["column"][this.callParameters['ColumnInfo'].name[i]];
				if (this.callParameters['RowData'][i] != null) {
					if (components.editable || this.callParameters['Title'] == "Create Like" ) {
						if(components.isPrefiled == null) 
							$(this.elementUniqueID + "_COLUMN_" + i).value = this.callParameters['RowData'][i];
						else 
							$(this.elementUniqueID + "_COLUMN_" + i + '_textInput').value = this.callParameters['RowData'][i];
					}
				} else if(components.nullable) {
					$(this.elementUniqueID + "_Null_COLUMN_" + i).checked = true;
					EditRowDataForm_toggleFieldsOnNull($(this.elementUniqueID + "_Null_COLUMN_" + i), this.elementUniqueID, i, null, true, editRow);
				}
				if (!components.editable && this.callParameters['Title'] == "Edit Row Data" ) {
					$(this.elementUniqueID + "_COLUMN_" + i).disable();
					$(this.elementUniqueID + "_Option_COLUMN_" + i).checked = false;
				}
			}
		}
		
		//Disable field if marked as auto_generated
		if ((this.callParameters['Title'] == "Create Like") || (this.callParameters['Title'] == "Insert Row")) {
			for(var i = 0; i < this.callParameters['ColumnInfo'].name.length; i++) {
				components = this.callParameters['Components']["column"][this.callParameters['ColumnInfo'].name[i]];
				if (components.auto_generated) {
					$(this.elementUniqueID + "_COLUMN_" + i).value = "";
					$(this.elementUniqueID + "_COLUMN_" + i).disable();
					$(this.elementUniqueID + "_Option_COLUMN_" + i).checked = false;
					$(this.elementUniqueID + "_Option_COLUMN_" + i).disable();
				}
				if((this.callParameters['Title'] == "Insert Row")&&components.default!=null) {
					$(this.elementUniqueID + "_COLUMN_" + i).value = components.default;
					$(this.elementUniqueID + "_Img_COLUMN_" + i).show();
				}
			}
		}
		
		// Disable null values on keys, if "edit row data", also disable changing the value
		for (i=0; i < this.callParameters['KeyIndices'].length; i++) 
			if (this.callParameters['Title'] == "Edit Row Data")
				$(this.elementUniqueID + "_COLUMN_" + i).disable();
	},
	
	editColumn: function(element,type,title) {
		var tempParamObject = $H();
		tempParamObject.set('element', element);
		tempParamObject.set('type', type);
		if(type=='xml') {
			tempParamObject.set('$sourceType', 'element');
			tempParamObject.set('$source', element);
			tempParamObject.set('$editMode', 'true');
			tempParamObject.set('$title', title);
			tempParamObject.set('$height', 800);
			tempParamObject.set('$width', 800);
			var components=this.callParameters['Components']["column"][title];
			if(components.chartNodal!=null)
				tempParamObject.set('$setting', components.chartNodal);
			if(components.xmlSchema!=null)
				tempParamObject.set('$definition', components.xmlSchema);
			runTEScript(this.elementName + "_Row_Column_Edit", GLOBAL_TE_SCRIPT_STORE.get('chartNodal'), null, null,null, tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
			return;
		}
		tempParamObject.set('title', title);
		runTEScript(this.elementName + "_Row_Column_Edit", GLOBAL_TE_SCRIPT_STORE.get('editAttribute'), null, null,null, tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
	}
}));