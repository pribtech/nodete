<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="html"/>

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
		<xsl:apply-templates select="*"/>
</xsl:template>

<xsl:template match="*">
	<table border="1">
		<tr><th><xsl:value-of select="name()"/></th>
   			<xsl:if test=" count(@*)>0">
				<td>
					<table>
						<tr>
							<xsl:for-each select="@*">
		    					<xsl:if test=" not (. = '' or substring(local-name(),1,6) = 'node__')">
									<th><xsl:value-of select="local-name()"/></th>
								</xsl:if>
							</xsl:for-each>
						</tr>
						<tr>
							<xsl:for-each select="@*">
		    					<xsl:if test=" not (. = '' or substring(local-name(),1,6) = 'node__')">
									<td><xsl:value-of select="."/></td>
								</xsl:if>
							</xsl:for-each>
						</tr>
					</table>
				</td>
			</xsl:if>
		</tr>
		<tr>
			<td></td><td><xsl:apply-templates select="*"/></td>
		</tr>
		<xsl:if test="not ((normalize-space(.) = '' or normalize-space(.) = '&#10;'))">
			<tr>
				<td></td><td><xsl:value-of select="."/></td>
			</tr>
		</xsl:if>	
	</table>
</xsl:template>

</xsl:stylesheet>	