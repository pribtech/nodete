<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2012 All rights reserved.
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


class JavaClassLoader {
	public $classLoader;
	public $jarFiles;
	public $urlArray;
	public function __construct() {
		if(!JAVA_BRIDGE_ACTIVE)
			self::raiseError('Java Bridge not active');
		$numArgs = func_num_args();
		$urlArray=array();
		$jar="";
		try {	
			try{
				for ($i = 0; $i < $numArgs; $i++) {
					$jars=func_get_arg($i);
					if(is_array($jars))  {
						foreach($jars as $jar) 
							$this->addJar($jar);
					} else
						$this->addJar($jars);
				}
			} catch (JavaException $e) {
				self::raiseError('Class loader net URL "'.$this->jarFiles[count($this->jarFiles)-1].'" failed error: '.$e->getMessage());
			}
			java_last_exception_clear();
			$this->classLoader = new Java('java.net.URLClassLoader',$this->urlArray);
			if($this->classLoader==null) {
				$e=java_last_exception_get();
				self::raiseError('Class loader is null for "'. $this->jarsToString().'", last java error: '.$e->getMessage().' jars: '.$this->jarsToString());
			}	
		} catch (JavaException $e) {
			self::raiseError('Class loader failed for "'.$this->jarsToString().'", error: '.$e->getMessage());
		}
	}

	private function addJar($jar) {
		if(!file_exists($jar))
			$jar=JAR_BASE_DIRECTORY.$jar;
		if(is_dir($jar)) {
			$files = @scandir($jar);
			foreach($files as $file) {
				if(preg_match('/\.jar$/i', $file) ) {
					$this->jarFiles[] = 'jar:file:'.$jar.'/'.$file.'!/';
					$this->urlArray[]=new Java('java.net.URL',$this->jarFiles[count($this->jarFiles)-1]);
				}
			}
		} else {
			if(!file_exists($jar))
				if(!file_exists($jar.'.jar'))
					self::raiseError('Class loader failed for "'.$jar.'", error: file/directory not found');
			$this->jarFiles[] = 'jar:file:'.$jar.(file_exists($jar)?'':'.jar').'!/';
			$this->urlArray[]=new Java('java.net.URL',$this->jarFiles[count($this->jarFiles)-1]);
		}
	}
	
	public function jarsToString() {
		$return="";
		foreach ($this->jarFiles as $jar)
			$return .= ' '.$jar;
		return $return;
	}

	public function getClass($class) {
		try {
			if(isset($GLOBALS[$class]))
				if($GLOBALS[$class]!=null) return;
			java_last_exception_clear();
			$GLOBALS[$class] = $GLOBALS["javaClass"]->forName($class,false,$this->classLoader);
			if($GLOBALS[$class]==null) {
				$e=java_last_exception_get();
				self::raiseError('Class is null for "'. $class.'", last java error: '.$e->getMessage().' jars: '.$this->jarsToString());
			}	
		} catch (JavaException $e) {
			self::raiseError('Load java class loader for "'.$class.'",  error: '.$e->getMessage().' jars: '.$this->jarsToString());
		}
	}

	public function getInstance($objectId,$class) {
		try {
			if(!isset($GLOBALS[$class]))
				$this-getClass($class);
			java_last_exception_clear();
			$GLOBALS[$objectId] =  $GLOBALS[$class]->newInstance();
		} catch (JavaException $e) {
			self::raiseError('Load java class instance for class "'.$class.'" failed error: '.$e->getMessage());
		}
	}

	public function reloadClass($class) {
		unset($GLOBALS[$class]);
		JavaClassLoader::getClass($class);
	}	

	public function reloadInstance($objectId,$class) {
		unset($GLOBALS[$class]);
		JavaClassLoader::getClass($class);
	}
	public function raiseError($error) {
		error_log($error,0);
		throw new Exception($error);
	}

}
if(!JAVA_BRIDGE_ACTIVE || !isset($GLOBALS['javaClass']))
	throw new Exception('Java Bridge not active');
	
class JavaClassExpose {
	public function getObjectClassDetails (&$object) {
    	return self::getClassDetails($object->getClass());
    }
	public static function getClassDetails (&$class) {
   		return "Class: ".self::getName($class)." Methods: ".self::getMethods($class);
    }
	public static function getName (&$class) { return $class->getCanonicalName(); }
	public static function getMethods (&$class) {
		$methodsString = '';
		$methods = $class->getDeclaredMethods();
		foreach ($methods as $method)
            $methodsString .= ' '.$method->getName();
	}
	public static function logClassDetails (&$class) {
		error_log("Trace dump ".self::getClassDetails($class),0);
	}
}
function javaTestException($label) {
	$error=java_last_exception_get();
	if($error==null) return;
	throw new Exception($label." java error: ".$error);
}
?>