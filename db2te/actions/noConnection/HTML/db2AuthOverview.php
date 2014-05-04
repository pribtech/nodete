<?php
/*******************************************************************************
 *  Copyright IBM Corp. 2007 All rights reserved.
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

$panelID = CALLING_PANEL;
$windowID = CALLING_WINDOW;
$stageID = CALLING_STAGE;
$pageID = CALLING_PAGE;

?>
<div id="title">Db2Auth Control Panel</div>
<script type="text/javascript">

    var layout = ({
                            
                                        type                :"stage",
                                        name                :"<?php echo $pageID; ?>_DB2AUTH_CONTROL",
                                        HasMenuBarContainer : TOP_TAB_TASK_BAR, 
                                        top                 : 0, 
                                        botton              : 0, 
                                        left                : 0,
                                        right               : 0,
                                        titleBarType        : NO_TITLE_BAR,
                                        windowOptionType    : NAV_BACK_BUTTON + NAV_FORWARD_BUTTON + NAV_RELOAD_BUTTON, 
                                        windowControlTypes  : NO_TITLE_BAR_OPTIONS,
                                        sizable             : WINDOW_IS_FULL
                                   
            });

    getWindow('<?php echo $stageID; ?>','<?php echo $windowID; ?>').WindowContainers.get('<?php echo $panelID; ?>').loadLayout(layout);
    
    
    var layout = ({
        target      : "DB2AUTH_USERS",
        raiseToTop  :"",
        windowStage : "<?php echo $pageID; ?>_DB2AUTH_CONTROL",
        windowType  : CAN_NOT_CLOSE,
        content     : {
        	type:"splitPane",
            direction:"h",
            splitPercent:0.5,
            allowResize:true,
            panelA: {
                        type:"panel",
                        name:"DB2AUTH_CONTROL",
                        overflow:"auto",
                        ContentType:"LINK",
                        PrimaryContainer:true,
                        data:{
                                type:"ACTION",
                                data:{
                                    parameters:{
                                        table:"Db2auth/db2auth_users",
                                        action:"list_table"
                                    }   
                                }
                        } },
                        panelB: {
                            type                :"panel",
                            name:"detail",
                            overflow:"auto",
                            ContentType:"LINK"                                        
                    }
        }
        });
        loadNewPageLayout(layout);

        var layout = ({
            target      : "DB2AUTH_GROUPS",
            raiseToTop  :"",
            windowStage : "<?php echo $pageID; ?>_DB2AUTH_CONTROL",
            windowType  : CAN_NOT_CLOSE,
            content     : {
            	type:"splitPane",
                direction:"h",
                splitPercent:0.5,
                allowResize:true,
                panelA: {
                            type:"panel",
                            name:"main",
                            overflow:"auto",
                            ContentType:"LINK",
                            PrimaryContainer:true,
                            data:{
                                    type:"ACTION",
                                    data:{
                                        parameters:{
                                            table:"Db2auth/db2auth_groups",
                                            action:"list_table"
                                        }   
                                    }
                            } },
                            panelB: {
                                type                :"panel",
                                name:"detail",
                                overflow:"auto",
                                ContentType:"LINK"                                        
                        }
            }
            });
            loadNewPageLayout(layout);      

    var layout = ({
    target      : "DB2AUTH_MEMBERSHIP",
    raiseToTop  :"",
    windowStage : "<?php echo $pageID; ?>_DB2AUTH_CONTROL",
    windowType  : CAN_NOT_CLOSE,
    content     : {
        type:"splitPane",
        direction:"h",
        splitPercent:0.5,
        allowResize:true,
        panelA: {
                    type:"panel",
                    name:"DB2AUTH_CONTROL",
                    overflow:"auto",
                    ContentType:"LINK",
                    PrimaryContainer:true,
                    data:{
                            type:"ACTION",
                            data:{
                                parameters:{
                                    table:"Db2auth/db2auth_membership",
                                    action:"list_table"
                                }   
                            }
                    } },
                    panelB: {
                        type                :"panel",
                        name:"detail",
                        overflow:"auto",
                        ContentType:"LINK"                                        
                }
    }
    });
    loadNewPageLayout(layout);
      
    
    var layout = ({
    target      : "DB2AUTH_MASTERVIEW",
    raiseToTop  :"",
    windowStage : "<?php echo $pageID; ?>_DB2AUTH_CONTROL",
    windowType  : CAN_NOT_CLOSE,
    content     : {
        type:"splitPane",
        direction:"h",
        splitPercent:0.5,
        allowResize:true,
        panelA: {
                    type:"panel",
                    name:"DB2AUTH_CONTROL",
                    overflow:"auto",
                    ContentType:"LINK",
                    PrimaryContainer:true,
                    data:{
                            type:"ACTION",
                            data:{
                                parameters:{
                                    table:"Db2auth/db2auth_masterView",
                                    action:"list_table"
                                }   
                            }
                    } },
                    panelB: {
                        type                :"panel",
                        name:"detail",
                        overflow:"auto",
                        ContentType:"LINK"                                        
                }
    }
    });
    loadNewPageLayout(layout);     
</script>

