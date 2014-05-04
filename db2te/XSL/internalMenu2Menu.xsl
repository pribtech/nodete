<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
 <!--
  Author: Peter Prib
  
  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2013 All rights reserved.

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
<xsl:param name="id">r</xsl:param>

<xsl:template match="/">
	<xsl:element name="folder">
		<xsl:attribute name="id"><xsl:value-of select="$id"/></xsl:attribute>
		<xsl:attribute name="onClick">hideChildren</xsl:attribute>
		<xsl:apply-templates select="elementSubNodes"><xsl:with-param name="parentId"><xsl:value-of select="$id"/></xsl:with-param></xsl:apply-templates>
	</xsl:element>
</xsl:template>

<xsl:template match="jsonArrayElement">
	<xsl:param name="parent"/>
	<xsl:param name="parentId"/>

	<xsl:choose>
		<xsl:when test="$parent = 'elementSubNodes' ">
	 		<xsl:call-template name="elementSubNodesDetails"><xsl:with-param name="parentId"><xsl:value-of select="$parentId"/></xsl:with-param></xsl:call-template>
		</xsl:when>
		<xsl:when test=" $parentId = '' ">
			<xsl:copy>
				<xsl:apply-templates select="@*|node()"/>
			</xsl:copy>
		</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="*"><xsl:with-param name="parentId"><xsl:value-of select="$parentId"/></xsl:with-param></xsl:apply-templates>
		</xsl:otherwise>
	</xsl:choose>

</xsl:template>

<xsl:template match="elementSubNodes">
	<xsl:param name="parentId"/>
	<xsl:choose>
 		<xsl:when test="count(./jsonArrayElement)>0">
			<xsl:apply-templates select="jsonArrayElement">
				<xsl:with-param name="parent">elementSubNodes</xsl:with-param>
				<xsl:with-param name="parentId">
					<xsl:value-of select="$parentId"/>
				</xsl:with-param>
			</xsl:apply-templates>
		</xsl:when>
		<xsl:otherwise>
	 		<xsl:call-template name="elementSubNodesDetails"><xsl:with-param name="parentId"><xsl:value-of select="$parentId"/></xsl:with-param></xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>
 
<xsl:template match="@*|node()">
	<xsl:copy>
		<xsl:apply-templates select="@*|node()"/>
	</xsl:copy>
</xsl:template>

<xsl:template name="sharedAttributes">
	<xsl:attribute name="title"><xsl:value-of select="@elementValue"/></xsl:attribute>
	<xsl:attribute name="DBMS"><xsl:value-of select="@DBMS"/></xsl:attribute>
	<xsl:attribute name="feature"><xsl:value-of select="@feature"/></xsl:attribute>
	<xsl:attribute name="NoFeature"><xsl:value-of select="@noFeature"/></xsl:attribute>
	<xsl:attribute name="minVersion"><xsl:value-of select="@minVersion"/></xsl:attribute>
	<xsl:attribute name="minFixpak"><xsl:value-of select="@minFixpak"/></xsl:attribute>
	<xsl:attribute name="maxVersion"><xsl:value-of select="@maxVersion"/></xsl:attribute>
	<xsl:attribute name="maxFixpak"><xsl:value-of select="@maxFixpak"/></xsl:attribute>
	<xsl:attribute name="context"><xsl:value-of select="@context"/></xsl:attribute>
	<xsl:attribute name="notContext"><xsl:value-of select="@notContext"/></xsl:attribute>
	<xsl:attribute name="node__shape"><xsl:value-of select="@node__shape"/></xsl:attribute>
	<xsl:attribute name="node__image"><xsl:value-of select="@node__image"/></xsl:attribute>
</xsl:template>

<xsl:template name="elementSubNodesDetails">
	<xsl:param name="parentId"/>
	<xsl:variable name="id"><xsl:value-of select="concat($parentId,concat('i',position()))"/></xsl:variable>
	<xsl:choose>
		<xsl:when test="@nodeType = 'LINE'" />
		<xsl:when test="@nodeType = 'DELAYLOADBRANCH'">
			<xsl:element name="folderClosed">
				<xsl:attribute name="id"><xsl:value-of select="$id"/></xsl:attribute>
				<xsl:call-template name="sharedAttributes"/>
				<xsl:attribute name="onClick">loadChildren</xsl:attribute>
				<xsl:attribute name="rootCallBack"><xsl:value-of select="@rootCallBack"/><xsl:value-of select="rootCallBack/text()"/></xsl:attribute>
			</xsl:element>
		</xsl:when>	
		<xsl:when test="@nodeType = 'BRANCH'">
			<xsl:element name="folder">
				<xsl:attribute name="id"><xsl:value-of select="$id"/></xsl:attribute>
				<xsl:call-template name="sharedAttributes"/>
				<xsl:attribute name="onClick">hideChildren</xsl:attribute>
				<xsl:apply-templates select='elementSubNodes'><xsl:with-param name="parentId"><xsl:value-of select="$id"/></xsl:with-param></xsl:apply-templates>
			</xsl:element>
		</xsl:when>	
		<xsl:when test="@nodeType='LEAF'">
			<xsl:element name="leaf">
				<xsl:attribute name="id"><xsl:value-of select="$id"/></xsl:attribute>
				<xsl:call-template name="sharedAttributes"/>
				<xsl:attribute name="onClick">processMenuLeaf</xsl:attribute>
				<xsl:attribute name="node__showChildren">false</xsl:attribute>
				<xsl:apply-templates select="node()"/>
			</xsl:element>
		</xsl:when>	
		<xsl:when test="@nodeType='TABLE'">
			<xsl:element name="table">
				<xsl:attribute name="id"><xsl:value-of select="$id"/></xsl:attribute>
				<xsl:attribute name="table"><xsl:value-of select="@table"/></xsl:attribute>
				<xsl:call-template name="sharedAttributes"/>
				<xsl:attribute name="onClick">loadTableMenu</xsl:attribute>
				<xsl:attribute name="node__showChildren">false</xsl:attribute>
				<xsl:apply-templates select="node()"/>
			</xsl:element>
		</xsl:when>	
		<xsl:otherwise>
			<xsl:element name="unknownType"><xsl:attribute name="nodeType"><xsl:value-of select="@nodeType"/></xsl:attribute></xsl:element>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>	