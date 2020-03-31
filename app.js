var express = require("express");
var socket = require("socket.io");
var fs = require("fs");
var util = require("util");
const child_process = require("child_process");

var log_file = fs.createWriteStream(__dirname + "/debug.log", { flags: "a" });
var docker_file = fs.createWriteStream(__dirname + "/docker.log", {
  flags: "a"
});

const logger = function(data, stderr) {
  log_file.write(
    `${new Date().toLocaleString()}--->>>${util.format(
      JSON.stringify(data)
    )}--->>>${util.format(JSON.stringify(stderr))}'\n`
  );
};

const docklogger = function(data, stderr) {
  docker_file.write(
    `${new Date().toLocaleString()}--->>>${util.format(
      JSON.stringify(data)
    )}'\n`
  );
};

// App setup
var app = express();
var server = app.listen(3030, function() {
  console.log("Socket.io listening for requests on port 3030,");
});

// Socket setup & pass server
var io = socket(server);

io.on("connection", socket => {
  // NewProject Initialized
  socket.on("newProject", function(data) {
    const project = {
      user: `${data.project.repoNameWithOwner.split("/")[0]}`,
      repoName: `${data.project.repoNameWithOwner.split("/")[1]}`,
      repoURL: data.project.repoURL,
      secret: data.project.repoID
    };
    if ("container1" in data) {
      var programmingLanguageProcess = child_process.exec(
        `docker build --build-arg version=${
          data.container1.tag
        } --build-arg user=${project.user.toLowerCase()} --build-arg repoURL=${
          project.repoURL
        } --build-arg repoName=${
          project.repoName
        } -t ${project.user.toLowerCase()}-${project.repoName.toLowerCase()}-${
          data.container1.image
        }-${data.container1.tag}:latest -f docker-${data.container1.image} .`,
        function(error, stdout, stderr) {
          if (error) {
            logger(
              data,
              `Code:${error.code},Signal:${error.signal},Stack:${error.stack}`
            );
            io.sockets.emit("newProjectReject", {
              data: data,
              message: `Failed on build: Check logs on ${new Date().toLocaleString()}`
            });
          }
          if (stderr.length > 0) {
            logger(data, `Error: ${stderr}`);
            io.sockets.emit("newProjectReject", {
              data: data,
              message: `Failed on build: Check logs on ${new Date().toLocaleString()}`
            });
          }
          if (stdout.length > 0) {
            var imageId = child_process.exec(
              `docker images --format="{{.Repository}} {{.ID}}" |  grep "^${project.user.toLowerCase()}-${project.repoName.toLowerCase()}-${
                data.container1.image
              }-${data.container1.tag}" |  cut -d' ' -f2`,
              function(error, stdout, stderr) {
                if (error) {
                  logger(
                    data,
                    `Code:${error.code},Signal:${error.signal},Stack:${error.stack}`
                  );
                  io.sockets.emit("newProjectReject", {
                    data: data,
                    message: `Failed on build: Check logs on ${new Date().toLocaleString()}`
                  });
                }
                if (stderr.length > 0) {
                  logger(data, `Error: ${stderr}`);
                  io.sockets.emit("newProjectReject", {
                    data: data,
                    message: `Failed on fetching imageID: Check logs on ${new Date().toLocaleString()}`
                  });
                }
                if (stdout.length > 0) {
                  const imageName = `${project.user.toLowerCase()}-${project.repoName.toLowerCase()}-${
                    data.container1.image
                  }-${data.container1.tag}`;
                  const imageId = stdout.replace("\n", "");
                  docklogger({
                    imageName,
                    imageId,
                    user: project.user.toLowerCase()
                  });
                  io.sockets.emit("newProjectSuccess", {
                    data: data,
                    image: {
                      imageName,
                      imageId,
                      container: "container1"
                    },
                    message: `Built`
                  });
                }
              }
            );
          }
        }
      );
    }
    if ("container2" in data) {
      var databaseProcess = child_process.exec(
        `docker build --build-arg secret=${
          project.secret
        } --build-arg username=${project.user.toLowerCase()} -t ${project.user.toLowerCase()}-${project.repoName.toLowerCase()}-${
          data.container2.image
        }:latest -f docker-${data.container2.image} .`,
        function(error, stdout, stderr) {
          if (error) {
            logger(
              data,
              `Code:${error.code},Signal:${error.signal},Stack:${error.stack}`
            );
            io.sockets.emit("newProjectReject", {
              data: data,
              message: `Failed on build: Check logs on ${new Date().toLocaleString()}`
            });
          }
          if (stderr.length > 0) {
            logger(data, `Error: ${stderr}`);
            io.sockets.emit("newProjectReject", {
              data: data,
              message: `Failed on build: Check logs on ${new Date().toLocaleString()}`
            });
          }
          if (stdout.length > 0) {
            var imageId = child_process.exec(
              `docker images --format="{{.Repository}} {{.ID}}" |  grep "^${project.user.toLowerCase()}-${project.repoName.toLowerCase()}-${
                data.container2.image
              }" |  cut -d' ' -f2`,
              function(error, stdout, stderr) {
                if (error) {
                  logger(
                    data,
                    `Code:${error.code},Signal:${error.signal},Stack:${error.stack}`
                  );
                  io.sockets.emit("newProjectReject", {
                    data: data,
                    message: `Failed on build: Check logs on ${new Date().toLocaleString()}`
                  });
                }
                if (stderr.length > 0) {
                  logger(data, `Error: ${stderr}`);
                  io.sockets.emit("newProjectReject", {
                    data: data,
                    message: `Failed on fetching imageID: Check logs on ${new Date().toLocaleString()}`
                  });
                }
                if (stdout.length > 0) {
                  const imageName = `${project.user.toLowerCase()}-${project.repoName.toLowerCase()}-${
                    data.container2.image
                  }-latest`;
                  const imageId = stdout.replace("\n", "");
                  docklogger({
                    imageName,
                    imageId,
                    user: project.user.toLowerCase()
                  });
                  io.sockets.emit("newProjectSuccess", {
                    data: data,
                    image: {
                      imageName,
                      imageId,
                      container: "container2"
                    },
                    message: `Built`
                  });
                }
              }
            );
          }
        }
      );
    }
  });

  // New Socket here
});
