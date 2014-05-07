select lastname, salary,
  case
    when salary <= 20000 then 'poor'
    when salary  <= 25000 then 'fair'
    when salary  <= 30000 then 'average'
    when salary  <= 35000 then 'good'
    when salary  <= 40000 then 'excellent'
    else 'outstanding'
  end as compensation_level
  from employee
  order by salary