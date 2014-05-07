XQUERY
    for
        $prod
    in
        db2-fn:xmlcolumn("?SCHEMA?.XMLPRODUCT.DESCRIPTION")/product/description
        let $pname := xs:string($prod/name)
        let $pprice := xs:string($prod/price)
    order by
        $pprice
    return
        ($pname, $pprice);
