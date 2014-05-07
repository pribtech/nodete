XQUERY
    for
        $customer
    in
        db2-fn:xmlcolumn("?SCHEMA?.XMLCUSTOMER.INFO")/customerinfo
        let $cname := xs:string($customer/name)
    order by
        $cname
    return
        $cname;
