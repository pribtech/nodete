//--- IMPORTS NEEDED ---
import java.net.ConnectException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.*;
import java.util.*;
//--- IMPORT END ---

class locking implements Runnable 
{ 
	Thread myThread; 
	public static String userID = "";
	public static String password = "";
        public static String conString = "";	
	locking (String name) { 
        myThread = new Thread( this ); 
        myThread.start(); 
    }  
	
	public void run(){ 
        System.out.println("Initialize process");
		try{ 
          	connect();
           }catch(Exception ie){};
    } 
	
	public void connect() throws Exception {
		ArrayList tableList = new ArrayList();
		try{
			Class.forName("com.ibm.db2.jcc.DB2Driver").newInstance();
			}
		catch (ClassNotFoundException e){}
		Connection db2Conn1;
		db2Conn1 = DriverManager.getConnection(conString, userID, password);
		db2Conn1.setAutoCommit(false);
		
		for (int i=0; i<100; i++)
		{
			PreparedStatement st1 = db2Conn1.prepareStatement("select * from inventory for update", 
																ResultSet.TYPE_FORWARD_ONLY, 
																ResultSet.CONCUR_READ_ONLY, 
																ResultSet.HOLD_CURSORS_OVER_COMMIT); 
			ResultSet rs = st1.executeQuery();
					
			rs.next();
					
			try{
				myThread.sleep(1000);//sleep for 1000000 ms
				}catch(InterruptedException ie){};
						
			db2Conn1.commit();
			st1.close();
			rs.close();		
		}
		db2Conn1.close();
	}
		
	
	public static void main (String [] args) throws SQLException, ConnectException{

	userID = args[0];
	password = args[1];
        conString = "jdbc:db2://"+args[2]+":"+args[3]+"/sample";
	locking mylock1 = new locking("lock1");

	locking mylock2 = new locking("lock2");

	locking mylock3 = new locking("lock3");

	locking mylock4 = new locking("lock4");

	locking mylock5 = new locking("lock5");

	locking mylock6 = new locking("lock6");

	locking mylock7 = new locking("lock7");

	}//end main
}//end case2



