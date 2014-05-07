XQUERY
  let $a := (1,2,3,4)
  return 
    (
    'Count',
    count($a),
    'Max',
    max($a),
    'Min',
    min($a),
    'Average',
    avg($a),
    'Sum',
    sum($a)
    )
