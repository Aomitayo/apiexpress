var debug = require('debug')('apiexpress.rest-spec.swagger');
var _ = require('lodash');
var path = require('path');
var fs = require('fs');

function readFromDirectory(specDir){
	debug('reading spec', specDir);
	if(typeof specDir === 'object'){
		return specDir;
	}

	if(!fs.existsSync(specDir)){
		throw new Error(specDir + ' Does not exist');
	}

	var resourceListing = JSON.parse(fs.readFileSync(path.join(specDir, '_resources.json'), 'utf8'));
	var resourceSpecs = {};
	fs.readdirSync(specDir, function(){}).forEach(function(fname){
		if('_resources.json' === fname || !/\.json$/.test(fname)){return;}
		var fpath = path.join(specDir, fname);
		var fStats = fs.statSync(fpath);
		if(!fStats.isFile()){return;}
		try{
			var key = fname.replace(/\.json$/,'');
			resourceSpecs[key] = JSON.parse(fs.readFileSync(fpath, 'utf8'));
		}
		catch(ex){
			debug('Failed to load api description %s', fpath);
			debug(ex.stack);
		}
	});
	
	return {resourceListing: resourceListing, resourceSpecs:resourceSpecs};
}

module.exports = function(options, api){
	var specs = options.specDir? readFromDirectory(options.specDir) : options.specs || {};

	var resourceListing = specs.resourceListing;
	var resourceSpecs = specs.resourceSpecs;

	debug('Putting resource routes');

	_.forEach(resourceSpecs, function(spec){
		_.forEach(spec.apis, function(apiSpec){
			_.forEach(apiSpec.operations, function(operation){
				var verb = operation.method.toLowerCase();
				var routePath = path.join(spec.basePath, apiSpec.path || '');

				//translate the url template by changing {paramName} to :paramName
				_.forEach(routePath.match(/\{\w+\}/g), function(p){
					routePath = routePath.replace(p, p.replace('{', ':').replace('}', ''));
				});
				//router[verb](routePath, SpecRouter.routeHandler(operation, api, spec, resourceListing));
				debug('Routing %s %s to %s', verb, routePath, operation.nickname);
				
				api.http.router[verb](routePath, function(req, res, next){
					debug('running %s %s %s', verb, routePath, operation.nickname);

					req.api = api;
					req.restSpec = {
						specType: 'swagger',
						resourceListing: resourceListing,
						resourceSpecs:resourceSpecs
					};

					var action = api.action(operation.nickname);
					if(action){
						return action.http.run(req, res, next);
					}
					else{
						req.send(404);
					}
				});
				debug(api.http.router);
			});
		});
	});
};