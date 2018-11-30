const boot = require("./boot.js");
const http = require("http");
const EventSource = require("eventsource");

async function test() {
    const [listener, dbConfig] = await new Promise((resolve, reject) => {
        boot.events.on("up", resolve);
        boot.main();
    });

    const port = listener.address().port;

    const es = new EventSource(`http://localhost:${port}/ric/stream`);
    es.addEventListener("log", esEvt => {
        const {type, data:rawData, lastEventId, origin} = esEvt;
        try {
            const data = JSON.parse(rawData);
            console.log("event data", data);
        }
        catch (e) {
            console.log("test.js - error parsing JSON from log event:", e);
        }
    });

    const results = await dbConfig.query("select * from log;");
    console.log("rows count before", results.rows.length);

    const result = await new Promise((resolve, reject) => {
        let buffer = "";
        const h = http.request({
            method: "POST",
            host: "localhost",
            port: port,
            path: "/ric/timeline",
            headers: {
                "content-type": "application/json"
            }
        }, response => {
            response.on("end", data => { resolve(data); });
            response.pipe(process.stdout);
        });
        h.end(JSON.stringify({
            user: "nicferrier",
            timestamp: new Date().valueOf(),
            status: "hello, my first status update",
            otherStuff: "blah" // will be filtered out in the POST
        }));
    });

    const getRes = await new Promise((resolve, reject) => {
        const h = http.request({
            method: "GET",
            host: "localhost",
            port: port,
            path: "/ric"
        }, response => {
            response.on("end", data => { resolve("done"); });
            response.pipe(process.stdout);
        });
        h.end();
    });

    console.log("result>", result);
    es.close();
    listener.close();
    await dbConfig.pgPool.end();
    const exitCode = await new Promise((resolve, reject) => {
        dbConfig.pgProcess.on("exit", resolve);
        dbConfig.pgProcess.kill(process.SIGTERM);
    });
    return exitCode;
}

test().then(exitCode => console.log("postgres done, exit:", exitCode));

// End

