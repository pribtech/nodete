/*******************************************************************************
 *  Author: Peter Prib
 * 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2010 All rights reserved.
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

CORE_CLIENT_ACTIONS.set("chartNodalEditTable",  Class.create(CORE_CLIENT_ACTIONS.get("chartNodal"), {
	initialize: function($super, callParameters) {
    	this.tableSchema=callParameters.$tableSchema;
    	this.tableName=callParameters.$tableName;
		if(callParameters.$chartTitle==null) callParameters.$chartTitle="Edit Table "+this.tableSchema+'.'+this.tableName;
		callParameters.$editMode=='true';
		callParameters.$newRoot="row";
		callParameters.$sourceType="xmlData";
		callParameters.$definition="select XMLELEMENT( NAME \"xs:schema\""
				+",XMLNAMESPACES('http://www.w3.org/2001/XMLSchema' AS \"xs\",'http:XSD/db2mcSchema' AS \"db2mc\")"
				+",XMLELEMENT(NAME \"xs:element\""
					+",XMLATTRIBUTES('row' as \"name\")"
					+",XMLELEMENT(NAME \"xs:complexType\""
					+",(select XMLAGG(XMLELEMENT(NAME \"xs:attribute\""
										+",XMLATTRIBUTES(c.COLNAME as \"name\""
												+",case when f.colseq is null then coalesce(xmltype,TYPENAME) else 'db2mc:sql' end as \"type\""
												+",nullif(SCALE,0) as \"fractionDigits\""
												+",case when nulls='N' then 'required' end as \"use\""
												+")"
										+",case when f.colseq is null then"
												+" XMLELEMENT(NAME \"xs:simpleType\""
													+",XMLELEMENT(NAME \"xs:restriction\""
															+",XMLELEMENT(NAME \"xs:maxLength\""
																		+",XMLATTRIBUTES(coalesce(type.size,LENGTH) as \"value\")"
																	+")"
														+")"
													+")"
												+" else XMLELEMENT(NAME \"db2mc:sql\""
													+", (select XMLCONCAT(XMLTEXT('select distinct \"'||p.colname"
														+		"||'\" from \"'||R.REFTBCREATOR||'\".\"'||R.REFTBNAME||'\"' )"
														+	",case when f.colseq > 1 then"
														+			" (select XMLCONCAT(XMLTEXT(' where \"'||p1.colname||'\"=''')"
														+					",XMLELEMENT(NAME \"db2mc:value\",XMLATTRIBUTES(p1.colname as \"id\"))"
														+					",XMLTEXT(''''))"
														+			" from SYSIBM.SYSkeycoluse as p1 where colseq=1 and (p1.TBCREATOR,p1.TBNAME,p1.CONSTNAME)=(p.TBCREATOR,p.TBNAME,p.CONSTNAME))"
														+	" end"
														+	",case when f.colseq > 2 then"
														+			" (select XMLCONCAT(XMLTEXT(' and \"'||p2.colname||'\"=''')"
														+					",XMLELEMENT(NAME \"db2mc:value\",XMLATTRIBUTES(p2.colname as \"id\"))"
														+					",XMLTEXT(''''))"
														+			" from SYSIBM.SYSkeycoluse as p2 where colseq=2 and (p2.TBCREATOR,p2.TBNAME,p2.CONSTNAME)=(p.TBCREATOR,p.TBNAME,p.CONSTNAME))"
														+	" end"
														+	",case when f.colseq > 3 then"
														+			" (select XMLCONCAT(XMLTEXT(' and \"'||p3.colname||'\"=''')"
														+					",XMLELEMENT(NAME \"db2mc:value\",XMLATTRIBUTES(p3.colname as \"id\"))"
														+					",XMLTEXT(''''))"
														+			" from SYSIBM.SYSkeycoluse as p3 where colseq=3 and (p3.TBCREATOR,p3.TBNAME,p3.CONSTNAME)=(p.TBCREATOR,p.TBNAME,p.CONSTNAME))"
														+	" end"
														+	",case when f.colseq > 4 then"
														+			" (select XMLCONCAT(XMLTEXT(' and \"'||p4.colname||'\"=''')"
														+					",XMLELEMENT(NAME \"db2mc:value\",XMLATTRIBUTES(p4.colname as \"id\"))"
														+					",XMLTEXT(''''))"
														+			" from SYSIBM.SYSkeycoluse as p4 where colseq=4 and (p4.TBCREATOR,p4.TBNAME,p4.CONSTNAME)=(p.TBCREATOR,p.TBNAME,p.CONSTNAME))"
														+	" end"
														+	")"
														+" from SYSIBM.SYSkeycoluse p"
														+" where (p.TBCREATOR,p.TBNAME,p.CONSTNAME )=(R.REFTBCREATOR,R.REFTBNAME,r.REFKEYNAME)"
														+" and f.colseq=p.colseq" 
													+	")"	 
												+") end"

									+") order by c.COLNAME"
								+")"
						+" from syscat.columns c"
						+" left join (values"
								+ "('xs:string'	,'CHARACTER',null)"
								+",('xs:string'	,'VARCHAR',null)"
								+",('xs:string'	,'CLOB',null)"
								+",('xs:decimal','DECIMAL',null)"
								+",('xs:decimal','SMALLINT',6)"
								+",('xs:decimal','INTEGER',10)"
								+",('xs:decimal','BIGINT',16)"
								+",('xs:float'	,'FLOAT',10)"
								+",('xs:double'	,'DOUBLE',16)"
								+",('xs:datetime','TIMESTAMP',26)"
								+",('xs:time'	,'TIME',8)"
								+",('xs:date'	,'DATE',10)"
							+") as type(xmlType,DB2Type,size)"
						+"   on type.DB2Type = c.typename"
						+" left join sysibm.SQLPRIMARYKEYS pk"
						+"   on (pk.TABLE_SCHEM,pk.TABLE_NAME,pk.COLUMN_NAME)=(c.TABSCHEMA,c.TABNAME,c.COLNAME)"
						+" left join (SYSIBM.SYSkeycoluse f"
						+ 		" join SYSIBM.SYSRELS R"
						+   	  " on (f.TBCREATOR,f.TBNAME,f.CONSTNAME )=(R.CREATOR,R.TBNAME,r.relname)"   					
						+   " ) on (f.TBCREATOR,f.TBNAME,f.COLNAME)=(c.TABSCHEMA,c.TABNAME,c.COLNAME)"
						+" where (c.TABSCHEMA,c.TABNAME)=(t.TABSCHEMA,t.TABNAME)"
						+  " and (r.colcount is null or r.colcount= (select max(colcount) from SYSIBM.SYSRELS Rm"
						+                     " where (f.TBCREATOR,f.TBNAME,f.CONSTNAME )=(Rm.CREATOR,Rm.TBNAME,rm.relname)"
						+                     "))"
						+")))"
					+")"
				+" from syscat.tables as t"
				+" where type='T' AND TABSCHEMA='"+this.tableSchema+"' and TABNAME='"+this.tableName+"'"
				;
		$super(callParameters);
	},
	cancel: function () {
		this.destroy();
	},
	saveNode: function () {
	}
}));