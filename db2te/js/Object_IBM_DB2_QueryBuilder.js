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

QUERY_BUILDER_CLASS.set("IBM_DB2",Class.create(baseQueryBuilder, {
	initialize: function($super) {
		$super();
	},
	primaryKeyQuery: function(schema, tableName) {
		return  "SELECT COLUMN_NAME FROM SYSIBM.SQLPRIMARYKEYS WHERE TABLE_SCHEM = '" + schema + "' AND TABLE_NAME = '" + tableName + "'";
	}
}));

QUERY_BUILDER.set('IBM_DB2',new (QUERY_BUILDER_CLASS.get("IBM_DB2"))());
QUERY_BUILDER.set('JDBC_DB2',QUERY_BUILDER.get('IBM_DB2'));
//QUERY_BUILDER.set('Derby',QUERY_BUILDER.get('IBM_DB2'));
