/******************************************************************************
 *
 * NAME
 *   ddbc.js
 *
 * DESCRIPTION
 *   Executes query sent via HTTP request using connections from connection pool.
 *
 *   Echoes results as JSON.
 *
 *   The script creates an HTTP server listening on port 7000 and
 *   accepts an encoded URL parameter for the query, for example:
 *   http://localhost:7000/SELECT%201%20%2B%202%20%22Math%20Op%22%20FROM%20dual
 *
 * DEPENDENCIES
 *   oracledb 1.12.2
 *   Oracle Instant Client: must be present in ./oci/
 *   TNS configuration (*.ORA files): must be present in %LOCALAPPDATA%/DDBC/Network/Admin/
 *   DB Configuration: %LOCALAPPDATA%/DDBC/
 *
 *****************************************************************************/

const path = require('path');
var fs = require('fs');
var dialog = require('dialog');
var http = require('http');
var httpPort = 7000;
var pkgInfo = require('./package.json');

process.env['DDBC_HOME'] = process.env['LOCALAPPDATA'] + '/DDBC/';
process.env['ORACLE_HOME'] = path.join('./oci');
process.env['TNS_ADMIN'] = process.env['DDBC_HOME'] + 'Network/Admin/';
process.env['PATH'] = process.env.ORACLE_HOME + ';' + process.env['PATH'];

var oracledb = require('oracledb');
oracledb.maxRows = 1000;
oracledb.fetchAsString = [ oracledb.DATE, oracledb.CLOB ];

function loadSettings() {
	var pathToDBConfig = process.env['DDBC_HOME'] + 'dbconfig.js';
	if (fs.existsSync(pathToDBConfig)) {
		var dbConfig = require(pathToDBConfig);
		init(dbConfig);
	} else {
		dialog.err('Cannot start DDBC.\r\n\r\nDB configuration file not found:\r\n' + pathToDBConfig.replace(/\//g, "\\"), 'DDBC Error', function() { process.exit(1) });
	}
}

function init(dbConfig) {
	var connectDisplayString = (dbConfig.user + ' @ ' + dbConfig.connectString + '                                        ').substring(0,42);

	console.log('\r\n'+
		' 8888888b.  8888888b.  888888b.    .d8888b.  '+'\r\n'+
		' 888  "Y88b 888  "Y88b 888  "88b  d88P  Y88b '+'\r\n'+
		' 888    888 888    888 888  .88P  888    888 '+'\r\n'+
		' 888    888 888    888 8888888K.  888        '+'\r\n'+
		' 888    888 888    888 888  "Y88b 888        '+'\r\n'+
		' 888    888 888    888 888    888 888    888 '+'\r\n'+
		' 888  .d88P 888  .d88P 888   d88P Y88b  d88P '+'\r\n'+
		' 8888888P"  8888888P"  8888888P"   "Y8888P"  '+'\r\n'
	); 
	console.log(
		'┌────────────────────────────────────────────┐'+'\r\n'+
		"│ Dmytro's DataBase Connector (DDBC) " + pkgInfo.version+'   │' + '\r\n'+
		'│ http://dmytro.malikov.us/ddbc/             │'+'\r\n'+
		'├────────────────────────────────────────────┤'+'\r\n'+
		'│ ' + connectDisplayString       +         ' │'+'\r\n'+
		'└────────────────────────────────────────────┘'+'\r\n'
	);
	oracledb.createPool(
		{
			user: dbConfig.user,
			password: dbConfig.password,
			connectString: dbConfig.connectString
		},
		function(err, pool) {
			if (err) {
				console.error("createPool() error: " + err.message);
				return;
			}

			// Create HTTP server and listen on port - httpPort
			http
			.createServer(function(request, response) {
				handleRequest(request, response, pool);
			})
			.listen(httpPort)
			.on('error', function(err) {
				var exitMsg;
				switch (err.code) {
					case 'EADDRINUSE': exitMsg = 'Cannot start DDBC.\r\nAnother process is using port ' + httpPort + '.'; break;
					default: exitMsg = err.message; break;
				}
				dialog.err(exitMsg, 'DDBC Error', function() {
					process.exit(1);
				}) 
			});

			console.log("Server running at http://localhost:" + httpPort + '\r\n');
		}
	);
}

function handleRequest(request, response, pool) {
	response.setHeader('Access-Control-Allow-Origin', '*');

	var urlparts = request.url.split("/");
	var qry = decodeURIComponent(urlparts[1]);

	if (qry == 'favicon.ico') {
		response.end();
		return;
	}

	pool.getConnection(function(err, connection) {
		if (err) {
			handleError(response, "getConnection() error", err);
			return;
		}
	
		connection.execute("ALTER SESSION SET NLS_DATE_FORMAT = 'DD-MON-YYYY HH24:MI:SS'");

		connection.execute(
			qry,
			[], // bind variable value
			{outFormat: oracledb.OBJECT},
			function(err, result) {
				if (err) {
					connection.close(function(err) {
						if (err) {
							console.error("execute() error release() error", err);
						}
					});
					handleError(response, "execute() error", err);
					return;
				}
		
				response.writeHead(200, {"Content-Type": "application/json"});
				response.write(JSON.stringify(result));

				/* Release the connection back to the connection pool */
				connection.close(function(err) {
					if (err) console.error(err.message);
					response.end();
				});
			}
		);
	});
}

// Report an error
function handleError(response, text, err) {
	response.writeHead(400, {"Content-Type": "text/plain"});
	if (err) {
		text += ": " + err.message;
	}
	console.error(text);
	response.write("Error: " + text + "");
	response.end();
}

process
	.on('SIGTERM', function() {
		console.log("\nTerminating");
		process.exit(0);
	})
	.on('SIGINT', function() {
		console.log("\nTerminating");
		process.exit(0);
	});

loadSettings();