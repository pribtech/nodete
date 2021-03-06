<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2009 All rights reserved..
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
TE_check_session_timeout();

$returndata['returnCode'] = "true";
$var=getParameter("variable");
$returndata['SERVER']=var_export($_SERVER,true);
$returndata['SESSION']=var_export($_SESSION,true);
try{$returndata['returnValue'] = "dump variable: ".var_export($$var,true);}
catch(Exception $e) {$returndata['returnValue'] =$e;}
echo json_encode($returndata);
?>