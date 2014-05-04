XQUERY
    for
        $customer
    in
        db2-fn:xmlcolumn("?SCHEMA?.XMLCUSTOMER.INFO")/customerinfo
    where
        $customer/addr/@country = 'Canada'
    order by
        $customer/name
    return
        ($customer/name, $customer/addr);
