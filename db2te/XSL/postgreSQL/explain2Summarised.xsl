<?xml version="1.0" encoding="UTF-8"?>
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
  <xsl:template match="@*|node()">
    <xsl:if test="not (self::text() and (normalize-space(.) = '' or normalize-space(.) = '&#10;'))">
      <xsl:choose>
        <xsl:when test="name()='Alias'"><xsl:attribute name="alias"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='explain'"><xsl:apply-templates select="@*|node()"/></xsl:when>
        <xsl:when test="name()='Function-Call'"><xsl:attribute name="FunctionCall"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Function-Name'"><xsl:attribute name="FunctionName"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Hash-Cond'"><xsl:attribute name="hashCond"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Index-Name'"><xsl:attribute name="indexName"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Index-Cond'"><xsl:attribute name="indexCond"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Item'"><xsl:attribute name="{concat(name(),position())}"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Join-Type'"><xsl:attribute name="joinType"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Node-Type'"><xsl:attribute name="nodeType"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Parent-Relationship'"><xsl:attribute name="parentRelationship"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Plan-Rows'"><xsl:attribute name="planRows"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Plan-Width'"><xsl:attribute name="planWidth"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Relation-Name'"><xsl:attribute name="relationName"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Schema'"><xsl:attribute name="schema"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Scan-Direction'"><xsl:attribute name="scanDirection"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Startup-Cost'"><xsl:attribute name="startupCost"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Total-Cost'"><xsl:attribute name="totalCost"><xsl:value-of select="."/></xsl:attribute></xsl:when>
        <xsl:when test="name()='Plans'"><xsl:apply-templates select="@*|node()"/></xsl:when>
        <xsl:when test="name()='Plan'"><xsl:element name="{translate(child::*[name()='Node-Type']/text(),' ','')}"><xsl:apply-templates select="@*|node()"/></xsl:element></xsl:when>
        <xsl:when test="name()='Query'"><xsl:apply-templates select="@*|node()"/></xsl:when>
	    <xsl:otherwise>
	      <xsl:copy>
	        <xsl:apply-templates select="@*|node()"/>
	      </xsl:copy>
	    </xsl:otherwise>
      </xsl:choose>
    </xsl:if>
  </xsl:template>
</xsl:stylesheet>
