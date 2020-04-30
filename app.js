var express = require("express");
var socket = require("socket.io");
var fs = require("fs");
var util = require("util");
const child_process = require("child_process");

const registryData = {
  ip: "127.0.0.1",
  port: 5000
};

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
        }-${
          data.container1.tag
        }:latest -t ${project.user.toLowerCase()}-${project.repoName.toLowerCase()}-${
          data.container1.image
        }-${data.container1.tag}:new -f docker-${data.container1.image} .`,
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
              `docker images --format="{{.Repository}}:{{.Tag}} {{.ID}}" |  grep "^${project.user.toLowerCase()}-${project.repoName.toLowerCase()}-${
                data.container1.image
              }-${data.container1.tag}:new" |  cut -d' ' -f2`,
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
                  const imageId = stdout.substr(0, stdout.length - 1);
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
        }:latest -t ${project.user.toLowerCase()}-${project.repoName.toLowerCase()}-${
          data.container2.image
        }:new -f docker-${data.container2.image} .`,
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
              `docker images --format="{{.Repository}}:{{.Tag}} {{.ID}}" |  grep "^${project.user.toLowerCase()}-${project.repoName.toLowerCase()}-${
                data.container2.image
              }:new" |  cut -d' ' -f2`,
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
                  }`;
                  const imageId = stdout.substr(0, stdout.length - 1);
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

  socket.on("newProjectRegister", data => {
    console.log("Registering", data);
    var imageRegister = child_process.exec(
      `docker tag ${data.image.imageName}:new ${registryData.ip}:${
        registryData.port
      }/${data.image.imageName}:new &&
      docker push ${registryData.ip}:${registryData.port}/${
        data.image.imageName
      }:new && 
      docker tag ${data.image.imageName}:latest ${registryData.ip}:${
        registryData.port
      }/${data.image.imageName}:latest && 
      docker push ${registryData.ip}:${registryData.port}/${
        data.image.imageName
      }:latest &&
      docker rmi ${data.image.imageId.substr(0, 5)}:new --force`,
      function(error, stdout, stderr) {
        if (error) {
          logger(
            data,
            `Code:${error.code},Signal:${error.signal},Stack:${error.stack}`
          );
          io.sockets.emit("newProjectRegisterReject", {
            data: data,
            message: `Failed on registering: Check logs on ${new Date().toLocaleString()}`
          });
        }
        if (stderr.length > 0) {
          logger(data, `Error: ${stderr}`);
          io.sockets.emit("newProjectRegisterReject", {
            data: data,
            message: `Failed on registering: Check logs on ${new Date().toLocaleString()}`
          });
        }
        if (stdout.length > 0) {
          const user = data.data.project.repoNameWithOwner.split("/")[0];
          docklogger({
            imageName: data.image.imageName,
            imageId: data.image.imageId,
            user: user.toLowerCase(),
            message: "Registered"
          });
          const newData = data;
          newData.message = "Registered";
          io.sockets.emit("newProjectRegisterSuccess", newData);
        }
      }
    );
  });

  socket.on("repoID", data => {
    // Forwarding socket data
    io.sockets.emit("repoID", data);
  });
});
