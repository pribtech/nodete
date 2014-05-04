INSERT INTO abstracts
	SELECT SYSFUN.RAND()*1000 + 1 as bookisbn, 
'This IBM Redbook is a programming guide for the application
development tool, WebSphere Studio Application Developer. This
tool is not only for the Java developer, but also for the Web designer
who creates Web pages. The WebSphere Studio Application
Developer basic tooling and team environment is presented along
with the development and deployment of Web applications.

WebSphere Studio Application Developer provides integrated
development tools for all e-business development roles, including
Web developers, Java developers, business analysts, architects, and
enterprise programmers. The customizable, targeted, role-based
approach of WebSphere Studio Application Developer will be
characteristic of all new products built on the WebSphere Studio
Workbench. It is well integrated with WebSphere Application Server
and provides a built-in single server that can be used for the testing
and profiling of Web applications. It replaces the existing Java and
Web application development tools, VisualAge for Java and
WebSphere Studio.

This redbook consists of eight parts: an introduction to the
WebSphere Studio family of products and a sample application that
is used in this book, Web page and Java Web application
development, database connectivity, migrating from VisualAge for
Java, testing and deploying a Web application with WebSphere
Application Server, profiling, team development with Concurrent
Versions System or Rational ClearCase LT, and plug-in development
in WebSphere Studio Application Developer.' as bookabstract 
	FROM SYSCAT.VIEWS T1, SYSCAT.COLUMNS T2
        WHERE T1.VIEWSCHEMA='SYSSTAT'
		FETCH FIRST 10000 rows only