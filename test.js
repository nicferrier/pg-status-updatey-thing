const boot = require("./boot.js");

async function test() {
    const [listener, dbConfig] = await new Promise((resolve, reject) => {
        boot.events.on("up", resolve);
        boot.main();
    });
    console.log("port", listener.address().port);
    const results = await dbConfig.query("select * from log;");
    console.log(results);
}

test().then();

// End

