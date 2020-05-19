var http = require('http');
var url = require('url');
const fs = require('fs');
const {keys} = JSON.parse(fs.readFileSync("keys.json", 'utf8'));
const chalk = require('chalk');
const { spawn } = require('child_process');


const domain = "http://sure.com/";  // this just makes the url happy

var active = {};

const ffmpeg_run = (key) => {
    var cmd = `ffmpeg -i "srt://localhost:8081?streamid=output/live/${key}&mode=listener" -c copy -f flv rtmp://localhost:1935/live/${key}`
    console.log(cmd);

    // Run the command in its own shell
    active[key] = spawn(cmd, {shell:true, detached: true}); 
    //console.log(active);
    active[key].on('exit', (code) => {
        console.log("Child " + key + " closed with code " + code);
        delete active[key];
    });

    active[key].stdout.on('dat', (data) => {
        //console.log("Child " + key + ":\n" + data);
    });

    active[key].stderr.on('data', (data) => {
        //console.log("Child " + key + ":\n" + data);
    });
}

http.createServer(function (req, res) {
    const myUrl = new URL(req.url, domain)
    console.log(myUrl.searchParams);
    key = myUrl.searchParams.get('srt_url').split(/\//).pop();

    if(!keys.includes(key)){
        console.log(chalk.redBright.bold("INVALID KEY: " + key));
        res.writeHead(400);
    }else{
        if(myUrl.searchParams.get('on_event') =='on_connect'){
            console.log(chalk.greenBright.bold("Accepted stream with key: " + key));
            if(!active.hasOwnProperty(key))
                ffmpeg_run(key);   // give it the stream key
            console.log('spawned ' + key);
        }

        res.writeHead(200);
    }
    res.end();
}).listen(8000);
