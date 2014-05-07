XQUERY
    for
        $customer
    in
        db2-fn:xmlcolumn("?SCHEMA?.XMLCUSTOMER.INFO")/customerinfo
        let $cname := xs:string($customer/name)
        let $ccity := xs:string($customer/addr/city)
    where
        $customer/addr/@country = 'Canada'
    order by
        $customer/name
    return
        ($cname, $ccity);
