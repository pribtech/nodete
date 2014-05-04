XQUERY
    for
        $prod
    in
        db2-fn:xmlcolumn("?SCHEMA?.XMLPRODUCT.DESCRIPTION")/product/description
        let $pname := xs:string($prod/name)
        let $pprice := xs:decimal($prod/price)
    where
        $pprice >= 5 and $pprice < 500
    order by
        $pprice
    return 
        <prod>
            <prodname>
                <info>{$pname}</info>
            </prodname>
            <prodprice>
                <info>{$pprice}</info>
            </prodprice>
        </prod>;
