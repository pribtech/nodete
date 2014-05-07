<?xml version="1.0" encoding="ISO-8859-1"?>
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

<xsl:template match="/">
	<xsl:apply-templates select="connectManagerNodes"/>
</xsl:template>

<xsl:template match="connectManagerNodes">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;Nodes&lt;/description&gt;
		<xsl:apply-templates select="node"/>
		<xsl:call-template name="connect"/>
		&lt;menu   type="leaf" branchDirectory=""&gt; 
			&lt;description&gt;Rebuild List&lt;/description&gt;
			&lt;actionScript name="reset"&gt;
				&lt;task&gt;
					&lt;action name="rebuildConnectionProfile" type="serverAction"&gt;
						&lt;parameterList&gt;
							&lt;parameter name="action" type="raw"&gt;
								&lt;value&gt;rebuildConnectionProfile&lt;/value&gt;
							&lt;/parameter&gt;
						&lt;/parameterList&gt;
					&lt;/action&gt;
					&lt;panelReload/&gt;
				&lt;/task&gt;
			&lt;/actionScript&gt;
		&lt;/menu&gt;
		<xsl:call-template name="connectProfile">
			<xsl:with-param name="menuDescription">Session sign-on</xsl:with-param>
		</xsl:call-template>
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="node">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;<xsl:value-of select="@id"/>&lt;/description&gt;
		<xsl:apply-templates select="instances"/>
		<xsl:call-template name="connectProfile">
			<xsl:with-param name="uri"><xsl:value-of select="@id"/></xsl:with-param>
			<xsl:with-param name="user"><xsl:value-of select="/user/@id"/></xsl:with-param>
		</xsl:call-template>
		<xsl:call-template name="setDefaultConnection">
			<xsl:with-param name="uri"><xsl:value-of select="@id"/></xsl:with-param>
		</xsl:call-template>
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="instances">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;Instances&lt;/description&gt;
		<xsl:apply-templates select="instance"/>
		<xsl:call-template name="connect">
			<xsl:with-param name="hostname"><xsl:value-of select="../@id"/></xsl:with-param>
		</xsl:call-template>
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="instance">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;<xsl:value-of select="@id"/>&lt;/description&gt;
		<xsl:apply-templates select="databases"/>
		<xsl:call-template name="connectProfile">
			<xsl:with-param name="uri"><xsl:value-of select="../../@id"/>:<xsl:value-of select="@id"/></xsl:with-param>
			<xsl:with-param name="user"><xsl:value-of select="user/@id"/></xsl:with-param>
		</xsl:call-template>
		<xsl:call-template name="setDefaultConnection">
			<xsl:with-param name="uri"><xsl:value-of select="../../@id"/>:<xsl:value-of select="@id"/></xsl:with-param>
		</xsl:call-template>
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="databases">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;databases&lt;/description&gt;
		<xsl:apply-templates select="database"/>
		<xsl:call-template name="connect">
			<xsl:with-param name="port"><xsl:value-of select="../@id"/></xsl:with-param>
			<xsl:with-param name="hostname"><xsl:value-of select="../../../@id"/></xsl:with-param>
		</xsl:call-template>
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="database">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;<xsl:value-of select="@id"/>&lt;/description&gt;
		<xsl:apply-templates select="users"/>
		<xsl:call-template name="connectProfile">
			<xsl:with-param name="uri"><xsl:value-of select="../../../../@id"/>:<xsl:value-of select="../../@id"/>/<xsl:value-of select="@id"/></xsl:with-param>
		</xsl:call-template>
	&lt;/menu&gt;
</xsl:template>

<xsl:template match="users">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;users&lt;/description&gt;
		<xsl:apply-templates select="databaseUser"/>
		<xsl:call-template name="connect">
			<xsl:with-param name="database"><xsl:value-of select="../@id"/></xsl:with-param>
			<xsl:with-param name="port"><xsl:value-of select="../../../@id"/></xsl:with-param>
			<xsl:with-param name="hostname"><xsl:value-of select="../../../../../@id"/></xsl:with-param>
		</xsl:call-template>
 	&lt;/menu&gt;
</xsl:template>

<xsl:template match="databaseUser">
	&lt;menu type="embeddedBranch"&gt;
		&lt;description&gt;<xsl:value-of select="@id"/>&lt;/description&gt;
		<xsl:call-template name="connect">
			<xsl:with-param name="menuDescription">Connect</xsl:with-param>
			<xsl:with-param name="database"><xsl:value-of select="../../@id"/></xsl:with-param>
			<xsl:with-param name="port"><xsl:value-of select="../../../../@id"/></xsl:with-param>
			<xsl:with-param name="hostname"><xsl:value-of select="../../../../../../@id"/></xsl:with-param>
			<xsl:with-param name="user"><xsl:value-of select="@id"/></xsl:with-param>
			<xsl:with-param name="description"><xsl:value-of select="@description"/></xsl:with-param>
			<xsl:with-param name="comment"><xsl:value-of select="@comment"/></xsl:with-param>
		</xsl:call-template>
	&lt;/menu&gt;
</xsl:template>


<xsl:template name="connect">
	<xsl:param name="menuDescription">New Connection</xsl:param>
	<xsl:param name="authenicated"/>
	<xsl:param name="comment"/>
	<xsl:param name="description"/>
	<xsl:param name="database"/>
	<xsl:param name="group"/>
	<xsl:param name="hostname"/>
	<xsl:param name="password"/>
	<xsl:param name="port"/>
	<xsl:param name="status"/>
	<xsl:param name="user"/>
	&lt;menu type="leaf"&gt; 
		&lt;description&gt;<xsl:value-of select="$menuDescription"/>&lt;/description&gt;
		&lt;actionScript name="connect"&gt;
			&lt;task&gt;
				<xsl:call-template name="assign">
					<xsl:with-param name="name">TE_DATABASE_AUTHENTICATED</xsl:with-param>
					<xsl:with-param name="value"><xsl:value-of select="$authenicated"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="assign">
					<xsl:with-param name="name">TE_DATABASE_LOGIN_DESCRIPTION</xsl:with-param>
					<xsl:with-param name="value"><xsl:value-of select="$description"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="assign">
					<xsl:with-param name="name">TE_DATABASE_LOGIN_COMMENT</xsl:with-param>
					<xsl:with-param name="value"><xsl:value-of select="$comment"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="assign">
					<xsl:with-param name="name">TE_DATABASE_LOGIN_DATABASE</xsl:with-param>
					<xsl:with-param name="value"><xsl:value-of select="$database"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="assign">
					<xsl:with-param name="name">TE_DATABASE_LOGIN_HOSTNAME</xsl:with-param>
					<xsl:with-param name="value"><xsl:value-of select="$hostname"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="assign">
					<xsl:with-param name="name">TE_DATABASE_LOGIN_PORTNUMBER</xsl:with-param>
					<xsl:with-param name="value"><xsl:value-of select="$port"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="assign">
					<xsl:with-param name="name">TE_DATABASE_LOGIN_GROUP</xsl:with-param>
					<xsl:with-param name="value"><xsl:value-of select="$group"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="assign">
					<xsl:with-param name="name">TE_DATABASE_LOGIN_USERNAME</xsl:with-param>
					<xsl:with-param name="value"><xsl:value-of select="$user"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="assign">
					<xsl:with-param name="name">TE_DATABASE_LOGIN_PASSWORD</xsl:with-param>
					<xsl:with-param name="value"><xsl:value-of select="$password"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="assign">
					<xsl:with-param name="name">TE_DATABASE_CONNECTION_STATUS</xsl:with-param>
					<xsl:with-param name="value"><xsl:value-of select="$status"/></xsl:with-param>
				</xsl:call-template>
				&lt;callGlobalAction name="DB_CONNECTION_SET_CONNECTION_SCRIPT"/&gt;
				&lt;assignSharedConstant name="returnValue" type="returnObject"&gt;
					&lt;value&gt;ACTIVE_DATABASE_CONNECTION&lt;/value&gt;
				&lt;/assignSharedConstant&gt;
				&lt;panelReload/&gt;
			&lt;/task&gt;
    	&lt;/actionScript&gt;
	&lt;/menu&gt;
</xsl:template>

<xsl:template name="connectProfile">
	<xsl:param name="menuDescription">Set User</xsl:param>
	<xsl:param name="user"/>
	<xsl:param name="uri"/>
	&lt;menu type="leaf"&gt; 
		&lt;description&gt;<xsl:value-of select="$menuDescription"/>&lt;/description&gt;
		&lt;actionScript name="connect"&gt;
			&lt;task&gt;
				<xsl:call-template name="assign">
					<xsl:with-param name="name">LOGIN_URI</xsl:with-param>
					<xsl:with-param name="value"><xsl:value-of select="$uri"/></xsl:with-param>
				</xsl:call-template>
				<xsl:call-template name="assign">
					<xsl:with-param name="name">LOGIN_USERNAME</xsl:with-param>
					<xsl:with-param name="value"><xsl:value-of select="$user"/></xsl:with-param>
				</xsl:call-template>
				&lt;callGlobalAction name="connectionSignon"/&gt;
			&lt;/task&gt;
    	&lt;/actionScript&gt;
	&lt;/menu&gt;
</xsl:template>

<xsl:template name="assign">
	<xsl:param name="name"/>
	<xsl:param name="value"/>
	&lt;assignSharedConstant name="<xsl:value-of select="$name"/>" type="fixed"&gt;
		&lt;value&gt;&lt;![CDATA[<xsl:value-of select="$value"/>]]&gt;&lt;/value&gt;
	&lt;/assignSharedConstant&gt;
</xsl:template>


<xsl:template name="setDefaultConnection">
	<xsl:param name="uri"/>
	&lt;menu type="leaf"&gt; 
		&lt;description&gt;set default&lt;/description&gt;
		&lt;JSAction&gt;&lt;![CDATA[onclick="ACTIVE_DATABASE_CONNECTION='<xsl:value-of select="$uri"/>';GLOBAL_CONSTANTS.set('ACTIVE_DATABASE_CONNECTION', ACTIVE_DATABASE_CONNECTION);ALL_GLOBAL_OBJECT('reloadIfRequired',null,'panel');"]]&gt;&lt;/JSAction&gt;
	&lt;/menu&gt;
</xsl:template>

</xsl:stylesheet>	