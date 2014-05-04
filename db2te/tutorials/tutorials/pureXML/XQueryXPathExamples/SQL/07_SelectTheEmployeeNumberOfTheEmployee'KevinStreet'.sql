XQUERY
  let $doc := document
    {
    <department deptno="120">
      <employee empno="1">
        <name>Kevin Street</name>
        <phone>435-2543</phone>
        <phone>553-5901</phone>
      </employee>
      <employee empno="2">
         <name>Jim Stittle</name>
         <phone>265-2234</phone>
      </employee>
    </department>
    }
  return 
    $doc/department/employee[name ='Kevin Street']/data(@empno)