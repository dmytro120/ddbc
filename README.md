# Dmytro's DataBase Connector (DDBC)
DDBC is a Node.js application which acts as an interface to query an Oracle database via HTTP requests.

## Installation
Download and install SFX from http://dmytro.malikov.us/ddbc/ **OR** follow procedure:

1. mkdir "C:/Program Files/DDBC"
2. cd "C:/Program Files/DDBC"
3. git clone https://github.com/dmytro120/ddbc.git
4. npm install oracledb
5. Get [Oracle "Instant Client Package - Basic"](http://download.oracle.com/otn/nt/instantclient/121020/instantclient-basic-windows.x64-12.1.0.2.0.zip) and  put it at "C:/Program Files/DDBC/oci".

## Setup
Setup is mandatory regardless of whether you installed from SFX or followed manual procedure.

1. mkdir %LOCALAPPDATA%/DDBC
2. mkdir %LOCALAPPDATA%/DDBC/Network/Admin and put all your \*.ORA files here.
3. Create dbconfig.js in %LOCALAPPDATA%/DDBC/ and define settings per example below:

### Example dbconfig
```javascript
module.exports = {
  user          : process.env.NODE_ORACLEDB_USER || "dbuser",

  // Instead of hard coding the password, consider prompting for it,
  // passing it in an environment variable via process.env, or using
  // External Authentication.
  password      : process.env.NODE_ORACLEDB_PASSWORD || "dbpassword",

  // For information on connection strings see:
  // https://github.com/oracle/node-oracledb/blob/master/doc/api.md#connectionstrings
  connectString : process.env.NODE_ORACLEDB_CONNECTIONSTRING || "XE",

  // Setting externalAuth is optional.  It defaults to false.  See:
  // https://github.com/oracle/node-oracledb/blob/master/doc/api.md#extauth
  externalAuth  : process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false
};
```

## Rationale
DDBC was created in a locked-down corporate environment in order to allow using a SPA (single page application) as an alternative front end to a database whose primary front end is a legacy Cincom SmallTalk application which has numerous quirks and limits potential expandability.

Please note that there are numerous potential security issues if DDBC is used in a non-locked down environment. In most applications, direct access to a database by sending queries via HTTP requests is a bad idea. **Use at your own risk.**