const FTPServer = require('./FTPServer');
const path = require('path');

const credentialsPath = path.join(__dirname, 'credentials.json');
const ftpServer = new FTPServer(credentialsPath);

ftpServer.start();
