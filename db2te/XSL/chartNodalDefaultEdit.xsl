<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="html"/>

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
<xsl:param name="thisObject">notSet</xsl:param>
<xsl:param name="edit">true</xsl:param>

<xsl:template match="/">
		<xsl:apply-templates select="*"/>
</xsl:template>

<xsl:template match="*">
	<img onclick="swapDisplayNext(this)" src="images/icon-down-on.gif" name="expanded"/>
	<table>
		<tr style="height: 20px; background-color: rgb(241, 241, 241);"><td valign="top"><xsl:value-of select="name()"/></td>
			<td>
				<table>
					<xsl:for-each select="@*">
    					<xsl:if test=" not (. = '' or substring(local-name(),1,6) = 'node__')">
    						<tr>
								<td><xsl:choose>
										<xsl:when test="substring(local-name(),1,2) = '__'">
											<xsl:value-of select="substring(local-name(),3)"/>="<xsl:value-of select="."/>"
		 								</xsl:when>
										<xsl:otherwise><xsl:value-of select="local-name()"/></xsl:otherwise>
									</xsl:choose>
								</td>
								<td>:</td>
								<td><xsl:value-of select="."/></td>
						    </tr>
					    </xsl:if>
					</xsl:for-each>
				</table>
			</td>
		</tr>
		<xsl:if test="$edit = 'true'">
		    <tr><td></td>
		    	<td style="display:inline;">
		    		<table>
		    			<tr>
		    				<td>
						   	 	<xsl:element name="input">
		    						<xsl:attribute name="name"><xsl:value-of select="@node__Id"/></xsl:attribute>
		    						<xsl:attribute name="type">button</xsl:attribute>
		    						<xsl:attribute name="value">update</xsl:attribute>
									<xsl:attribute name="onclick"><xsl:value-of select="$thisObject"/>.updateNode(<xsl:value-of select="@node__Id"/>,event)</xsl:attribute>
								</xsl:element>
							</td><td>
		    					<xsl:element name="input">
		    						<xsl:attribute name="name"><xsl:value-of select="@node__Id"/></xsl:attribute>
		    						<xsl:attribute name="type">button</xsl:attribute>
		    						<xsl:attribute name="value">delete</xsl:attribute>
									<xsl:attribute name="onclick"><xsl:value-of select="$thisObject"/>.deleteNode(<xsl:value-of select="@node__Id"/>,event)</xsl:attribute>
								</xsl:element>
							</td><td>
			   				 	<xsl:element name="input">
		    						<xsl:attribute name="name"><xsl:value-of select="@node__Id"/></xsl:attribute>
		    						<xsl:attribute name="type">button</xsl:attribute>
		   			 				<xsl:attribute name="value">add child</xsl:attribute>
									<xsl:attribute name="onclick"><xsl:value-of select="$thisObject"/>.addChildNode(<xsl:value-of select="@node__Id"/>,event)</xsl:attribute>
								</xsl:element>
							</td>
		    			</tr>
					</table>
				</td>
		    </tr>
	    </xsl:if>
		<tr>
			<td></td><td><xsl:apply-templates select="*"/></td>
		</tr>
	</table>
</xsl:template>

</xsl:stylesheet>	






