﻿let sqlite = require('sqlite3').verbose();

let db = new sqlite.Database('./AI_DB.db');

module.exports = {

    addUser(name, pw) {
        db.serialize(function () {
            db.run(`INSERT INTO user ('username', 'password') VALUES ('${name}', '${pw}');`);
        });
    },

    getUser(callback) {
        db.serialize(function () {
            db.get(`SELECT * FROM user;`, (err, row) => callback(row));
        });
    }
};