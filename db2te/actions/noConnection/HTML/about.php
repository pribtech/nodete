<?php
/*******************************************************************************
 *  Copyright IBM Corp. 2007 All rights reserved.
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

$version = MAJOR_VERSION . "." . MINOR_VERSION . "." . SUB_VERSION;

$copyright = <<<ALL
<table><tr><td valign='top' class="ContentTableContent">
<p>Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.</p>
<p>You may obtain a copy of the License at:</p>
<ul><li>http://www.apache.org/licenses/LICENSE-2.0</ul>
<p>Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.</p>
</td></tr>
<table>
ALL;

$opensource = <<<ALL
<table><tr><td valign='top' class="ContentTableContent">
<p>The DB2 Technology Explorer for IBM DB2 is an open source project available at
<a onclick="OpenURLInFloatingWindow('http://www.sourceforge.net/projects/db2mc');">sourceforge.net/projects/db2mc</a>
</p>
</td></tr>
<table>
ALL;

echo "<table>
		<tr>
			<td valign='top'> ";
echo makeDisplayGroup('About',makeDisplayContent('Version', $version));
echo '			</td>
		</tr>
		<tr>
			<td valign="top">';
echo makeDisplayGroup('Open Source',$opensource);
echo '			</td>
		</tr>		
		<tr>
			<td valign="top">';
echo makeDisplayGroup('Copyright IBM Corp. 2007,2008 All rights reserved',$copyright);
echo '			</td>
		</tr>
	
	<table>';

?>