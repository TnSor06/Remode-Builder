const child_process = require("child_process");
function run(data) {
  const project = {
    user: `${data.project.repoNameWithOwner.split("/")[0]}`,
    repoName: `${data.project.repoNameWithOwner.split("/")[1]}`,
    repoURL: data.project.repoURL,
    secret: data.project.repoID
  };
  console.log(project);
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
        console.log(error.stack);
        console.log("Error code: " + error.code);
        console.log("Signal received: " + error.signal);
      }
      console.log("stdout: " + stdout, typeof stdout, stdout.length);
      console.log("stderr: " + stderr, typeof stderr, stderr.length);
    }
  );
  if ("container2" in data) {
    var databaseProcess = child_process.exec(
      `docker build --build-arg secret=${
        project.secret
      } --build-arg username=${project.user.toLowerCase()} -t ${project.user.toLowerCase()}-${project.repoName.toLowerCase()}-${
        data.container2.image
      }:latest -f docker-${data.container2.image} .`,
      function(error, stdout, stderr) {
        if (error) {
          console.log(error.stack);
          console.log("Error code: " + error.code);
          console.log("Signal received: " + error.signal);
        }
        console.log("stdout: " + stdout, typeof stdout, stdout.length);
        console.log("stderr: " + stderr, typeof stderr, stderr.length);
      }
    );
  }
}

// run({
//   project: {
//     repoNameWithOwner: "TnSor06/TestRepo4",
//     repoURL: "https://github.com/TnSor06/TestRepo4",
//     repoID: 251391890
//   },
//   container1: { image: "python", tag: "3.5" }
//   //   container2: { image: "mongo" }
// });
function ImId(imageName) {
  var imageId = child_process.exec(
    `docker images --format="{{.Repository}} {{.ID}}" |  grep "^${imageName}" |  cut -d' ' -f2`,
    function(error, stdout, stderr) {
      if (error) {
        console.log(error.stack);
        console.log("Error code: " + error.code);
        console.log("Signal received: " + error.signal);
      }
      console.log("stdout: " + stdout, typeof stdout, stdout.length);
      console.log("stderr: " + stderr, typeof stderr, stderr.length);
      return stdout;
    }
  );
}
