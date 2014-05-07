XQUERY
  let $doc := document 
    {
    <a>
       <b>1</b>
       <b>2</b>
       <b>3</b>
    </a>
    }
  for $p in $doc/a/b
  return $p
