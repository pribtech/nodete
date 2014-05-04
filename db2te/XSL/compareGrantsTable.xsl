<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="text"/>
<!--
  Author: Peter Prib
  
  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2010 All rights reserved.

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
<xsl:param name="delimiter">@</xsl:param>
<xsl:param name="table"/>
<xsl:param name="schema"/>
<xsl:template match="/">
-- generated script : <xsl:value-of select="count(differences/row)"/> statements  
<xsl:apply-templates select="differences"/>
-- end generated script
</xsl:template>
<xsl:template match="differences"><xsl:apply-templates select="row"/>
</xsl:template>

<xsl:template match="row"><xsl:choose>
	<xsl:when test="@action = 'insert'">
<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'ALTER'"/></xsl:call-template>
<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'CONTROL'"/></xsl:call-template>
<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'DELETE'"/></xsl:call-template>
<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'INDEX'"/></xsl:call-template>
<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'INSERT'"/></xsl:call-template>
<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'REF'"/></xsl:call-template>
<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'SELECT'"/></xsl:call-template>
<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'UPDATE'"/></xsl:call-template>
  	</xsl:when>
	<xsl:when test="@action = 'delete'">
<xsl:call-template name="revokeAuthType"><xsl:with-param name="auth" select="'ALTER'"/></xsl:call-template>
<xsl:call-template name="revokeAuthType"><xsl:with-param name="auth" select="'CONTROL'"/></xsl:call-template>
<xsl:call-template name="revokeAuthType"><xsl:with-param name="auth" select="'DELETE'"/></xsl:call-template>
<xsl:call-template name="revokeAuthType"><xsl:with-param name="auth" select="'INDEX'"/></xsl:call-template>
<xsl:call-template name="revokeAuthType"><xsl:with-param name="auth" select="'INSERT'"/></xsl:call-template>
<xsl:call-template name="revokeAuthType"><xsl:with-param name="auth" select="'REF'"/></xsl:call-template>
<xsl:call-template name="revokeAuthType"><xsl:with-param name="auth" select="'SELECT'"/></xsl:call-template>
<xsl:call-template name="revokeAuthType"><xsl:with-param name="auth" select="'UPDATE'"/></xsl:call-template>
	</xsl:when>
	<xsl:when test="@action = 'update'"></xsl:when>
<!--	<xsl:otherwise>-->
<!-- 	*** error <xsl:value-of select="@action"/> table <xsl:apply-template select="key"/>-->
<!--	</xsl:otherwise>-->
</xsl:choose>
</xsl:template>

<!--<xsl:template match="key">-->
<!--<xsl:value-of select="."/><xsl:if test="not(position()=last())"> , </xsl:if></xsl:template>-->

<xsl:template name="granteetype">
<xsl:param name="granteetype"><xsl:value-of select="key[@name ='GRANTEETYPE']/text()"/></xsl:param>
<xsl:param name="grantee"><xsl:value-of select="key[@name ='GRANTEE']/text()"/></xsl:param>
<xsl:choose>
	<xsl:when test="$grantee = 'PUBLIC  '"><xsl:value-of select="$grantee"/></xsl:when>
	<xsl:when test="$granteetype = 'G' and not($grantee = 'PUBLIC  ')">GROUP <xsl:value-of select="$grantee"/></xsl:when>
	<xsl:when test="$granteetype = 'R'">ROLE <xsl:value-of select="$grantee"/></xsl:when>
	<xsl:when test="$granteetype = 'U'">USER <xsl:value-of select="$grantee"/></xsl:when>
	<xsl:otherwise>????  <xsl:value-of select="$granteetype"/> <xsl:value-of select="$grantee"/></xsl:otherwise>
</xsl:choose>
</xsl:template>

<xsl:template name="grantAuthType">
<xsl:param name="auth"/>
<xsl:variable name="authLevel" select="data[@name = concat($auth,'AUTH')]/new/text()"/>
<xsl:choose>
	<xsl:when test="$authLevel = 'Y'">
GRANT <xsl:call-template name="authText"><xsl:with-param name="value" select="$auth"/></xsl:call-template> on <xsl:call-template name="tableRef"/></xsl:when>
	<xsl:when test="$authLevel = 'G'">
GRANT <xsl:call-template name="authText"><xsl:with-param name="value" select="$auth"/></xsl:call-template> on <xsl:call-template name="tableRef"><xsl:with-param name="with" select="'WITH GRANT OPTION'"/></xsl:call-template></xsl:when>
	<xsl:when test="$authLevel = 'N'"></xsl:when>
	<xsl:otherwise>
???? $granteetype</xsl:otherwise>
</xsl:choose>
</xsl:template>

<xsl:template name="authText">
<xsl:param name="value">???</xsl:param>
<xsl:choose>
	<xsl:when test="$value = 'REF'">REFERENCES</xsl:when>
	<xsl:otherwise><xsl:value-of select="$value"/></xsl:otherwise>
</xsl:choose>
</xsl:template>

<xsl:template name="tableRef">
<xsl:param name="with"></xsl:param><xsl:param name="toFrom">to</xsl:param>table "<xsl:value-of select="key[@name ='TABSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='TABNAME']/text()"/>" <xsl:value-of select="concat($toFrom,' ')"/><xsl:call-template name="granteetype"/><xsl:value-of select="$with"/><xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="revokeAuthType">
<xsl:param name="auth"/>
<xsl:variable name="authLevel" select="data[@name = concat($auth,'AUTH')]/text()"/>
<xsl:choose>
	<xsl:when test="$authLevel = 'Y'">
REVOKE <xsl:call-template name="authText"><xsl:with-param name="value" select="$auth"/></xsl:call-template> from <xsl:call-template name="tableRef"><xsl:with-param name="toFrom" select="'from'"/></xsl:call-template></xsl:when>
	<xsl:when test="$authLevel = 'G'">
REVOVE <xsl:call-template name="authText"><xsl:with-param name="value" select="$auth"/></xsl:call-template> from <xsl:call-template name="tableRef"><xsl:with-param name="with" select="'WITH GRANT OPTION'"/><xsl:with-param name="toFrom" select="'from'"/></xsl:call-template></xsl:when>
	<xsl:when test="$authLevel = 'N'"></xsl:when>
	<xsl:when test="string-length($authLevel) = 0"></xsl:when>
	<xsl:otherwise>
-- ???? "<xsl:value-of select="$authLevel"/>"
	</xsl:otherwise>
</xsl:choose>
</xsl:template>

</xsl:stylesheet>
