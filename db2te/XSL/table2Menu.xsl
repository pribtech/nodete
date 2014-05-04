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

<xsl:template match="/">
	<xsl:apply-templates select="table"/>
</xsl:template>

<xsl:template match="table">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;<xsl:value-of select="@TABSCHEMA"/>.<xsl:value-of select="@TABNAME"/>&lt;/description&gt;
	<xsl:call-template name="menuLeaf">
    	<xsl:with-param name="description">detail</xsl:with-param>
    	<xsl:with-param name="table">tablecat</xsl:with-param>
    	<xsl:with-param name="key1Column">tabschema</xsl:with-param>
    	<xsl:with-param name="key1Value"><xsl:value-of select="@TABSCHEMA"/></xsl:with-param>
    	<xsl:with-param name="key2Column">tabname</xsl:with-param>
    	<xsl:with-param name="key2Value"><xsl:value-of select="@TABNAME"/></xsl:with-param>
	</xsl:call-template>
	<xsl:apply-templates select="columns"/>
	<xsl:apply-templates select="primaryKey"/>
	<xsl:apply-templates select="foreignKeys"/>
	<xsl:apply-templates select="indices"/>
	<xsl:apply-templates select="grants"/>
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="columns">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;columns&lt;/description&gt;
		<xsl:apply-templates select="column"/>
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="primaryKey">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;Primary Key&lt;/description&gt;
		<xsl:apply-templates select="column"/>
		<xsl:apply-templates select="siblings"/>
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="foreignKeys">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;Foreign Key&lt;/description&gt;
		<xsl:apply-templates select="parent"/>
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="indices">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;Indices&lt;/description&gt;
		<xsl:apply-templates select="index"/>
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="index">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;<xsl:value-of select="@INDSCHEMA"/>.<xsl:value-of select="@INDNAME"/>&lt;/description&gt;
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="grants">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;Grants&lt;/description&gt;
		<xsl:apply-templates select="grant"/>
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="grant">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;<xsl:value-of select="@GRANTEETYPE"/> <xsl:value-of select="@GRANTEE"/> SIUD:<xsl:value-of select="@SELECTAUTH"/><xsl:value-of select="@INSERTAUTH"/><xsl:value-of select="@UPDATEAUTH"/><xsl:value-of select="@DELETEAUTH"/> CAI:<xsl:value-of select="@CONTROLAUTH"/><xsl:value-of select="@ALTERAUTH"/><xsl:value-of select="@INDEXAUTH"/>&lt;/description&gt;
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="parent">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;<xsl:value-of select="@CONSTNAME"/>.<xsl:value-of select="@REFTABSCHEMA"/>.<xsl:value-of select="@REFTABNAME"/>&lt;/description&gt;
		<xsl:call-template name="menuBranchSQLXML">
    		<xsl:with-param name="description">Parent</xsl:with-param>
      		<xsl:with-param name="sqlxml">queryfiles/predefined/Table2XML.sql</xsl:with-param>
  			<xsl:with-param name="predicate">TABSCHEMA='<xsl:value-of select="@REFTABSCHEMA"/>' and TABNAME='<xsl:value-of select="@REFTABNAME"/>'</xsl:with-param>
  			<xsl:with-param name="xsl">XSL/table2Menu</xsl:with-param>
  			<xsl:with-param name="dropParent">true</xsl:with-param>
		</xsl:call-template>	
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="siblings">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;Children&lt;/description&gt;
		<xsl:apply-templates select="child"/>
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="child">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;<xsl:value-of select="@CONSTNAME"/>.<xsl:value-of select="@TABSCHEMA"/>.<xsl:value-of select="@TABNAME"/>&lt;/description&gt;
		<xsl:call-template name="menuBranchSQLXML">
    		<xsl:with-param name="description">Table</xsl:with-param>
      		<xsl:with-param name="sqlxml">queryfiles/predefined/Table2XML.sql</xsl:with-param>
  			<xsl:with-param name="predicate">TABSCHEMA='<xsl:value-of select="@TABSCHEMA"/>' and TABNAME='<xsl:value-of select="@TABNAME"/>'</xsl:with-param>
  			<xsl:with-param name="xsl">XSL/table2Menu</xsl:with-param>
  			<xsl:with-param name="dropParent">true</xsl:with-param>
		</xsl:call-template>	
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="column">
	<xsl:call-template name="menuLeaf">
    	<xsl:with-param name="description"><xsl:value-of select="@COLNAME"/></xsl:with-param>
    	<xsl:with-param name="table">colcat</xsl:with-param>
    	<xsl:with-param name="key1Column">tabschema</xsl:with-param>
    	<xsl:with-param name="key1Value"><xsl:value-of select="../../@TABSCHEMA"/></xsl:with-param>
    	<xsl:with-param name="key2Column">tabname</xsl:with-param>
    	<xsl:with-param name="key2Value"><xsl:value-of select="../../@TABNAME"/></xsl:with-param>
    	<xsl:with-param name="key2Column">colname</xsl:with-param>
    	<xsl:with-param name="key2Value"><xsl:value-of select="@COLNAME"/></xsl:with-param>
	</xsl:call-template>
</xsl:template>


<!-- =================================================================================================== -->

<xsl:template name="menuEmbeddedBranch">
  <xsl:param name="description"/>
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;<xsl:value-of select="$description"/>&lt;/description&gt;
		<xsl:apply-templates select="*"/>
	&lt;/menu&gt;
</xsl:template>

<xsl:template name="menuLeaf">
  <xsl:param name="description"/>
  <xsl:param name="table"/>
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
								&lt;parameter name="action"&gt;display&lt;/parameter&gt;
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
	&lt;menu type="branch" 
		branchSQLXML="<xsl:value-of select="$sqlxml"/>" 
		branchSQLPredicate="<xsl:value-of select="$predicate"/>" 
		branchXSL="<xsl:value-of select="$xsl"/>" 
		delayLoad="mouse"&gt;
		&lt;description&gt;<xsl:value-of select="$description"/>&lt;/description&gt;
	&lt;/menu&gt;
</xsl:template>

</xsl:stylesheet>	