XQUERY
  let $a := xs:integer(32)
  let $b := xs:string("Hello World")
  return <mixed_data>{ ($a, $b) }</mixed_data>