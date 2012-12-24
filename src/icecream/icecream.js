var path       = require('path');
var urlHelper  = require("url");
var fs         = require('fs');
var connect    = require('connect')
var http       = require('http');
var Dispatcher = require('./dispatcher');
var cluster    = require('cluster');

var icecream = module.exports = {}

icecream.createServer = function(){
    this.init();
    this.server  = connect();
    return this;
}

icecream.init = function(){
    this.engines = {};
    this.config  = {};
    this.caches  = {};  
    this.engine('jade', require('jade').renderFile);
    this.engine('ejs', require('ejs').renderFile);
    this.set('defaultEngine', 'ejs');
    this.set('appRoot',  __dirname +'/../app');
    this.set('defaultController', 'page');
    this.set('defaultAction',  'index');
    this.set('suffix',  '');
    this.version = JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8')).version;
    this.dispatcher = new Dispatcher(this);
    this.loadHelpers();
    this.loadLibraries();
}

icecream.use = function(func){
    this.server.use(func);
    return this;
}

icecream.listen = function(port){     
    var self = this;
    this.server.use(connect.query());
    this.server.use(connect.bodyParser());
    this.server.use(function(req, res){
        self.dispatcher.dispatch(req, res);
    });

    if (this.get("cluster")==true && cluster.isMaster) {
        console.log("cluster enabled...");
        cluster.on('exit', function(worker, code, signal) {
            cluster.fork();
        }); 
        var cpus = require('os').cpus().length;
        for (var i = 0; i < cpus; i++) {
           cluster.fork();
        }
    } else {
        this.server.listen(port);
    }
    return this;
}

icecream.get = function(key){
    return this.config[key];
}

icecream.set = function(key,val){
    this.config[key] = val;
}

icecream.engine = function(ext,engine){
    this.engines[ext] = engine;
}

icecream.share = function(shareObject){
    this.shareObject = shareObject;
}

icecream.getObject = function(cache, key){
    if(!this.caches[cache])
        return null;
    return this.caches[cache][key];
}

icecream.setObject = function(cache, key, object){
    if(!this.caches[cache])
        this.caches[cache] = {};
    this.caches[cache][key] = object;
}

icecream.loadHelpers = function(){

}

icecream.loadLibraries = function(){

}