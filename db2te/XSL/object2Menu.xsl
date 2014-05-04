<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="text"/>
 <!--
  Author: Peter Prib
  
  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2009 All rights reserved.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  
-->
<xsl:param name="description"/>
<xsl:param name="databaseDriver"/>
<xsl:param name="database"/>
<xsl:param name="schema"/>
<xsl:param name="username"/>
<xsl:param name="hostname"/>
<xsl:param name="portnumber"/>
<xsl:param name="usePersistentConnection"/>
<xsl:param name="comment"/>
<xsl:param name="connectionStatus"/>
<xsl:param name="group"/>
<xsl:param name="authenticated"/>
<xsl:param name="dataServerName"/>
<xsl:param name="dataServerVersion"/>
<xsl:param name="dataServerFixpack"/>
<xsl:param name="dataServerInstance"/>
<xsl:param name="dataServerTransactionIsolation"/>
<xsl:param name="dataServerCodepage"/>
<xsl:param name="dataServerSQLConformance"/>
<xsl:param name="dataServerDefaultIsolationLevel"/>

<xsl:template match="/">
	<xsl:apply-templates select="*"/>
</xsl:template>

<xsl:template match="aliases">
	<xsl:call-template name="menuEmbeddedBranch">
    	<xsl:with-param name="description">Aliases  (<xsl:value-of select="count(alias)"/>)</xsl:with-param>
	</xsl:call-template>
</xsl:template>
<xsl:template match="alias">
	<xsl:call-template name="menuLeaf">
    	<xsl:with-param name="description"><xsl:value-of select="@SCHEMA"/>.<xsl:value-of select="@NAME"/></xsl:with-param>
    	<xsl:with-param name="table">alias</xsl:with-param>
    	<xsl:with-param name="key1Column">tabschema</xsl:with-param>
    	<xsl:with-param name="key1Value"><xsl:value-of select="@SCHEMA"/></xsl:with-param>
    	<xsl:with-param name="key2Column">tabname</xsl:with-param>
    	<xsl:with-param name="key2Value"><xsl:value-of select="@NAME"/></xsl:with-param>
	</xsl:call-template>
</xsl:template>

<xsl:template match="bufferpools">
	<xsl:call-template name="menuEmbeddedBranch">
    	<xsl:with-param name="description">Bufferpools (<xsl:value-of select="count(bufferpool)"/>)</xsl:with-param>
	</xsl:call-template>
</xsl:template>
<xsl:template match="bufferpool">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;<xsl:value-of select="@BPNAME"/>&lt;/description&gt;
		<xsl:call-template name="menuLeaf">
 		   	<xsl:with-param name="description">Detail</xsl:with-param>
    		<xsl:with-param name="table">bufferpool</xsl:with-param>
    		<xsl:with-param name="key1Column">bpname</xsl:with-param>
    		<xsl:with-param name="key1Value"><xsl:value-of select="@BPNAME"/></xsl:with-param>
		</xsl:call-template>
		<xsl:call-template name="menuBranchXML">
    		<xsl:with-param name="description">Tablespaces</xsl:with-param>
    	  	<xsl:with-param name="element">tablespace</xsl:with-param>
    	  	<xsl:with-param name="id">TBSPACE</xsl:with-param>
    	  	<xsl:with-param name="column">TBSPACE</xsl:with-param>
    	  	<xsl:with-param name="table">SYSCAT.TABLESpaces s join syscat.bufferpools b on s.BUFFERPOOLID=b.BUFFERPOOLID</xsl:with-param>
  			<xsl:with-param name="key">BPNAME</xsl:with-param>
  			<xsl:with-param name="value"><xsl:value-of select="@BPNAME"/></xsl:with-param>
		</xsl:call-template>	
		<xsl:apply-templates select='./../../tablespaces/tablespace[@BPNAME="@BPNAME"]'/>
		
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="databases">
	<xsl:call-template name="menuEmbeddedBranch">
    	<xsl:with-param name="description">Databases <xsl:if test=" not ($dataServerName='') "><xsl:value-of select="$dataServerName"/></xsl:if></xsl:with-param>
	</xsl:call-template>
</xsl:template>
<xsl:template match="database">
	<xsl:choose>
		<xsl:when test="$databaseDriver='DB2'">
			&lt;menu type="embeddedBranch"&gt;
				&lt;description&gt;<xsl:value-of select="@DB_NAME"/>&lt;/description&gt;
				<xsl:call-template name="menuLeaf">	
   					<xsl:with-param name="description">Table Catalog List Detail</xsl:with-param>
   					<xsl:with-param name="table">tablecat</xsl:with-param>
   					<xsl:with-param name="action">list_table</xsl:with-param>
   					<xsl:with-param name="key1Column">dbName</xsl:with-param>
   					<xsl:with-param name="key1Value"><xsl:value-of select="@DB_NAME"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="menuLeaf">	
   					<xsl:with-param name="description">Table Only List Detail</xsl:with-param>
   					<xsl:with-param name="table">tableOnlycat</xsl:with-param>
   					<xsl:with-param name="action">list_table</xsl:with-param>
   					<xsl:with-param name="key1Column">dbName</xsl:with-param>
	   				<xsl:with-param name="key1Value"><xsl:value-of select="@DB_NAME"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="menuBranchXML">
    				<xsl:with-param name="description">Schemas</xsl:with-param>
   			 	  	<xsl:with-param name="element">schema</xsl:with-param>
	   		 	  	<xsl:with-param name="column">CREATOR</xsl:with-param>
   			 	  	<xsl:with-param name="table">(select distinct CREATOR FROM SYSIBM.SYSTABLES) as t</xsl:with-param>
  					<xsl:with-param name="key">DBNAME</xsl:with-param>
  					<xsl:with-param name="value"><xsl:value-of select="@DB_NAME"/></xsl:with-param>
				</xsl:call-template>	
			&lt;/menu&gt;
		</xsl:when>
		<xsl:when test="$databaseDriver='ORACLE'">
			&lt;menu type="embeddedBranch"&gt;
				&lt;description&gt;<xsl:value-of select="@DB_NAME"/>&lt;/description&gt;
				<xsl:call-template name="menuBranchXML">
	    			<xsl:with-param name="description">Schemas</xsl:with-param>
   			 	  	<xsl:with-param name="element">schema</xsl:with-param>
   			 	  	<xsl:with-param name="id">SCHEMANAME</xsl:with-param>
		   	 	  	<xsl:with-param name="column">OWNER</xsl:with-param>
   			 	  	<xsl:with-param name="table">(select distinct owner from dba_objects)</xsl:with-param>
		  			<xsl:with-param name="key"></xsl:with-param>
				</xsl:call-template>	
			&lt;/menu&gt;
		</xsl:when>
		<xsl:otherwise>
			<xsl:call-template name="menuEmbeddedBranch">
   		 		<xsl:with-param name="description"><xsl:value-of select="@DB_NAME"/></xsl:with-param>
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="functions">
	<xsl:call-template name="menuEmbeddedBranch">
    	<xsl:with-param name="description">Functions  (<xsl:value-of select="count(function)"/>)</xsl:with-param>
	</xsl:call-template>
</xsl:template>
<xsl:template match="function">
	<xsl:call-template name="menuLeaf">
    	<xsl:with-param name="description"><xsl:value-of select="@FUNCSCHEMA"/>.<xsl:value-of select="@FUNCNAME"/></xsl:with-param>
    	<xsl:with-param name="table">function</xsl:with-param>
    	<xsl:with-param name="key1Column">FUNCSCHEMA</xsl:with-param>
    	<xsl:with-param name="key1Value"><xsl:value-of select="@FUNCSCHEMA"/></xsl:with-param>
    	<xsl:with-param name="key2Column">FUNCNAME</xsl:with-param>
    	<xsl:with-param name="key2Value"><xsl:value-of select="@FUNCNAME"/></xsl:with-param>
	</xsl:call-template>
</xsl:template>

<xsl:template match="nicknames">
	<xsl:call-template name="menuEmbeddedBranch">
    	<xsl:with-param name="description">Nicknames (<xsl:value-of select="count(nickname)"/>)</xsl:with-param>
	</xsl:call-template>
</xsl:template>
<xsl:template match="nickname">
	<xsl:call-template name="menuLeaf">
    	<xsl:with-param name="description"><xsl:value-of select="@SCHEMA"/>.<xsl:value-of select="@NAME"/></xsl:with-param>
    	<xsl:with-param name="table">Federation/federatedObjects</xsl:with-param>
    	<xsl:with-param name="key1Column">TABSCHEMA</xsl:with-param>
    	<xsl:with-param name="key1Value"><xsl:value-of select="@SCHEMA"/></xsl:with-param>
    	<xsl:with-param name="key2Column">TABNAME</xsl:with-param>
    	<xsl:with-param name="key2Value"><xsl:value-of select="@NAME"/></xsl:with-param>
	</xsl:call-template>
</xsl:template>

<xsl:template match="procedures">
	<xsl:call-template name="menuEmbeddedBranch">
    	<xsl:with-param name="description">Procedures (<xsl:value-of select="count(procedure)"/>)</xsl:with-param>
	</xsl:call-template>
</xsl:template>
<xsl:template match="procedure">
	<xsl:call-template name="menuLeaf">
    	<xsl:with-param name="description"><xsl:value-of select="@PROCSCHEMA"/>.<xsl:value-of select="@PROCNAME"/></xsl:with-param>
    	<xsl:with-param name="table">procedure</xsl:with-param>
    	<xsl:with-param name="key1Column">procschema</xsl:with-param>
    	<xsl:with-param name="key1Value"><xsl:value-of select="@PROCSCHEMA"/></xsl:with-param>
    	<xsl:with-param name="key2Column">procname</xsl:with-param>
    	<xsl:with-param name="key2Value"><xsl:value-of select="@PROCNAME"/></xsl:with-param>
	</xsl:call-template>
</xsl:template>

<xsl:template match="schemas">
	<xsl:call-template name="menuEmbeddedBranch">
    	<xsl:with-param name="description">Schemas  (<xsl:value-of select="count(schema)"/>)</xsl:with-param>
	</xsl:call-template>
</xsl:template>
<xsl:template match="schema">
	&lt;menu type="embeddedBranch"&gt;
	&lt;description&gt;<xsl:value-of select="@SCHEMANAME"/>&lt;/description&gt;
	<xsl:choose>
		<xsl:when test="$databaseDriver='ORACLE'">
				<xsl:call-template name="menuBranchXML">
	    			<xsl:with-param name="description">Tables</xsl:with-param>
   			 	  	<xsl:with-param name="element">table</xsl:with-param>
		   	 	  	<xsl:with-param name="column">table_name</xsl:with-param>
  					<xsl:with-param name="id">TABNAME</xsl:with-param>
   			 	  	<xsl:with-param name="table">sys.ALL_TABLES</xsl:with-param>
  					<xsl:with-param name="key">OWNER</xsl:with-param>	
  					<xsl:with-param name="value"><xsl:value-of select="@SCHEMANAME"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="menuLeaf">
    				<xsl:with-param name="description">Catalog List</xsl:with-param>
  		  			<xsl:with-param name="table">Oracle/catalog</xsl:with-param>
    				<xsl:with-param name="action">list_table</xsl:with-param>
		    		<xsl:with-param name="key1Column">OWNER</xsl:with-param>
		    		<xsl:with-param name="key1Value"><xsl:value-of select="@SCHEMANAME"/></xsl:with-param>
				</xsl:call-template>	
				<xsl:call-template name="menuLeaf">
    				<xsl:with-param name="description">Object List</xsl:with-param>
  		  			<xsl:with-param name="table">Oracle/object</xsl:with-param>
    				<xsl:with-param name="action">list_table</xsl:with-param>
		    		<xsl:with-param name="key1Column">OWNER</xsl:with-param>
		    		<xsl:with-param name="key1Value"><xsl:value-of select="@SCHEMANAME"/></xsl:with-param>
				</xsl:call-template>	
				<xsl:call-template name="menuLeaf">
    				<xsl:with-param name="description">Table List Detail</xsl:with-param>
  		  			<xsl:with-param name="table">Oracle/table</xsl:with-param>
    				<xsl:with-param name="action">list_table</xsl:with-param>
		    		<xsl:with-param name="key1Column">OWNER</xsl:with-param>
		    		<xsl:with-param name="key1Value"><xsl:value-of select="@SCHEMANAME"/></xsl:with-param>
				</xsl:call-template>	
		</xsl:when>
		<xsl:otherwise>
				<xsl:call-template name="menuLeaf">
    				<xsl:with-param name="description">Detail</xsl:with-param>
    				<xsl:with-param name="table">schema</xsl:with-param>
    				<xsl:with-param name="key1Column">schemaname</xsl:with-param>
  			  		<xsl:with-param name="key1Value"><xsl:value-of select="@SCHEMANAME"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="menuLeaf">
   			 		<xsl:with-param name="description">Table Catalog List Detail</xsl:with-param>
		    		<xsl:with-param name="table">tablecat</xsl:with-param>
    				<xsl:with-param name="action">list_table</xsl:with-param>
  		  			<xsl:with-param name="key1Column">tabschema</xsl:with-param>
 			   		<xsl:with-param name="key1Value"><xsl:value-of select="@SCHEMANAME"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="menuLeaf">
    				<xsl:with-param name="description">Table List Detail</xsl:with-param>
  		  			<xsl:with-param name="table">tableOnlyCat</xsl:with-param>
    				<xsl:with-param name="action">list_table</xsl:with-param>
		    		<xsl:with-param name="key1Column">tabschema</xsl:with-param>
		    		<xsl:with-param name="key1Value"><xsl:value-of select="@SCHEMANAME"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="menuBranchSQLXML">
		    		<xsl:with-param name="description">Aliases</xsl:with-param>
	 		   	  	<xsl:with-param name="sqlxml">queryfiles/predefined/Aliases2XML.sql</xsl:with-param>
		  			<xsl:with-param name="predicate">TABSCHEMA='<xsl:value-of select="@SCHEMANAME"/>'</xsl:with-param>
		  			<xsl:with-param name="xsl">XSL/object2Menu</xsl:with-param>
 		 			<xsl:with-param name="dropParent">true</xsl:with-param>
				</xsl:call-template>	
				<xsl:call-template name="menuBranchSQLXML">
    				<xsl:with-param name="description">Functions</xsl:with-param>
    			  	<xsl:with-param name="sqlxml">queryfiles/predefined/Functions2XML.sql</xsl:with-param>
 		 			<xsl:with-param name="predicate">FUNCSCHEMA='<xsl:value-of select="@SCHEMANAME"/>'</xsl:with-param>
  					<xsl:with-param name="xsl">XSL/object2Menu</xsl:with-param>
 		 			<xsl:with-param name="dropParent">true</xsl:with-param>
				</xsl:call-template>	
				<xsl:call-template name="menuBranchSQLXML">
   		 		<xsl:with-param name="description">Nicknames</xsl:with-param>
    		  		<xsl:with-param name="sqlxml">queryfiles/predefined/Nicknames2XML.sql</xsl:with-param>
  					<xsl:with-param name="predicate">TABSCHEMA='<xsl:value-of select="@SCHEMANAME"/>'</xsl:with-param>
  					<xsl:with-param name="xsl">XSL/object2Menu</xsl:with-param>
 		 			<xsl:with-param name="dropParent">true</xsl:with-param>
				</xsl:call-template>	
				<xsl:call-template name="menuBranchSQLXML">
    				<xsl:with-param name="description">Stored Procedures</xsl:with-param>
    			  	<xsl:with-param name="sqlxml">queryfiles/predefined/Procedures2XML.sql</xsl:with-param>
  					<xsl:with-param name="predicate">PROCSCHEMA='<xsl:value-of select="@SCHEMANAME"/>'</xsl:with-param>
  					<xsl:with-param name="xsl">XSL/object2Menu</xsl:with-param>
  					<xsl:with-param name="dropParent">true</xsl:with-param>
				</xsl:call-template>	
				<xsl:call-template name="menuBranchSQLXML">
    				<xsl:with-param name="description">Sequences</xsl:with-param>
    			  	<xsl:with-param name="sqlxml">queryfiles/predefined/Sequences2XML.sql</xsl:with-param>
  					<xsl:with-param name="predicate">SEQSCHEMA='<xsl:value-of select="@SCHEMANAME"/>'</xsl:with-param>
  					<xsl:with-param name="xsl">XSL/object2Menu</xsl:with-param>
  					<xsl:with-param name="dropParent">true</xsl:with-param>
				</xsl:call-template>	
				<xsl:call-template name="menuBranchSQLXML">
    				<xsl:with-param name="description">Tables</xsl:with-param>
      				<xsl:with-param name="sqlxml">queryfiles/predefined/Tables2XML.sql</xsl:with-param>
  					<xsl:with-param name="predicate">TABSCHEMA='<xsl:value-of select="@SCHEMANAME"/>'</xsl:with-param>
  					<xsl:with-param name="xsl">XSL/object2Menu</xsl:with-param>
  					<xsl:with-param name="dropParent">true</xsl:with-param>
				</xsl:call-template>	
				<xsl:call-template name="menuBranchSQLXML">
   			 		<xsl:with-param name="description">Views</xsl:with-param>
    	  			<xsl:with-param name="sqlxml">queryfiles/predefined/Views2XML.sql</xsl:with-param>
  					<xsl:with-param name="predicate">TABSCHEMA='<xsl:value-of select="@SCHEMANAME"/>'</xsl:with-param>
  					<xsl:with-param name="xsl">XSL/object2Menu</xsl:with-param>
 		 			<xsl:with-param name="dropParent">true</xsl:with-param>
				</xsl:call-template>	
		</xsl:otherwise>
	</xsl:choose>
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="sequences">
	<xsl:call-template name="menuEmbeddedBranch">
    	<xsl:with-param name="description">Sequences  (<xsl:value-of select="count(sequence)"/>)</xsl:with-param>
	</xsl:call-template>
</xsl:template>
<xsl:template match="sequence">
	<xsl:call-template name="menuLeaf">
    	<xsl:with-param name="description"><xsl:value-of select="@SEQSCHEMA"/>.<xsl:value-of select="@SEQNAME"/></xsl:with-param>
    	<xsl:with-param name="table">sequence</xsl:with-param>
    	<xsl:with-param name="key1Column">SEQSCHEMA</xsl:with-param>
    	<xsl:with-param name="key1Value"><xsl:value-of select="@SEQSCHEMA"/></xsl:with-param>
    	<xsl:with-param name="key2Column">SEQNAME</xsl:with-param>
    	<xsl:with-param name="key2Value"><xsl:value-of select="@SEQNAME"/></xsl:with-param>
	</xsl:call-template>
</xsl:template>

<xsl:template match="tables">
	<xsl:call-template name="menuEmbeddedBranch">
    	<xsl:with-param name="description">Tables (<xsl:value-of select="count(table)"/>)</xsl:with-param>
	</xsl:call-template>
</xsl:template>
<xsl:template match="table">
	<xsl:choose>
		<xsl:when test="$databaseDriver='ORACLE'">
			<xsl:call-template name="menuBranchSQLXML">
    			<xsl:with-param name="description"><xsl:value-of select="@TABSCHEMA"/>.<xsl:value-of select="@TABNAME"/></xsl:with-param>
      			<xsl:with-param name="sqlxml">queryfiles/predefined/Table2XMLOracle.sql</xsl:with-param>
  				<xsl:with-param name="predicate">TABSCHEMA='<xsl:value-of select="@TABSCHEMA"/>' and TABNAME='<xsl:value-of select="@TABNAME"/>'</xsl:with-param>
  				<xsl:with-param name="xsl">XSL/table2Menu</xsl:with-param>
				<xsl:with-param name="dropParent">true</xsl:with-param>
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:call-template name="menuBranchSQLXML">
    			<xsl:with-param name="description"><xsl:value-of select="@TABSCHEMA"/>.<xsl:value-of select="@TABNAME"/></xsl:with-param>
      			<xsl:with-param name="sqlxml">queryfiles/predefined/Table2XML.sql</xsl:with-param>
  				<xsl:with-param name="predicate">TABSCHEMA='<xsl:value-of select="@TABSCHEMA"/>' and TABNAME='<xsl:value-of select="@TABNAME"/>'</xsl:with-param>
  				<xsl:with-param name="xsl">XSL/table2Menu</xsl:with-param>
				<xsl:with-param name="dropParent">true</xsl:with-param>
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="tablespaces">
	<xsl:call-template name="menuEmbeddedBranch">
    	<xsl:with-param name="description">Tablespaces (<xsl:value-of select="count(tablespace)"/>)</xsl:with-param>
	</xsl:call-template>
</xsl:template>
<xsl:template match="tablespace">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;<xsl:value-of select="@TBSPACE"/>&lt;/description&gt;
	<xsl:call-template name="menuLeaf">
    	<xsl:with-param name="description">Detail</xsl:with-param>
    	<xsl:with-param name="table">tablespaces</xsl:with-param>
    	<xsl:with-param name="key1Column">tbspace</xsl:with-param>
    	<xsl:with-param name="key1Value"><xsl:value-of select="@TBSPACE"/></xsl:with-param>
	</xsl:call-template>
	<xsl:call-template name="menuLeaf">
   		<xsl:with-param name="description">Table List Detail</xsl:with-param>
   		<xsl:with-param name="table">tablecat</xsl:with-param>
   		<xsl:with-param name="action">list_table</xsl:with-param>
   		<xsl:with-param name="key1Column">tbspace</xsl:with-param>
   		<xsl:with-param name="key1Value"><xsl:value-of select="@TBSPACE"/></xsl:with-param>
	</xsl:call-template>
	<xsl:call-template name="menuBranchSQLXML">
   		<xsl:with-param name="description">Tables</xsl:with-param>
   		<xsl:with-param name="sqlxml">queryfiles/predefined/Tables2XML.sql</xsl:with-param>
		<xsl:with-param name="predicate">TBSPACE='<xsl:value-of select="@TBSPACE"/>'</xsl:with-param>
		<xsl:with-param name="xsl">XSL/object2Menu</xsl:with-param>
		<xsl:with-param name="dropParent">true</xsl:with-param>
	</xsl:call-template>
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="views">
	<xsl:call-template name="menuEmbeddedBranch">
    	<xsl:with-param name="description">Views (<xsl:value-of select="count(view)"/>)</xsl:with-param>
	</xsl:call-template>
</xsl:template>
<xsl:template match="view">
	<xsl:call-template name="menuLeaf">
    	<xsl:with-param name="description"><xsl:value-of select="@SCHEMA"/>.<xsl:value-of select="@NAME"/></xsl:with-param>
    	<xsl:with-param name="table">viewcat</xsl:with-param>
    	<xsl:with-param name="key1Column">viewschema</xsl:with-param>
    	<xsl:with-param name="key1Value"><xsl:value-of select="@SCHEMA"/></xsl:with-param>
    	<xsl:with-param name="key2Column">viewname</xsl:with-param>
    	<xsl:with-param name="key2Value"><xsl:value-of select="@NAME"/></xsl:with-param>
	</xsl:call-template>
</xsl:template>

<!-- =================================================================================================== -->

<xsl:template name="menuEmbeddedBranch">
  <xsl:param name="description"/>
  <xsl:param name="detailTemplate"/>
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;<xsl:value-of select="$description"/>&lt;/description&gt;
		<xsl:apply-templates select="*"/>
	&lt;/menu&gt;
</xsl:template>

<xsl:template name="menuLeaf">
  <xsl:param name="description"/>
  <xsl:param name="table"/>
  <xsl:param name="action">display</xsl:param>
  <xsl:param name="key1Column"/>
  <xsl:param name="key1Value"/>
  <xsl:param name="key2Column"/>
  <xsl:param name="key2Value"/>
  <xsl:param name="key3Column"/>
  <xsl:param name="key3Value"/>
  <xsl:param name="key4Column"/>
  <xsl:param name="key4Value"/>
  <xsl:param name="key5Column"/>
  <xsl:param name="key5Value"/>
	&lt;menu type="leaf" branchDirectory="" &gt;
		&lt;pageWindow target="_active"&gt;
			&lt;splitPane direction="h"&gt;
				&lt;topPane&gt;
					&lt;panel name="main" PrimaryContainer="true"&gt;
						&lt;link type="action" target="_self" window="_self" connectionRequired="y"&gt;
							&lt;parameterList&gt;
								&lt;parameter name="table"&gt;<xsl:value-of select="$table"/>&lt;/parameter&gt;
								&lt;parameter name="action"&gt;<xsl:value-of select="$action"/>&lt;/parameter&gt;
								&lt;parameter name="<xsl:value-of select="$key1Column"/>"&gt;<xsl:value-of select="$key1Value"/>&lt;/parameter&gt;
							    <xsl:if test="$key2Column != ''">&lt;parameter name="<xsl:value-of select="$key2Column"/>"&gt;<xsl:value-of select="$key2Value"/>&lt;/parameter&gt;</xsl:if>
							    <xsl:if test="$key3Column != ''">&lt;parameter name="<xsl:value-of select="$key3Column"/>"&gt;<xsl:value-of select="$key3Value"/>&lt;/parameter&gt;</xsl:if>
							    <xsl:if test="$key4Column != ''">&lt;parameter name="<xsl:value-of select="$key4Column"/>"&gt;<xsl:value-of select="$key4Value"/>&lt;/parameter&gt;</xsl:if>
							    <xsl:if test="$key5Column != ''">&lt;parameter name="<xsl:value-of select="$key5Column"/>"&gt;<xsl:value-of select="$key5Value"/>&lt;/parameter&gt;</xsl:if>
							&lt;/parameterList&gt;
						&lt;/link&gt;				
					&lt;/panel&gt;
				&lt;/topPane&gt;
				&lt;bottomPane&gt;
					&lt;panel name="detail"/&gt;
				&lt;/bottomPane&gt;
			&lt;/splitPane&gt;
		&lt;/pageWindow&gt;
		&lt;description&gt;<xsl:value-of select="$description"/>&lt;/description&gt;
	&lt;/menu&gt;
</xsl:template>

<xsl:template name="menuBranchSQLXML">
  <xsl:param name="description"/>
  <xsl:param name="sqlxml"/>
  <xsl:param name="predicate"/>
  <xsl:param name="xsl"/>
  <xsl:param name="dropParent"/>
	&lt;menu type="branch" 
		branchSQLXML="<xsl:value-of select="$sqlxml"/>" 
		branchSQLPredicate="<xsl:value-of select="$predicate"/>" 
		branchXSL="<xsl:value-of select="$xsl"/>" 
		delayLoad="mouse" 
		dropParent="<xsl:value-of select="$dropParent"/>"&gt;
		&lt;description&gt;<xsl:value-of select="$description"/>&lt;/description&gt;
	&lt;/menu&gt;
</xsl:template>

<xsl:template name="menuBranchXML">
  <xsl:param name="description"/>
  <xsl:param name="element"/>
  <xsl:param name="id">ID</xsl:param>
  <xsl:param name="table"/>
  <xsl:param name="column"/>
  <xsl:param name="key">ID</xsl:param>
  <xsl:param name="value">@ID</xsl:param> 
  <xsl:param name="xsl">XSL/object2Menu</xsl:param>
  <xsl:param name="dropParent">false</xsl:param>
  <xsl:param name="replacement">true</xsl:param>
	&lt;menu type="branch" 
		branchSQLXML='select XMLELEMENT( NAME @@@<xsl:value-of select="$element"/>s@@@ , XMLAGG(XMLELEMENT(NAME @@@<xsl:value-of select="$element"/>@@@ ,XMLATTRIBUTES( <xsl:value-of select="$column"/> as <xsl:value-of select="$id"/>)) order by <xsl:value-of select="$column"/>) ) from <xsl:value-of select="$table"/>'
		branchXSL="<xsl:value-of select="$xsl"/>"
		<xsl:if test="not($key='')">
			branchSQLPredicate="<xsl:value-of select="$key"/> = ?!value=<xsl:value-of select="$value"/>?"
		</xsl:if>
		delayLoad="mouse"
		replacement="<xsl:value-of select="$replacement"/>"&gt;
		dropParent="<xsl:value-of select="$dropParent"/>"&gt;
		&lt;description&gt;<xsl:value-of select="$description"/>&lt;/description&gt;
	&lt;/menu&gt;
</xsl:template>

</xsl:stylesheet>	