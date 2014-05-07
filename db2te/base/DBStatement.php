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


/**

 * This class is a general manager for prepare and execute SQL statements
 * as well as simple executed SQL statements.
 * An executed state runs immedately as part of the object constructor
 * A prepared statement is initalized as part of the constructor but
 * is not executed until parameters are passed in as part of an
 * explict execute function
 *
*/
abstract class Statement {

	/** SQL Statement text
	* @var string */
	public $stmt;
	/** Database connection resource
	* @var resource */
	public $dbconn;
	/** Result of executing the statement
	* @var string */
	public $execResult;
	
	public $baseResult = null;
	
	public $otherResult = null;
	
	//indicates if the object should try to determin the number of rows in the statement
	public $getRowCount = false;

	/** An array of values which contain the inishal values of the parameters
	* @var array */
	public $parameters;
	
	public $statementSucceed = false;
	/** SQL error message
	* @var string */
	public $sqlerror;
	/** SQLSTATE
	* @var integer */
	public $sqlstate;
	/** Defines the type of statement "Prepare" or "Execute"
	* An executed state runs immedately as part of the object constructor
	* A prepared statement is initalized as part of the constructor but
	* is not executed until parameters are passed in as part of an
	* explict execute function
	* @var string */
	public $type;
	/** Total number of rows in the result set
	* @var string */
	public $rows;
	public $totalRowsInResultSet = -1;
	public $rowsRead = 0;
	public $resultSet = 0;
	/** Variable used to track the elapse time for the last execution of this statement.
	*  @var int
	*/
	public $elapsedTime;

/** Requires a SQL statement as well as a database connection.
  * You can also choose a two set prepare and execute or a simple execute
  * The default is a simple execute immediate. */
	abstract public function __construct($stmt_text, $prepare_statment = FALSE, $verbose = FALSE, $ForwardOnlyScroll = TRUE, $getRowCount = FALSE, $dbconn = null);


/** Executes a prepared statement.
  * Requires an array of parameters
  * @return boolean */

	abstract public function execute($parameters=null, $verbose=false);

/** Returns whether a statement was successfully prepared
  * @return boolean */
	abstract public function prepSuccessful();

/** Returns whether a statement was successfully executed
  * @return boolean */
	abstract public function execSuccessful();

/** Returns the SQLSTATE of the Statement object
  * Multiple calls to this
  * only returns the last state. Multiple calls to
  * db2_stmt_error will pull all previous states
  * for the statement in reverse order of execution
  * @return integer */
	abstract public function state();

/** Returns the DB2 Error message
  * Multiple calls to this
  * only returns the last error. Multiple calls to
  * db2_stmt_errormsg will pull all previous error messages
  * for the statement in reverse order of execution
  * @return string */
	abstract public function errorMsg();

/** Retrieves the next result set returned
 * sets $stmt to false when there are no more result sets
  * @return array */
	abstract public function nextResultSet();
	
/** Retrieves the field information for the columns information
 * sets $stmt to false when there are no more result sets
  * @return array */
	abstract public function getColumnInfo();
	
/** Retrieve a single row. Each array element will be identified
  * by the column name
  * @return array */
	abstract public function fetch();

/** Retrieve a single row. Each array element will be identified
  * by an sequential index number starting at 0
  * @return array */
	abstract public function fetchIndexedRow();

/** Retrieve a single row. Each array element will be identified
  * by the coloumn name or as given in the statment
  * @return array */
	abstract public function fetchAssocRow();
	
/** Retrieve a single row. Each array element will be identified
  * by the coloumn name and by column index.
  * @return array */
	abstract public function fetchBoth();
	
	abstract public function checkForRowReturnError($row);
	
/** Retrieve a a specified number of rows. Each array element will be identified
 * by an sequential index number starting at 0.
 * $rows specifies the number of rows to retrieve.
 * Returns an array of rows.
 * $starting specifies the starting row, initially indexes at 0
 * @return array */
	abstract public function fetchNRowsScrollable($rows, $starting = 0, $verbose = FALSE);
	
/** Retrieve a a specified number of rows. Each array element will be identified
 * by an sequential index number starting at 0.
 * $rows specifies the number of rows to retrieve.
 * $starting specifies the starting row, initially indexes at 0.
 * Returns an array of rows.
 * @return array */
	abstract public function fetchNRows($rows, $starting = 1, $verbose = FALSE);
	
	/** Retrieve the number of parameters which can be bound to the given SQL
 * $query the SQL to check
 * $db2conn the database connection 
 * Returns the number of bindable parameters
 * @return array */
	public static function getNumberOfParametersToBind($query, $db2conn){return 0;}
	
	abstract public function executeStmtWithParameters($bindParameters);
	
	abstract public function getRowsInResultSet($OverRideGetRowCount = false);
}