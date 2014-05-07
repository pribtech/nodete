XQUERY
  let $a := (1,2,3,3,4)
  return
    (
    'Reversed Values',
    reverse($a),
    'Distinct values',
    distinct-values($a)
    )
