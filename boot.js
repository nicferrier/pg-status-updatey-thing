// Demo of using pgBoot - a keepie client - to start a server and initialize it
// The sql scripts use to initialze are kept in sql-scripts in this repository
// Copyright (C) 2018 by Nic Ferrier, ferrier.nic@gmail.com

const pgBoot = require('keepie').pgBoot;
const path = require("path");
const readline = require('readline');
const multer = require("multer");
const bodyParser = require('body-parser');

// PSQL command line
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});
            
function devCli(dbConfig) {
    rl.question("> ", (command) => {
        console.log("got a command");
        switch (command) {
        case "psql":
            dbConfig.psqlSpawn(devCli);
            break;
        case "help":
            console.log("this is a simple cli allowing launching of psql");
            devCli();
            break;
        default:
            console.log("type help");
            devCli();
            break;
        }
    });
}

// Config
const options = {
    webApp: true,
    cli: false
};

const dbConfig = {};

// Listen for the dbUp event to receive the connection pool
pgBoot.events.on("dbUp", async dbDetails => {
    let { pgPool, psql } = dbDetails;

    // when we get the pool make a query method available
    dbConfig.query = async function (sql, parameters) {
        let client = await pgPool.connect();
        try {
            let result = await client.query(sql, parameters);
            return result;
        }
        catch (e) {
            return {
                dberror: e
            };
        }
        finally {
            client.release();
        }
    };

    dbConfig.psqlSpawn = psql;
});


// Store the listener for passing on to other things - eg: tests
let listener = undefined;

pgBoot.events.on("dbPostInit", () => {
    pgBoot.events.emit("up", [listener, dbConfig]);
    console.log("pgboot webapp listening on ", listener.address().port);
    if (options.cli) {
        devCli(dbConfig);
    }
});

// Main
exports.main = function (listenPort) {
    pgBoot.boot(listenPort, {
        dbDir: path.join(__dirname, "dbfiles"),
        sqlScriptsDir: path.join(__dirname, "sql-scripts"),
        pgPoolConfig: {
            max: 3,
            idleTimeoutMillis: 10 * 1000,
            connectionTimeoutMillis: 5 * 1000
        },

        listenerCallback: function (listenerAddress, listenerService) {
            listener = listenerService;
        },

        appCallback: function (app) {
            app.use(bodyParser.json());

            app.set('json spaces', 4);

            // Dummy query function until we have a db up
            app.query = async function (sql, parameters) {
                if (dbConfig.query !== undefined) {
                    return dbConfig.query(sql, parameters);
                }
                throw new Error("no db connection yet");
            };

            // psqlweb if we want it
            if (options.webApp) {
                try {
                    const auth = require("simple-auth-4-express");
                    const psqlWebApp = require("psql-web-app");
                    psqlWebApp.init(app, {
                        middleware: auth.middleware(function (username, password) {
                            return true;
                        })
                    });
                }
                catch (e) {
                    console.error("pgboot webapp problem? just requires?", e.message);
                }
            }
            // end psqlweb

            app.get("/status", async function (req, res) {
                let query = "SELECT count(*) FROM log;";
                res.json({
                    up: true,
                    nictestRows: await app.query(query)
                });
            });

            app.post("/ric/timeline", function (req, res) {
                console.log("json?", req.body);
                res.sendStatus(204);
            });
        }
    });
}

exports.events = pgBoot.events;

// Ends here
