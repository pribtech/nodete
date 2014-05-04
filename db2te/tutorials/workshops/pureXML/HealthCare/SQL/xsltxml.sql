<!-- XSLT Style Sheet -->
<?xml version="1.0"?>
<xsl:stylesheet version="1.0" 
xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:n3="http://www.w3.org/1999/xhtml" xmlns:n1="ns1" 
xmlns:n2="ns2" xmlns:voc="ns3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<xsl:output method="html" indent="yes" version="4.01" encoding="ISO-8859-1" doctype-public="-//W3C//DTD HTML 4.01//EN"/>

<!-- PMD document -->

<xsl:variable name="tableWidth">50%</xsl:variable>

<xsl:variable name="title">
    <xsl:choose>
         <xsl:when test="/n1:ClinicalDocument/n1:title">
             <xsl:value-of select="/n1:ClinicalDocument/n1:title"/>
         </xsl:when>
             <xsl:otherwise>Clinical Document</xsl:otherwise>
    </xsl:choose>
</xsl:variable>

<xsl:template match="/">
<xsl:apply-templates select="n1:ClinicalDocument"/>
</xsl:template>

<xsl:template match="n1:ClinicalDocument">
        <html>
            <head>
		<!-- <meta name='Generator' content='&PMD-Stylesheet;'/> -->
                <xsl:comment>
                        Do NOT edit this HTML directly, it was generated via an XSLt
                        transformation from the original release 2 PMD Document.
                </xsl:comment>
                <title>
                     <xsl:value-of select="$title"/>
                </title>
	    </head>
            <xsl:comment>				
					Clinical data
            </xsl:comment>
            <body>            

                <h2 align="center"><xsl:value-of select="$title"/></h2>
		<table width='100%'>
		   <tr><td width='10%'><big><b><xsl:text>Patient: </xsl:text></b></big></td>
		       <td width='40%'><big><xsl:call-template name="getName">
   		                            <xsl:with-param name="name" 
 		                     select="/n1:ClinicalDocument/n1:recordTarget/n1:patientRole/n1:patient/n1:name"/>
                                 </xsl:call-template></big></td>
                       <td width='25%' align='right'><b><xsl:text>MRN: </xsl:text></b></td>
		       <td width='25%'><xsl:value-of select="/n1:ClinicalDocument/n1:recordTarget/n1:patientRole/n1:id/@extension"/></td>		       
		   </tr>

		   <tr><td width='10%'><b><xsl:text>Birthdate: </xsl:text></b></td>
                       <td width='40%'><xsl:call-template name="formatDate">
   		                       <xsl:with-param name="date" 
 		                select="/n1:ClinicalDocument/n1:recordTarget/n1:patientRole/n1:patient/n1:birthTime/@value"/>
                              </xsl:call-template></td>
                   <td width='25%' align='right'><b><xsl:text>Sex: </xsl:text></b></td>
		   <td width='25%'><xsl:variable name="sex" 
                                select="/n1:ClinicalDocument/n1:recordTarget/n1:patientRole/n1:patient/n1:administrativeGenderCode/@code"/>
                           <xsl:choose>
                               <xsl:when test="$sex='M'">Male</xsl:when>
                               <xsl:when test="$sex='F'">Female</xsl:when>
                           </xsl:choose></td>		       
		   </tr>

                   <tr><td width='10%'><b><xsl:text>Consultant: </xsl:text></b></td>
		       <td width='40%'>

                          <xsl:choose>
                               <xsl:when test="/n1:ClinicalDocument/n1:responsibleParty/n1:assignedEntity/n1:assignedPerson/n1:name">
                                <xsl:call-template name="getName">
        		               <xsl:with-param name="name" 
        		                    select="/n1:ClinicalDocument/n1:responsibleParty/n1:assignedEntity/n1:assignedPerson/n1:name"/>
                               </xsl:call-template>      
                               </xsl:when>
                               <xsl:otherwise>
                                  <xsl:call-template name="getName">
        		               <xsl:with-param name="name" 
        		                    select="/n1:ClinicalDocument/n1:legalAuthenticator/n1:assignedEntity/n1:assignedPerson/n1:name"/>
                               </xsl:call-template>  
                               </xsl:otherwise>
                          </xsl:choose> </td>
                       <td width='25%' align='right'><b><xsl:text>Created On: </xsl:text></b></td>
		       <td width='25%'><xsl:call-template name="formatDate">
   		                       <xsl:with-param name="date" 
 		                select="/n1:ClinicalDocument/n1:effectiveTime/@value"/>
                        </xsl:call-template></td>
		   </tr>
		</table>
		<br/>
		<xsl:apply-templates select="n1:component/n1:structuredBody"/> 
		<xsl:call-template name="bottomline"/>
            </body>
        </html>
</xsl:template>
    
<!-- Get a Name  -->
<xsl:template name="getName">
    <xsl:param name="name"/>
    <xsl:choose>
         <xsl:when test="$name/n1:family">
              <xsl:value-of select="$name/n1:given"/>
              <xsl:text> </xsl:text>
              <xsl:value-of select="$name/n1:family"/>
              <xsl:text> </xsl:text>
              <xsl:if test="$name/n1:suffix">
                  <xsl:text>, </xsl:text>
                  <xsl:value-of select="$name/n1:suffix"/>
              </xsl:if>
          </xsl:when>
          <xsl:otherwise>
               <xsl:value-of select="$name"/>
          </xsl:otherwise>
    </xsl:choose>
</xsl:template>

<!--  Format Date 
    
      outputs a date in Month Day, Year form
      e.g., 19991207  ==> December 07, 1999
-->
<xsl:template name="formatDate">
        <xsl:param name="date"/>
        <xsl:variable name="month" select="substring ($date, 5, 2)"/>
        <xsl:choose>
                <xsl:when test="$month='01'">
                        <xsl:text>January </xsl:text>
                </xsl:when>
                <xsl:when test="$month='02'">
                        <xsl:text>February </xsl:text>
                </xsl:when>
                <xsl:when test="$month='03'">
                        <xsl:text>March </xsl:text>
                </xsl:when>
                <xsl:when test="$month='04'">
                        <xsl:text>April </xsl:text>
                </xsl:when>
                <xsl:when test="$month='05'">
                        <xsl:text>May </xsl:text>
                </xsl:when>
                <xsl:when test="$month='06'">
                        <xsl:text>June </xsl:text>
                </xsl:when>
                <xsl:when test="$month='07'">
                        <xsl:text>July </xsl:text>
                </xsl:when>
                <xsl:when test="$month='08'">
                        <xsl:text>August </xsl:text>
                </xsl:when>
                <xsl:when test="$month='09'">
                        <xsl:text>September </xsl:text>
                </xsl:when>
                <xsl:when test="$month='10'">
                        <xsl:text>October </xsl:text>
                </xsl:when>
                <xsl:when test="$month='11'">
                        <xsl:text>November </xsl:text>
                </xsl:when>
                <xsl:when test="$month='12'">
                        <xsl:text>December </xsl:text>
                </xsl:when>
        </xsl:choose>
        <xsl:choose>
                <xsl:when test='substring ($date, 7, 1)="0"'>
                        <xsl:value-of select="substring ($date, 8, 1)"/>
                        <xsl:text>, </xsl:text>
                </xsl:when>
                <xsl:otherwise>
                        <xsl:value-of select="substring ($date, 7, 2)"/>
                        <xsl:text>, </xsl:text>
                </xsl:otherwise>
        </xsl:choose>
        <xsl:value-of select="substring ($date, 1, 4)"/>
</xsl:template>

<!-- StructuredBody -->
<xsl:template match="n1:component/n1:structuredBody">
		<xsl:apply-templates select="n1:component/n1:section"/>
</xsl:template>

<!-- Component/Section -->    
<xsl:template match="n1:component/n1:section">
	<xsl:apply-templates select="n1:title"/>
		
	<xsl:apply-templates select="n1:text"/>
					
        <xsl:apply-templates select="n1:component/n1:section"/>
     

</xsl:template>

<!--   Title  -->
<xsl:template match="n1:title">
	<h3><span style="font-weight:bold;">	
	<xsl:value-of select="."></xsl:value-of>
	</span></h3>
</xsl:template>

<!--   Text   -->
<xsl:template match="n1:text">	
	<xsl:apply-templates />	
</xsl:template>

<!--   paragraph  -->
<xsl:template match="n1:paragraph">
	<xsl:apply-templates/>
	<br/>
</xsl:template>

<!--     Content w/ deleted text is hidden -->
<xsl:template match="n1:content[@revised='delete']"/>

<!--   content  -->
<xsl:template match="n1:content">
	<xsl:apply-templates/>
</xsl:template>


<!--   list  -->
<xsl:template match="n1:list">
    <xsl:if test="n1:caption">
        <span style="font-weight:bold; ">
        <xsl:apply-templates select="n1:caption"/>
        </span>
    </xsl:if>
   <ul>
    <xsl:for-each select="n1:item">
	<li>
          <xsl:apply-templates />
	</li>
     </xsl:for-each>
    </ul>	
</xsl:template>

<xsl:template match="n1:list[@listType='ordered']">
    <xsl:if test="n1:caption">
        <span style="font-weight:bold; ">
        <xsl:apply-templates select="n1:caption"/>
        </span>
    </xsl:if>
   <ol>
    <xsl:for-each select="n1:item">
	<li>
          <xsl:apply-templates />
	</li>
     </xsl:for-each>
    </ol>	
</xsl:template>
	

<!--   caption  -->
<xsl:template match="n1:caption">  
	<xsl:apply-templates/>
	<xsl:text>: </xsl:text>
</xsl:template>
	
	<!--      Tables   -->
	<xsl:template match="n1:table/@*|n1:thead/@*|n1:tfoot/@*|n1:tbody/@*|n1:colgroup/@*|n1:col/@*|n1:tr/@*|n1:th/@*|n1:td/@*">
		<xsl:copy>
			<xsl:apply-templates/>
		</xsl:copy>
	</xsl:template>

	<xsl:template match="n1:table">
		<table>	
			<xsl:apply-templates/>
		</table>	
	</xsl:template>
	
	<xsl:template match="n1:thead">
		<thead>	
			<xsl:apply-templates/>
		</thead>	
	</xsl:template>

	<xsl:template match="n1:tfoot">
		<tfoot>	
			<xsl:apply-templates/>
		</tfoot>	
	</xsl:template>

	<xsl:template match="n1:tbody">
		<tbody>	
			<xsl:apply-templates/>
		</tbody>	
	</xsl:template>

	<xsl:template match="n1:colgroup">
		<colgroup>	
			<xsl:apply-templates/>
		</colgroup>	
	</xsl:template>

	<xsl:template match="n1:col">
		<col>	
			<xsl:apply-templates/>
		</col>	
	</xsl:template>

	<xsl:template match="n1:tr">
		<tr>	
			<xsl:apply-templates/>
		</tr>	
	</xsl:template>

	<xsl:template match="n1:th">
		<th>	
			<xsl:apply-templates/>
		</th>	
	</xsl:template>

	<xsl:template match="n1:td">
		<td>	
			<xsl:apply-templates/>
		</td>	
	</xsl:template>

	<xsl:template match="n1:table/n1:caption">
		<span style="font-weight:bold; ">	
			<xsl:apply-templates/>
		</span>	
	</xsl:template>

<!--   RenderMultiMedia 

         this currently only handles GIF's and JPEG's.  It could, however,
	 be extended by including other image MIME types in the predicate
	 and/or by generating <object> or <applet> tag with the correct
	 params depending on the media type  @ID  =$imageRef     referencedObject
 -->
     <xsl:template match="n1:renderMultiMedia">
	<xsl:variable name="imageRef" select="@referencedObject"/>
        <xsl:choose>
             <xsl:when test="//n1:regionOfInterest[@ID=$imageRef]">
             <!-- Here is where the Region of Interest image referencing goes -->
                  <xsl:if test='//n1:regionOfInterest[@ID=$imageRef]//n1:observationMedia/n1:value[@mediaType="image/gif" or @mediaType="image/jpeg"]'>
			<br clear='all'/>
		       <xsl:element name='img'>
			    <xsl:attribute name='src'>graphics/
				<xsl:value-of select='//n1:regionOfInterest[@ID=$imageRef]//n1:observationMedia/n1:value/n1:reference/@value'/>
			    </xsl:attribute>
		       </xsl:element>
	          </xsl:if>
             </xsl:when>
             <xsl:otherwise>
             <!-- Here is where the direct MultiMedia image referencing goes -->
                  <xsl:if test='//n1:observationMedia[@ID=$imageRef]/n1:value[@mediaType="image/gif" or @mediaType="image/jpeg"]'>
			<br clear='all'/>
		       <xsl:element name='img'>
			    <xsl:attribute name='src'>graphics/
				<xsl:value-of select='//n1:observationMedia[@ID=$imageRef]/n1:value/n1:reference/@value'/>
			    </xsl:attribute>
		       </xsl:element>
	          </xsl:if>              
             </xsl:otherwise>
        </xsl:choose>	
     </xsl:template>

<!-- 	Stylecode processing   
	  Supports Bold, Underline and Italics display

-->

	<xsl:template match="//n1:*[@styleCode]">

	<xsl:if test="@styleCode='Bold'">
	     <xsl:element name='b'>				
	          <xsl:apply-templates/>
	     </xsl:element>	
	</xsl:if> 

	<xsl:if test="@styleCode='Italics'">
	     <xsl:element name='i'>				
	          <xsl:apply-templates/>
	     </xsl:element>	
	</xsl:if>

	<xsl:if test="@styleCode='Underline'">
	     <xsl:element name='u'>				
	          <xsl:apply-templates/>
	     </xsl:element>	
	</xsl:if>

	   <xsl:if test="contains(@styleCode,'Bold') and contains(@styleCode,'Italics') and not (contains(@styleCode, 'Underline'))">
	     <xsl:element name='b'>
		<xsl:element name='i'>				
	          <xsl:apply-templates/>
		</xsl:element>
	     </xsl:element>	
	   </xsl:if>

	   <xsl:if test="contains(@styleCode,'Bold') and contains(@styleCode,'Underline') and not (contains(@styleCode, 'Italics'))">
	     <xsl:element name='b'>
		<xsl:element name='u'>				
	          <xsl:apply-templates/>
		</xsl:element>
	     </xsl:element>	
	   </xsl:if>

	   <xsl:if test="contains(@styleCode,'Italics') and contains(@styleCode,'Underline') and not (contains(@styleCode, 'Bold'))">
	     <xsl:element name='i'>
		<xsl:element name='u'>				
	          <xsl:apply-templates/>
		</xsl:element>
	     </xsl:element>	
	   </xsl:if>

	   <xsl:if test="contains(@styleCode,'Italics') and contains(@styleCode,'Underline') and contains(@styleCode, 'Bold')">
	     	<xsl:element name='b'>
		<xsl:element name='i'>
		<xsl:element name='u'>				
	            <xsl:apply-templates/>
		</xsl:element>
		</xsl:element>
	     	</xsl:element>	
	   </xsl:if>

	</xsl:template>

<!-- 	Superscript or Subscript   -->
	<xsl:template match="n1:sup">
	     <xsl:element name='sup'>				
	          <xsl:apply-templates/>
	     </xsl:element>	
	</xsl:template>
	<xsl:template match="n1:sub">
	     <xsl:element name='sub'>				
	          <xsl:apply-templates/>
	     </xsl:element>	
	</xsl:template>

	<!--  Bottomline  -->
     <xsl:template name="bottomline">
     <b><xsl:text>Signed by: </xsl:text></b>
	<xsl:call-template name="getName">
           <xsl:with-param name="name" 
                select="/n1:ClinicalDocument/n1:legalAuthenticator/n1:assignedEntity/n1:assignedPerson/n1:name"/>
        </xsl:call-template>
        <xsl:text> on </xsl:text>
	       <xsl:call-template name="formatDate">
   	           <xsl:with-param name="date" 
 	               select="//n1:ClinicalDocument/n1:legalAuthenticator/n1:time/@value"/>
        </xsl:call-template>
      </xsl:template>

</xsl:stylesheet>


<!--XML PMD document -->

<?xml version="1.0"?>
<?xml-stylesheet type="text/xsl" href="PMD.xsl"?>

<ClinicalDocument xmlns="ns1"  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<!-- 
********************************************************
  PMD Header
********************************************************
-->
	<typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
	<templateId root="2.16.840.1.113883.3.27.1776"/>
	<id extension="c266" root="2.16.840.1.113883.19.4"/>
	<code code="11488-4" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Consultation note"/>
	<title>Good Health Clinic Consultation Note</title>
	<effectiveTime value="20000407"/>
	<confidentialityCode code="N" codeSystem="2.16.840.1.113883.5.25"/>
	<languageCode code="en-US"/>
	<setId extension="BB35" root="2.16.840.1.113883.19.7"/>
	<versionNumber value="2"/>
	<recordTarget>
		<patientRole>
			<id extension="12345" root="2.16.840.1.113883.19.5"/>
			<patient>
				<name>
					<given>Henry</given>
					<family>Levin</family>
					<suffix>the 7th</suffix>
				</name>
				<administrativeGenderCode code="M" codeSystem="2.16.840.1.113883.5.1"/>
				<birthTime value="19320924"/>
			</patient>
			<providerOrganization>
				<id root="2.16.840.1.113883.19.5"/>
			</providerOrganization>
		</patientRole>
	</recordTarget>
	<author>
		<time value="2000040714"/>
		<assignedAuthor>
			<id extension="KP00017" root="2.16.840.1.113883.19.5"/>
			<assignedPerson>
				<name>
					<given>Robert</given>
					<family>Dolin</family>
					<suffix>MD</suffix>
				</name>
			</assignedPerson>
			<representedOrganization>
				<id root="2.16.840.1.113883.19.5"/>
			</representedOrganization>
		</assignedAuthor>
	</author>
	<custodian>
		<assignedCustodian>
			<representedCustodianOrganization>
				<id root="2.16.840.1.113883.19.5"/>
				<name>Good Health Clinic</name>
			</representedCustodianOrganization>
		</assignedCustodian>
	</custodian>
	<legalAuthenticator>
		<time value="20000408"/>
		<signatureCode code="S"/>
		<assignedEntity>
			<id extension="KP00017" root="2.16.840.1.113883.19.5"/>
			<assignedPerson>
				<name>
					<given>Robert</given>
					<family>Dolin</family>
					<suffix>MD</suffix>
				</name>
			</assignedPerson>
			<representedOrganization>
				<id root="2.16.840.1.113883.19.5"/>
			</representedOrganization>
		</assignedEntity>
	</legalAuthenticator>
	<relatedDocument typeCode="RPLC">
		<parentDocument>
			<id extension="a123" root="2.16.840.1.113883.19.4"/>
			<setId extension="BB35" root="2.16.840.1.113883.19.7"/>
			<versionNumber value="1"/>
		</parentDocument>
	</relatedDocument>
	<componentOf>
		<encompassingEncounter>
			<id extension="KPENC1332" root="2.16.840.1.113883.19.6"/>
			<effectiveTime value="20000407"/>
			<encounterParticipant typeCode="CON">
				<time value="20000407"/>
				<assignedEntity>
					<id extension="KP00017" root="2.16.840.1.113883.19.5"/>
					<assignedPerson>
						<name>
							<given>Robert</given>
							<family>Dolin</family>
							<suffix>MD</suffix>
						</name>
					</assignedPerson>
					<representedOrganization>
						<id root="2.16.840.1.113883.19.5"/>
					</representedOrganization>
				</assignedEntity>
			</encounterParticipant>
			<location>
				<healthCareFacility classCode="DSDLOC">
					<code code="GIM" codeSystem="2.16.840.1.113883.5.10588" displayName="General internal medicine clinic"/>
				</healthCareFacility>
			</location>
		</encompassingEncounter>
	</componentOf>
	<!-- 
********************************************************
  PMD Body
********************************************************
-->
	<component>
		<structuredBody>
			<!-- 
********************************************************
  History of Present Illness section
********************************************************
-->
			<component>
				<section>
					<code code="10164-2" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
					<title>History of Present Illness</title>
					<text>
						<content styleCode="Bold">Henry Levin, the 7<sup>th</sup>
						</content> is a 67 year old male referred for further asthma management. Onset of asthma in his <content revised="delete">twenties</content>
						<content revised="insert">teens</content>. He was hospitalized twice last year, and already twice this year. He has not been able to be weaned off steroids for the past several months. 
						</text>
				</section>
			</component>
			<!-- 
********************************************************
  Past Medical History section
********************************************************
-->
			<component>
				<section>
					<code code="10153-2" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
					<title>Past Medical History</title>
					<text>
						<list>
							<item>
								<content ID="a1">Asthma</content>
							</item>
							<item>
								<content ID="a2">Hypertension (see HTN.cda for details)</content>
							</item>
							<item>
								<content ID="a3">Osteoarthritis, 
									<content ID="a4">right knee</content>
								</content>
							</item>
						</list>
					</text>
					<entry>
						<observation classCode="COND" moodCode="EVN">
							<code code="195967001" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Asthma">
								<originalText>
									<reference value="#a1"/>
								</originalText>
							</code>
							<statusCode code="completed"/>
							<effectiveTime value="1950"/>
							<reference typeCode="XCRPT">
								<externalObservation>
									<id root="2.16.840.1.113883.19.1.2765"/>
								</externalObservation>
							</reference>
						</observation>
					</entry>
					<entry>
						<observation classCode="COND" moodCode="EVN">
							<code code="59621000" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="HTN">
								<originalText>
									<reference value="#a2"/>
								</originalText>
							</code>
							<statusCode code="completed"/>
							<reference typeCode="SPRT">
								<seperatableInd value="false"/>
								<externalDocument>
									<id root="2.16.840.1.113883.19.4.789"/>
									<text mediaType="multipart/related">
										<reference value="HTN.cda"/>
									</text>
									<setId root="2.16.840.1.113883.19.7.2465"/>
									<versionNumber value="1"/>
								</externalDocument>
							</reference>
							<reference typeCode="XCRPT">
								<externalObservation>
									<id root="2.16.840.1.113883.19.1.2005"/>
								</externalObservation>
							</reference>
						</observation>
					</entry>
					<entry>
						<observation classCode="COND" moodCode="EVN">
							<code xsi:type="CD" code="396275006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Osteoarthritis">
								<originalText>
									<reference value="#a3"/>
								</originalText>
							</code>
							<statusCode code="completed"/>
							<targetSiteCode code="49076000" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Knee joint">
								<originalText>
									<reference value="#a4"/>
								</originalText>
								<qualifier>
									<name code="78615007" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="with laterality"/>
									<value code="24028007" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="right"/>
								</qualifier>
							</targetSiteCode>
							<reference typeCode="XCRPT">
								<externalObservation>
									<id root="2.16.840.1.113883.19.1.1805"/>
								</externalObservation>
							</reference>
						</observation>
					</entry>
				</section>
			</component>
			<!-- 
********************************************************
  Medications section
********************************************************
-->
			<component>
				<section>
					<code code="10160-0" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
					<title>Medications</title>
					<text>
						<list>
							<item>Theodur 200mg BID</item>
							<item>Proventil inhaler 2puffs QID PRN</item>
							<item>Prednisone 20mg qd</item>
							<item>HCTZ 25mg qd</item>
						</list>
					</text>
					<entry>
						<substanceAdministration classCode="SBADM" moodCode="EVN">
							<text>Theodur 200mg BID</text>
							<effectiveTime xsi:type="PIVL_TS" institutionSpecified="true">
								<period value="12" unit="h"/>
							</effectiveTime>
							<routeCode code="PO" codeSystem="2.16.840.1.113883.5.112" codeSystemName="RouteOfAdministration"/>
							<doseQuantity value="200" unit="mg"/>
							<consumable>
								<manufacturedProduct>
									<manufacturedLabeledDrug>
										<code code="66493003" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Theophylline"/>
									</manufacturedLabeledDrug>
								</manufacturedProduct>
							</consumable>
						</substanceAdministration>
					</entry>
					<entry>
						<substanceAdministration classCode="SBADM" moodCode="EVN">
							<text>Proventil inhaler 2puffs QID PRN</text>
							<effectiveTime xsi:type="PIVL_TS" institutionSpecified="true">
								<period value="6" unit="h"/>
							</effectiveTime>
							<priorityCode code="PRN"/>
							<routeCode code="IPINHL" codeSystem="2.16.840.1.113883.5.112" codeSystemName="RouteOfAdministration" displayName="Inhalation, oral"/>
							<doseQuantity value="2"/>
							<consumable>
								<manufacturedProduct>
									<manufacturedLabeledDrug>
										<code code="91143003" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Albuterol"/>
									</manufacturedLabeledDrug>
								</manufacturedProduct>
							</consumable>
						</substanceAdministration>
					</entry>
					<entry>
						<substanceAdministration classCode="SBADM" moodCode="EVN">
							<id root="2.16.840.1.113883.19.8.1"/>
							<text>Prednisone 20mg qd</text>
							<effectiveTime xsi:type="PIVL_TS" institutionSpecified="true">
								<period value="24" unit="h"/>
							</effectiveTime>
							<routeCode code="PO" codeSystem="2.16.840.1.113883.5.112" codeSystemName="RouteOfAdministration"/>
							<doseQuantity value="20" unit="mg"/>
							<consumable>
								<manufacturedProduct>
									<manufacturedLabeledDrug>
										<code code="10312003" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Prednisone preparation"/>
									</manufacturedLabeledDrug>
								</manufacturedProduct>
							</consumable>
						</substanceAdministration>
					</entry>
					<entry>
						<substanceAdministration classCode="SBADM" moodCode="EVN">
							<text>HCTZ 25mg qd</text>
							<effectiveTime xsi:type="PIVL_TS" institutionSpecified="true">
								<period value="24" unit="h"/>
							</effectiveTime>
							<routeCode code="PO" codeSystem="2.16.840.1.113883.5.112" codeSystemName="RouteOfAdministration"/>
							<consumable>
								<manufacturedProduct>
									<manufacturedLabeledDrug>
										<code code="376209006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Hydrochlorothiazide 25mg tablet"/>
									</manufacturedLabeledDrug>
								</manufacturedProduct>
							</consumable>
						</substanceAdministration>
					</entry>
				</section>
			</component>
			<!-- 
********************************************************
  Allergies & Adverse Reactions section
********************************************************
-->
			<component>
				<section>
					<code code="10155-0" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
					<title>Allergies and Adverse Reactions</title>
					<text>
						<list>
							<item>Penicillin - Hives</item>
							<item>Aspirin - Wheezing</item>
							<item>Codeine - Itching and nausea</item>
						</list>
					</text>
					<entry>
						<observation classCode="OBS" moodCode="EVN">
							<code xsi:type="CD" code="247472004" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Hives"/>
							<statusCode code="completed"/>
							<entryRelationship typeCode="MFST">
								<observation classCode="OBS" moodCode="EVN">
									<code xsi:type="CD" code="91936005" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Allergy to penicillin"/>
									<statusCode code="completed"/>
								</observation>
							</entryRelationship>
						</observation>
					</entry>
					<entry>
						<observation classCode="OBS" moodCode="EVN">
							<code code="56018004" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Wheezing"/>
							<statusCode code="completed"/>
							<entryRelationship typeCode="MFST">
								<observation classCode="OBS" moodCode="EVN">
									<code code="293586001" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Allergy to aspirin"/>
									<statusCode code="completed"/>
								</observation>
							</entryRelationship>
						</observation>
					</entry>
					<entry>
						<observation classCode="OBS" moodCode="EVN">
							<code code="32738000" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Pruritis"/>
							<statusCode code="completed"/>
							<entryRelationship typeCode="MFST">
								<observation classCode="OBS" moodCode="EVN">
									<id root="2.16.840.1.113883.19.1.2010"/>
									<code code="62014003" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Adverse reaction to drug">
										<qualifier>
											<name code="246075003" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="causative agent"/>
											<value code="1476002" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="codeine"/>
										</qualifier>
									</code>
									<statusCode code="completed"/>
								</observation>
							</entryRelationship>
						</observation>
					</entry>
					<entry>
						<observation classCode="OBS" moodCode="EVN">
							<code code="73879007" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Nausea"/>
							<statusCode code="completed"/>
							<entryRelationship typeCode="MFST">
								<observation classCode="OBS" moodCode="EVN">
									<id root="2.16.840.1.113883.19.1.2010"/>
									<code code="84100007" codeSystem="2.16.840.1.113883.6.96"/>
								</observation>
							</entryRelationship>
						</observation>
					</entry>
				</section>
			</component>
			<!-- 
********************************************************
  Family History section
********************************************************
-->
			<component>
				<section>
					<code code="10157-2" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
					<title>Family history</title>
					<text>
						<list>
							<item>Father had fatal MI in his early 50's.</item>
							<item>No cancer or diabetes.</item>
						</list>
					</text>
					<entry>
						<observation classCode="OBS" moodCode="EVN">
							<code code="22298006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="MI"/>
							<statusCode code="completed"/>
							<effectiveTime value="1970"/>
							<subject>
								<relatedSubject classCode="PRS">
									<code code="FTH" codeSystem="2.16.840.1.113883.5.111"/>
								</relatedSubject>
							</subject>
							<entryRelationship typeCode="CAUS">
								<observation classCode="OBS" moodCode="EVN">
									<code code="399347008" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="death"/>
									<statusCode code="completed"/>
									<effectiveTime value="1970"/>
								</observation>
							</entryRelationship>
						</observation>
					</entry>
					<entry>
						<observation classCode="OBS" moodCode="EVN" negationInd="true">
							<code code="275937001" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Family history of cancer"/>
							<statusCode code="completed"/>
							<effectiveTime>
								<high value="20000407" inclusive="true"/>
							</effectiveTime>
						</observation>
					</entry>
					<entry>
						<observation classCode="OBS" moodCode="EVN">
							<code code="160274005" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="No family history of diabetes"/>
							<statusCode code="completed"/>
							<effectiveTime>
								<high value="20000407" inclusive="true"/>
							</effectiveTime>
						</observation>
					</entry>
				</section>
			</component>
			<!-- 
********************************************************
  Social History section
********************************************************
-->
			<component>
				<section>
					<code code="29762-2" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
					<title>Social History</title>
					<text>
						<list>
							<item>Smoking :: 1 PPD between the ages of 20 and 55, and then he quit.</item>
							<item>Alcohol :: rare</item>
						</list>
					</text>
					<entry>
						<observation classCode="OBS" moodCode="EVN">
							<code code="266924008" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="ex-heavy cigarette smoker (20-39/day)"/>
							<statusCode code="completed"/>
							<effectiveTime>
								<low value="1955"/>
								<high value="1990"/>
							</effectiveTime>
						</observation>
					</entry>
					<entry>
						<observation classCode="OBS" moodCode="EVN">
							<code code="160625004" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Date ceased smoking"/>
							<statusCode code="completed"/>
							<value xsi:type="TS" value="1990"/>
						</observation>
					</entry>
					<entry>
						<observation classCode="OBS" moodCode="EVN">
							<code code="266917007" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Trivial drinker -  less than 1/day"/>
							<statusCode code="completed"/>
						</observation>
					</entry>
				</section>
			</component>
			<!-- 
********************************************************
  Physical Exam section
********************************************************
-->
			<component>
				<section>
					<code code="11384-5" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
					<title>Physical Examination</title>
					<!-- 
          ********************************************************
            Physical Exam  - Vital Signs
          ********************************************************
          -->
					<component>
						<section>
							<code code="8716-3" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
							<title>Vital Signs</title>
							<text>
								<table>
									<tbody>
										<tr>
											<th>Date / Time</th>
											<th>April 7, 2000 14:30</th>
											<th>April 7, 2000 15:30</th>
										</tr>
										<tr>
											<th>Height</th>
											<td>177 cm (69.7 in)</td>
										</tr>
										<tr>
											<th>Weight</th>
											<td>194.0 lbs (88.0 kg)</td>
										</tr>
										<tr>
											<th>BMI</th>
											<td>28.1 kg/m2</td>
										</tr>
										<tr>
											<th>BSA</th>
											<td>2.05 m2</td>
										</tr>
										<tr>
											<th>Temperature</th>
											<td>36.9 C (98.5 F)</td>
											<td>36.9 C (98.5 F)</td>
										</tr>
										<tr>
											<th>Pulse</th>
											<td>86 / minute</td>
											<td>84 / minute</td>
										</tr>
										<tr>
											<th>Rhythm</th>
											<td>Regular</td>
											<td>Regular</td>
										</tr>
										<tr>
											<th>Respirations</th>
											<td>16 / minute, unlabored</td>
											<td>14 / minute</td>
										</tr>
										<tr>
											<th>Systolic</th>
											<td>132 mmHg</td>
											<td>135 mmHg</td>
										</tr>
										<tr>
											<th>Diastolic</th>
											<td>86 mmHg</td>
											<td>88 mmHg</td>
										</tr>
										<tr>
											<th>Position / Cuff</th>
											<td>Left Arm</td>
											<td>Left Arm</td>
										</tr>
									</tbody>
								</table>
							</text>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="50373000" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Body height measure"/>
									<statusCode code="completed"/>
									<effectiveTime value="200004071430"/>
									<value xsi:type="PQ" value="1.77" unit="m">
										<translation value="69.7" code="[in_I]" codeSystem="2.16.840.1.113883.6.8" codeSystemName="UCUM"/>
									</value>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="363808001" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Body weight measure"/>
									<statusCode code="completed"/>
									<effectiveTime value="200004071430"/>
									<value xsi:type="PQ" value="194.0" unit="[lb_ap]">
										<translation value="88.0" code="kg" codeSystem="2.16.840.1.113883.6.8" codeSystemName="UCUM"/>
									</value>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="60621009" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Body mass index"/>
									<statusCode code="completed"/>
									<effectiveTime value="200004071430"/>
									<value xsi:type="RTO_PQ_PQ">
										<numerator value="28.1" unit="kg"/>
										<denominator value="1" unit="ar"/>
									</value>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="301898006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Body surface area"/>
									<statusCode code="completed"/>
									<effectiveTime value="200004071430"/>
									<value xsi:type="PQ" value="2.05" unit="ar"/>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="386725007" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Body temperature"/>
									<statusCode code="completed"/>
									<effectiveTime value="200004071430"/>
									<value xsi:type="PQ" value="36.9" unit="Cel">
										<translation value="98.5" code="[degF]" codeSystem="2.16.840.1.113883.6.8" codeSystemName="UCUM"/>
									</value>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="364075005" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Heart rate"/>
									<statusCode code="completed"/>
									<effectiveTime value="200004071430"/>
									<value xsi:type="RTO_PQ_PQ">
										<numerator value="86"/>
										<denominator value="1" unit="min"/>
									</value>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="364075005" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Heart rate"/>
									<statusCode code="completed"/>
									<effectiveTime value="200004071530"/>
									<value xsi:type="RTO_PQ_PQ">
										<numerator value="84"/>
										<denominator value="1" unit="min"/>
									</value>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="364074009" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Regularity of heart rhythm"/>
									<statusCode code="completed"/>
									<effectiveTime value="200004071430"/>
									<value xsi:type="CD" code="248649006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Heart regular"/>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="364074009" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Regularity of heart rhythm"/>
									<statusCode code="completed"/>
									<effectiveTime value="200004071530"/>
									<value xsi:type="CD" code="248649006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Heart regular"/>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="86290005" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Respiratory rate"/>
									<statusCode code="completed"/>
									<effectiveTime value="200004071430"/>
									<value xsi:type="RTO_PQ_PQ">
										<numerator value="16"/>
										<denominator value="1" unit="min"/>
									</value>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="276362002" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Breathing easily"/>
									<statusCode code="completed"/>
									<effectiveTime value="200004071430"/>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="86290005" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Respiratory rate"/>
									<statusCode code="completed"/>
									<effectiveTime value="200004071530"/>
									<value xsi:type="RTO_PQ_PQ">
										<numerator value="14"/>
										<denominator value="1" unit="min"/>
									</value>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="251076008" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Cuff blood pressure"/>
									<statusCode code="completed"/>
									<effectiveTime value="200004071430"/>
									<targetSiteCode code="368208006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Left arm"/>
									<entryRelationship typeCode="COMP">
										<observation classCode="OBS" moodCode="EVN">
											<code code="271649006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Systolic BP"/>
											<statusCode code="completed"/>
											<effectiveTime value="200004071530"/>
											<value xsi:type="PQ" value="132" unit="mm[Hg]"/>
										</observation>
									</entryRelationship>
									<entryRelationship typeCode="COMP">
										<observation classCode="OBS" moodCode="EVN">
											<code code="271650006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Diastolic BP"/>
											<statusCode code="completed"/>
											<effectiveTime value="200004071530"/>
											<value xsi:type="PQ" value="86" unit="mm[Hg]"/>
										</observation>
									</entryRelationship>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="251076008" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Cuff blood pressure"/>
									<statusCode code="completed"/>
									<effectiveTime value="200004071530"/>
									<targetSiteCode code="368208006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Left arm"/>
									<entryRelationship typeCode="COMP">
										<observation classCode="OBS" moodCode="EVN">
											<code code="271649006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Systolic BP"/>
											<statusCode code="completed"/>
											<effectiveTime value="200004071530"/>
											<value xsi:type="PQ" value="135" unit="mm[Hg]"/>
										</observation>
									</entryRelationship>
									<entryRelationship typeCode="COMP">
										<observation classCode="OBS" moodCode="EVN">
											<code code="271650006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Diastolic BP"/>
											<statusCode code="completed"/>
											<effectiveTime value="200004071530"/>
											<value xsi:type="PQ" value="88" unit="mm[Hg]"/>
										</observation>
									</entryRelationship>
								</observation>
							</entry>
						</section>
					</component>
					<!-- 
          ********************************************************
            Physical Exam  - Skin
          ********************************************************
          -->
					<component>
						<section>
							<code code="8709-8" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
							<title>Skin Exam</title>
							<text>Erythematous rash, palmar surface, left index finger.
								 <renderMultiMedia referencedObject="MM1"/>
							</text>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="271807003" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Rash"/>
									<statusCode code="completed"/>
									<methodCode code="32750006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Inspection"/>
									<targetSiteCode code="48856004" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Skin of palmer surface of index finger">
										<qualifier>
											<name code="78615007" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="with laterality"/>
											<value code="7771000" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="left"/>
										</qualifier>
									</targetSiteCode>
									<entryRelationship typeCode="SPRT">
										<regionOfInterest classCode="ROIOVL" moodCode="EVN" ID="MM1">
											<id root="2.16.840.1.113883.19.3.1"/>
											<code code="ELLIPSE"/>
											<value value="3"/>
											<value value="1"/>
											<value value="3"/>
											<value value="7"/>
											<value value="2"/>
											<value value="4"/>
											<value value="4"/>
											<value value="4"/>
											<entryRelationship typeCode="SUBJ">
												<observationMedia classCode="OBS" moodCode="EVN">
													<id root="2.16.840.1.113883.19.2.1"/>
													<value mediaType="image/gif">
														<reference value="lefthand.gif"/>
													</value>
												</observationMedia>
											</entryRelationship>
										</regionOfInterest>
									</entryRelationship>
								</observation>
							</entry>
						</section>
					</component>
					<!-- 
          ********************************************************
            Physical Exam  - Lungs
          ********************************************************
          -->
					<component>
						<section>
							<code code="8710-6" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
							<title>Lungs</title>
							<text>Clear with no wheeze. Good air flow.</text>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="48348007" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Chest clear"/>
									<statusCode code="completed"/>
									<methodCode code="37931006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Auscultation"/>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN" negationInd="true">
									<code code="56018004" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Wheezing"/>
									<statusCode code="completed"/>
									<methodCode code="37931006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Auscultation"/>
								</observation>
							</entry>
						</section>
					</component>
					<!-- 
          ********************************************************
            Physical Exam  - Cardiac
          ********************************************************
          -->
					<component>
						<section>
							<code code="10223-2" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
							<title>Cardiac</title>
							<text>RRR with no murmur, no S3, no S4.</text>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="76863003" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Normal heart rate"/>
									<statusCode code="completed"/>
									<methodCode code="37931006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Auscultation"/>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN" negationInd="true">
									<code code="88610006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="heart murmur"/>
									<statusCode code="completed"/>
									<methodCode code="37931006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Auscultation"/>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN" negationInd="true">
									<code code="277455002" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Third heart sound"/>
									<statusCode code="completed"/>
									<methodCode code="37931006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Auscultation"/>
								</observation>
							</entry>
							<entry>
								<observation classCode="OBS" moodCode="EVN">
									<code code="60721002" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Fourth heart sound inaudible"/>
									<statusCode code="completed"/>
									<methodCode code="37931006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Auscultation"/>
								</observation>
							</entry>
						</section>
					</component>
				</section>
			</component>
			<!-- 
********************************************************
  Labs section
********************************************************
-->
			<component>
				<section>
					<code code="11502-2" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
					<title>Labs</title>
					<text>
						<list>
							<item>CXR 02/03/1999: Hyperinflated. Normal cardiac silhouette, clear lungs.</item>					
							<item>Peak Flow today: 260 l/m</item>
						</list>
					</text>
					<entry>
						<observation classCode="OBS" moodCode="EVN">
							<code code="282290005" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Imaging interpretation"/>
							<statusCode code="completed"/>
							<entryRelationship typeCode="COMP">
								<observation classCode="OBS" moodCode="EVN">
									<id root="2.16.840.1.113883.19.1.3005"/>
									<code code="249674001" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Chest hyperinflated"/>
								</observation>
							</entryRelationship>
							<entryRelationship typeCode="COMP">
								<observation classCode="OBS" moodCode="EVN">
									<id root="2.16.840.1.113883.19.1.5505"/>
									<code codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" nullFlavor="OTH">
										<originalText>normal cardiac silhouette</originalText>
									</code>
								</observation>
							</entryRelationship>
							<entryRelationship typeCode="COMP">
								<observation classCode="OBS" moodCode="EVN" negationInd="true">
									<id root="2.16.840.1.113883.19.1.6675"/>
									<code codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" nullFlavor="OTH">
										<originalText>radiopacities</originalText>
									</code>
								</observation>
							</entryRelationship>
							<reference typeCode="SPRT">
								<externalObservation classCode="DGIMG">
									<id root="2.16.840.1.113883.19.1.14"/>
									<code code="56350004" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Chest-X-ray"/>
								</externalObservation>
							</reference>
						</observation>
					</entry>
					<entry>
						<observation classCode="OBS" moodCode="EVN">
							<id root="2.16.840.1.113883.19.1.7005"/>
							<code code="313193002" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Peak flow"/>
							<statusCode code="completed"/>
							<effectiveTime value="20000407"/>
							<value xsi:type="RTO_PQ_PQ">
								<numerator value="260" unit="l"/>
								<denominator value="1" unit="min"/>
							</value>
						</observation>
					</entry>
				</section>
			</component>
			<!-- 
********************************************************
  In-office Procedure section
********************************************************
-->
			<component>
				<section>
					<code code="29554-3" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
					<title>In-office Procedures</title>
					<text>
						<list>
							<item>Suture removal, left forearm.</item>
						</list>
					</text>
					<entry>
						<procedure classCode="PROC" moodCode="EVN">
							<code code="30549001" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Suture removal"/>
							<statusCode code="completed"/>
							<effectiveTime value="200004071430"/>
							<targetSiteCode code="66480008" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Left forearm"/>
						</procedure>
					</entry>
				</section>
			</component>
			<!-- 
********************************************************
  Assessment section
********************************************************
-->
			<component>
				<section>
					<code code="11496-7" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
					<title>Assessment</title>
					<text>
						<list>
							<item>Asthma, with prior smoking history. Difficulty weaning off steroids. Will try gradual taper.</item>
							<item>Hypertension, well-controlled.</item>
							<item>Contact dermatitis on finger.</item>
						</list>
					</text>
					<entry>
						<observation classCode="COND" moodCode="EVN">
							<code code="14657009" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Established diagnosis"/>
							<statusCode code="completed"/>
							<effectiveTime value="200004071530"/>
							<value xsi:type="CD" code="195967001" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Asthma">
								<translation code="49390" codeSystem="2.16.840.1.113883.6.2" codeSystemName="ICD9CM" displayName="ASTHMA W/O STATUS ASTHMATICUS"/>
							</value>
							<reference typeCode="ELNK">
								<externalObservation classCode="COND">
									<id root="2.16.840.1.113883.19.1.35"/>
								</externalObservation>
							</reference>
						</observation>
					</entry>
					<entry>
						<observation classCode="COND" moodCode="EVN">
							<code code="14657009" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Established diagnosis"/>
							<statusCode code="completed"/>
							<effectiveTime value="200004071530"/>
							<value xsi:type="CD" code="59621000" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Essential hypertension">
								<translation code="4019" codeSystem="2.16.840.1.113883.6.2" codeSystemName="ICD9CM" displayName="HYPERTENSION NOS"/>
							</value>
							<reference typeCode="ELNK">
								<externalObservation classCode="COND">
									<id root="2.16.840.1.113883.19.1.37"/>
								</externalObservation>
							</reference>
						</observation>
					</entry>
					<entry>
						<observation classCode="COND" moodCode="EVN">
							<code code="14657009" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Established diagnosis"/>
							<statusCode code="completed"/>
							<effectiveTime value="200004071530"/>
							<value xsi:type="CD" code="40275004" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Contact dermatitis">
								<translation code="692.9" codeSystem="2.16.840.1.113883.6.2" codeSystemName="ICD9CM" displayName="Contact Dermatitis, NOS"/>
							</value>
							<targetSiteCode code="48856004" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Skin of palmer surface of index finger">
								<qualifier>
									<name code="78615007" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="with laterality"/>
									<value code="7771000" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="left"/>
								</qualifier>
							</targetSiteCode>
						</observation>
					</entry>
				</section>
			</component>
			<!-- 
********************************************************
  Plan section
********************************************************
-->
			<component>
				<section>
					<templateId root="2.16.840.1.113883.3.27.354"/>
					<code code="18776-5" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
					<title>Plan</title>
					<text>
						<list>
							<item>Complete PFTs with lung volumes.</item>
							<item>Chem-7 tomorrow.</item>
							<item>Teach peak flow rate measurement.</item>
							<item>Decrease prednisone to 20qOD alternating with 18qOD.</item>
							<item>Hydrocortisone cream to finger BID.</item>
							<item>RTC 1 week.</item>
						</list>
					</text>
					<entry>
						<act classCode="ACT" moodCode="INT">
							<id/>
							<code code="23426006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Pulmonary function test"/>
							<text>Complete PFTs with lung volumes.</text>
							<entryRelationship typeCode="COMP">
								<act classCode="ACT" moodCode="INT">
									<code code="252472004" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Lung volume test"/>
								</act>
							</entryRelationship>
						</act>
					</entry>
					<entry>
						<observation classCode="OBS" moodCode="INT">
							<code code="24320-4" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC">
								<originalText>Chem-7</originalText>
								<translation code="aYU7t6" codeSystem="2.16.840.1.113883.19.278.47" codeSystemName="MyLocalCodeSystem" displayName="Chem7"/>
							</code>
							<text>Chem-7 tomorrow</text>
							<effectiveTime value="20000408"/>
						</observation>
					</entry>
					<entry>
						<act classCode="ACT" moodCode="INT">
							<id/>
							<code code="223468009" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Teaching of skills">
								<qualifier>
									<name code="363702006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="has focus"/>
									<value code="29893006" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Peak flow rate measurement"/>
								</qualifier>
							</code>
						</act>
					</entry>
					<entry>
						<substanceAdministration classCode="SBADM" moodCode="RQO">
							<text>prednisone 20qOD alternating with 18qOD.</text>
							<routeCode code="PO" codeSystem="2.16.840.1.113883.5.112" codeSystemName="RouteOfAdministration"/>
							<consumable>
								<manufacturedProduct>
									<manufacturedLabeledDrug>
										<code code="10312003" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Prednisone preparation"/>
									</manufacturedLabeledDrug>
								</manufacturedProduct>
							</consumable>
						</substanceAdministration>
					</entry>
					<entry>
						<substanceAdministration classCode="SBADM" moodCode="RQO">
							<text>Hydrocortisone cream to finger BID.</text>
							<effectiveTime xsi:type="PIVL_TS" institutionSpecified="true">
								<period value="12" unit="h"/>
							</effectiveTime>
							<routeCode code="SKIN" codeSystem="2.16.840.1.113883.5.112" codeSystemName="RouteOfAdministration" displayName="Topical application, skin"/>
							<approachSiteCode code="48856004" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Skin of palmer surface of index finger">
								<qualifier>
									<name code="78615007" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="with laterality"/>
									<value code="7771000" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="left"/>
								</qualifier>
							</approachSiteCode>
							<consumable>
								<manufacturedProduct>
									<manufacturedLabeledDrug>
										<code code="331646005" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Hydrocortisone cream"/>
									</manufacturedLabeledDrug>
								</manufacturedProduct>
							</consumable>
						</substanceAdministration>
					</entry>
					<entry>
						<encounter classCode="ENC" moodCode="RQO">
							<code code="185389009" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT" displayName="Follow-up visit"/>
							<effectiveTime>
								<low value="20000412"/>
								<high value="20000417"/>
							</effectiveTime>
						</encounter>
					</entry>
				</section>
			</component>
		</structuredBody>
	</component>
</ClinicalDocument>
