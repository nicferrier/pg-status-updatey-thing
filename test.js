const boot = require("./boot.js");
const http = require("http");

async function test() {
    const [listener, dbConfig] = await new Promise((resolve, reject) => {
        boot.events.on("up", resolve);
        boot.main();
    });

    const port = listener.address().port;

    const results = await dbConfig.query("select * from log;");
    console.log("rows before>", results.rows);

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
        // h.write();
        h.end("[0,1,2,3]");
    });

    console.log("result>", result);
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

