XQUERY
  let $a := (1,2,3,4)
  return 
    (
    $a[1],
    $a[last()],
    $a[.]
    )
