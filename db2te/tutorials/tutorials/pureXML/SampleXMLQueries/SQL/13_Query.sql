XQUERY
    for
        $customer
    in
        db2-fn:xmlcolumn("?SCHEMA?.XMLCUSTOMER.INFO")/customerinfo
    order by
        $customer/name
    return
        $customer/name;
