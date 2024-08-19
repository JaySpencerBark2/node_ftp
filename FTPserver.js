const FTPSrv = require("ftp-srv");
const exec = require("child_process").exec;
const fs = require("fs");
const path = require("path");
const moment = require("moment");

class FTPServer {
  constructor(credentialsPath) {

    this.credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
    this.ftpServer = new FTPSrv({
      url: "ftp://0.0.0.0:21",
      anonymous: true,
      greeting: "Welcome to Jays FTP server",
      timeout: 60000,
    });

    this.setupEventHandlers();
  }


  setupEventHandlers() {
    this.ftpServer.on("client:connected", (connection) => {
      const greetingMessage = this.ftpServer.options.greeting;
      if (greetingMessage) {
        connection.reply(220, greetingMessage);
      }
    });

    this.ftpServer.on(
      "login",
      ({ connection, username, password }, resolve, reject) => {
        console.log("Credentials used:", this.credentials);
        if (username === "anonymous") {
          resolve({ root: "./root" });
          this.sendNotification("anonymous");
          this.logLogin("anonymous", connection);
        } else {
          const user = this.credentials.find(
            (cred) => cred.username === username && cred.password === password
          );
          if (user) {
            resolve({ root: user.root });
            this.sendNotification(username);
            this.logLogin("anonymous", connection);
          } else {
            reject(new Error("Invalid username or password"));
          }
        }
      }
    );
  }

  sendNotification(username) {
    const command = `curl -d "Login Detected: ${username}" ntfy.sh/jays_ftp`;
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error("Failed to send notification:", err);
        console.error("stderr:", stderr);
      } else {
        console.log("Notification sent successfully:", stdout);
      }
    });
  }

  logLogin(username, connection) {
    const dateTime = moment().format("YYYY-MM-DD HH:mm:ss");
    const logMessage = `Login Detected: ${username}, on this connection ${JSON.stringify(
      connection.server.log.fields
    )}, at this date/time: ${dateTime}`;
    fs.writeFile(path.join(__dirname, "./tmp/log.txt"), logMessage, (err) => {
      if (err) {
        console.error("Failed to write to file:", err);
      } else {
        console.log("Login detected written to file");
      }
    });
  }

  start() {
    this.ftpServer
      .listen()
      .then(() => {
        console.log("FTP server is running on port 21");
      })
      .catch((err) => {
        console.error("Error starting FTP server:", err);
      });
  }
}

module.exports = FTPServer;
