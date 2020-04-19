const fs = require("fs");
const util = require("util");
const npm = require('npm');
var path = require('path');

const fs_stat = util.promisify(fs.stat);
const fs_readdir = util.promisify(fs.readdir);

const current = process.cwd();


const packagesFolder = path.join(current,"./packages");
const root_node_modules = "../node_modules"//"../"
const target_project = path.join(root_node_modules,'../');


/**
 * @type { {[key: string]: string} }
 */
let thirdPartyDeps = {};

/**
 * @type { {version: string, deps: {[key: string]: string}  }[] }
 */
let internalDeps = {};

/**
 * @type { {[key: string]: string} }
 */
let allDeps = {};

async function execute() {

  const files = await fs_readdir(packagesFolder);
  createDependencyLists(files);
  await installPackages(thirdPartyDeps);
  linkDependencies(internalDeps,thirdPartyDeps);
//  console.log(internalDeps);
//  console.log(allDeps);
}

function createDependencyLists(files) {
  files.forEach(file => {
    const fullPath = path.join(packagesFolder, file, 'package.json');
    try {
      if (fs.existsSync(fullPath)) {
        console.log("found package: '%s'", fullPath);

        let pkg = require(fullPath);
        internalDeps[pkg.name] = {version: pkg.version, deps: pkg.dependencies};
  
        Object.assign(allDeps, pkg.dependencies);
  
      }
    } catch(err) {
      console.log(err);
    }
  
  });



  // find third party deps
  Object.entries( allDeps ).forEach( ([ name, version]) => {
    if(! (name in internalDeps)) {
      thirdPartyDeps[name] = version;
    }
  });
}

// runPostinstall(fromPath);
/**
 * 
 * @param { {[key:string]: string}} thirdPartyDeps { dep : version }
 */
function installPackages(dependencyMap) {
  console.log(dependencyMap);
    return new Promise( (resolve, reject) => {
      const packages = Object.entries(dependencyMap).map( ([name, version]) => name + '@' + version );
      console.log(packages);
    
      
      process.chdir(target_project);
      npm.load({
          loaded: false}, (err) => {
              npm.commands.install(packages, (error,data) => {
                  if(error) {
                      console.log('install error:' + error);
                      reject(error);
                  } 
                  if (data) {
                      console.log(data);
                      resolve(data);
                  }
              });
          }
      );
    });
}

/**
 * 
 * @param { {version: string, deps: {[key:string]: string} }[] } internalDeps 
 * @param { {[string]:string} } thirdPartyDeps 
 */
function linkDependencies(internalDeps, thirdPartyDeps) {

  Object.entries(internalDeps).forEach(([packageName, package]) => {
    if(!package.deps) {
      return;
    }
    Object.entries(package.deps).forEach( ([depName,version]) => {
      if(depName in internalDeps) {
        // internal dependency
        fs.symlink(path.join(packagesFolder,depName),path.join(packagesFolder,packageName,'node_modules',depName), () => undefined);
        console.log(packageName + " - internal dep: " + depName);
      } else {
        // external dependency
        console.log(packageName + " - external dep: " + depName);
      }
    })
  })
}



function runPostinstall(projectPaths) {
    npm.commands.runScript({
        event: 'postinstall',
        path:  fromPath
    })
}

execute();