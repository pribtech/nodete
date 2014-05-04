select e.empno, e.lastname, pay from employee e, 
                (select empno, salary+bonus as pay from employee
                where (salary+bonus)>40000
                order by pay asc) as total_pay
                where
                e.empno &gt;= '000050' and e.empno = total_pay.empno
                order by order of total_pay