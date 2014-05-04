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

//Title Bar Types

var NO_TITLE_BAR = 0;

var WINDOW_CONTROLS_OUTSIDE_OF_TITLE = 1;

var WINDOW_CONTROLS_INSIDE_OF_TITLE = 2; 
	


// Window Control Types
var NO_NAV_BAR = 0;

var NAV_BACK_BUTTON = 1;

var NAV_FORWARD_BUTTON = 2;

var NAV_RELOAD_BUTTON = 4;

var NAV_ADDRESS_BAR = 8;

var TAB_PERSISTENCE_FLAG = 16;	




//Window Option Type
var NO_TITLE_BAR_OPTIONS = 0;
	
var TITLE_BAR_QUESTION_MENU = 1;

var TITLE_BAR_MINIMIZE_BUTTON = 2;

var TITLE_BAR_HIDE_BUTTON = 4;

var TITLE_BAR_CLOSE_BUTTON = 8;


	
// Window Sizable options
	
var WINDOW_IS_SIZABLE = 1;

var WINDOW_IS_FIXED = 2;

var WINDOW_IS_FULL = 3;



var NO_TASK_BAR = 0;

var TOP_TAB_TASK_BAR = 1;

var TOP_BLOCK_TASK_BAR = 2;

var LEFT_BLOCK_TASK_BAR = 4;

var RIGHT_BLOCK_TASK_BAR = 8;

var BOTTOM_BLOCK_TASK_BAR = 16;

var ALLOW_NEW_PANEL = 32;



var HORIZONTAL = false;

var VERTICAL = true;


var EMBEDDED_CONTEXT_WINDOW = true;
var FLOATING_CONTEXT_WINDOW = false;


var TOP = 0;
var CENTER = 1;
var BOTTOM = 2;
var LEFT = 3;
var RIGHT = 4;

var OPEN_ON_FLY_OVER = false;
var OPEN_ON_CLICK = true;

//window Types
var NORMAL = 0;
var CAN_NOT_CLOSE = 1;



//Turutorial Page Flow Types
var TUTORIAL_FLOW_FREE = 0;
var TUTORIAL_FLOW_FORWARD_SEQUENTIAL = 1;
var TUTORIAL_FLOW_STRICT_SEQUENTIAL = 2;
var TUTORIAL_FLOW_FORWARD_EXPLORATION = 4 ;
var TUTORIAL_FREE_WITH_CHECKS = 8;



//Modal Panel Constants
var MODALPANEL_TOP_MINIMUM_MARGIN = 10;
var MODALPANEL_BOTTOM_MINIMUM_MARGIN = 10;
var MODALPANEL_LEFT_MINIMUM_MARGIN = 10;
var MODALPANEL_RIGHT_MINIMUM_MARGIN = 10;

//GRAPH Constants

var BAR_GRAPH = 0;
var LINE_GRAPH = 1;
var PIE_GRAPH = 2;

var DATA_FROM_URL = 0;
var DATA_FROM_RAW = 1;
var DATA_FROM_STREAM = 2;


//Window history Types

var WINDOW_HISTORY_PAGE_CHANGE = 1;
var WINDOW_HISTORY_ACTION_EVENT = 2;


var DO_NOT_RECORD_HISTORY = 0;
var PUSH_HISTORY_FORWARDS = 1;
var PUSH_HISTORY_BACKWARDS = 2;

var SQL_COMPARISON_OPERATORS = [
				"=",
				"IN",
				"BETWEEN",
				"NOT BETWEEN",
				"LIKE",
				"NOT LIKE",
				"IS NULL",
				"IS NOT NULL",
				"EXISTS",
				"NOT EXISTS",
				"Locate",
				"LocateAnyCase",
				"<>",
				">",
				"<",
				"<=",
				">="
			];
			
			
//DB2 DATA TYPES

var DB2_STRING = 1;

var DB2_NUMBER = 2;

var DB2_CLOB = 3;

var DB2_BLOB = 4;

var DB2_DATA_TYPE_CLASSIFICATION = {
	"int"		: DB2_NUMBER,
	"real"		: DB2_NUMBER,
	"clob"		: DB2_CLOB,
	"dbclob"	: DB2_BLOB,
	"blob" 		: DB2_BLOB,
	"xml" 		: DB2_CLOB,
	"date"		: DB2_STRING,
	"time"		: DB2_STRING,
	"datetime"	: DB2_STRING,
	"timestamp"	: DB2_STRING,
	"string"	: DB2_STRING
};

var MASTER_TABLE_COLOR_SET = [ ["#f1f1f1", "#fafafa"], ["#9c9c9c", "#959595"], ["#919191", "#9a9a9a"]];

//Refresh Options

var REFRESH_ON_NO_CONNECTION = 1;
var REFRESH_WHEN_NOT_VISIBLE = 2;

var WINDOW_STATUSBAR_STATES = {
		'default' : {
			'0':{
				LeftBar:'images/Lefttitlebar.gif',
				RightBar:'images/righttitlebar.gif',
				background:"url('images/titlebar.gif')",
				color:'#000000'
			},
			'1':{
				LeftBar:'images/Lefttitlebar_c.gif',
				RightBar:'images/righttitlebar_c.gif',
				background:"url('images/titlebar_c.gif')",
				color:'#000000'
			},
			'-1':{
				LeftBar:'images/Lefttitlebar_s.gif',
				RightBar:'images/righttitlebar_s.gif',
				background:"url('images/titlebar_s.gif')",
				color:'#000000'
			}
		},
		'touch' : {
			'0':{
				LeftBar:'images/Lefttitlebar_touch.gif',
				RightBar:'images/righttitlebar_touch.gif',
				background:"url('images/titlebar_touch.gif')",
				color:'#000000'
			},
			'1':{
				LeftBar:'images/Lefttitlebar_c_touch.gif',
				RightBar:'images/righttitlebar_c_touch.gif',
				background:"url('images/titlebar_c_touch.gif')",
				color:'#000000'
			},
			'-1':{
				LeftBar:'images/Lefttitlebar_s_touch.gif',
				RightBar:'images/righttitlebar_s_touch.gif',
				background:"url('images/titlebar_s_touch.gif')",
				color:'#000000'
			}
		}
};

//Row highlighting

function ROW_HIGHLIGHT_STYLE(style) {
	switch(style) {
		case 'OK':
			return 'background-color:#a7ffa7;';
		case 'INFO':
		case 'INFORMATION':
			return 'background-color:#ff92fe;';
		case 'WARNING':
			return 'background-color:#fffe82;';
		case 'ERROR':
			return 'background-color:#ff7e7e;';
		case 'CATASTROPHIC':
			return 'background-color:#adfeff;';
	}
	return style;
}
function COLUMN_HIGHLIGHT_STYLE(style) {
	return ROW_HIGHLIGHT_STYLE(style);
}
