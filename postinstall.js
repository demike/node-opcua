const fs = require("fs");
const runScript = require('@npmcli/run-script');
var path = require('path');

const packages = "./packages";
const root_node_modules = "../"

// Loop through all the files in the temp directory
fs.readdir(packages, function (err, files) {
  if (err) {
    console.error("Could not list the directory.", err);
    process.exit(1);
  }

  files.forEach(function (file, index) {
    // Make one pass and make the file complete
    const fromPath = path.join(packages, file);
    var toLink = path.join(root_node_modules, file);

    fs.stat(fromPath, function (error, stat) {
      if (error) {
        console.error("Error stating file.", error);
        return;
      }

      if (stat.isFile())
        console.log("'%s' is a file.", fromPath);
      else if (stat.isDirectory())
        console.log("'%s' is a directory.", fromPath);

      fs.symlink(toLink,fromPath, error => {
        if (error) {
          console.error("Dir linking error:", error);
        } else {
          console.log("Linked Dir '%s' to '%s'.", fromPath, toPath);


          
        }
      });
    });
  });
});

function runPostinstall(fromPath) {
    runScript({
        event: 'postinstall',
        path:  fromPath
    })
}