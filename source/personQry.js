const express = require('express');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 10480;
app.listen(port, () => {console.log(`\nポート${port}でLISTEN開始。`)});

const odbc = require("odbc");

app.use('/', (req, res, next) => {
    switch(req.method) {
        case 'GET':
            break
        case 'POST':
            break
        default:
            console.log(req.ip + 'から非サポートの' + req.method + 'メソッド要求。');
            res.status(405).send('405 Method Not Allowed.')
    }
    next()
});

app.get('/', (req, res) => {
    console.log('「/」へのGET要求。')
    res.sendFile(path.join(__dirname + '/index_rest.html'));
});

app.get('/api/v1/person/:regNo', (req, res) => {
    console.log(req.ip + 'から「/api/v1/person」へのGET要求。');
    odbc.connect('DSN=*LOCAL;CCSID=1208;', (err, conn) => {
        if (err) { throw err; }
        let stmt = "SELECT * FROM WEBSXXLIB.PERSON WHERE REGNO = " +
                   req.params.regNo;
        console.log(stmt);
        conn.query(stmt, (err, result) => {
            if (err) {
                res.status(500).
                    send('500 Internal Server Error.<br><br>' + err)
            } else {
                if (result.length == 0) {
                    res.status(404).send('404 Not found.');
                } else {
                    console.log(result.length + "件が検索された。");
                    res.send('{"single_rcd":' +
                             JSON.stringify(result, trimStrings).
                             substring(1).slice(0, -1) + '}');
                }
                conn.close((err) => {
                    if (err) { throw err; }
                })
            }
        })
    })
});

app.post('/api/v1/persons', (req, res) => {
    console.log(req.ip + 'から「/api/v1/persons」へのPOST要求。');
    console.log(req.body);
    odbc.connect('DSN=*LOCAL;CCSID=1208;', (err, conn) => {
        if (err) { throw err; }
        let stmt = "SELECT * FROM WEBSXXLIB.PERSON WHERE KNNAME LIKE '" +
                   req.body.kanaName + "%'";
        console.log(stmt);
        conn.query(stmt, (err, result) => {
            if (err) {
                res.status(500).
                    send('500 Internal Server Error.<br><br>' + err)
            } else {
                if (result.length == 0) {
                    res.status(404).send('404 Not found.');
                } else {
                    console.log(result.length + "件が検索された。");
                    res.send('{"rcd_cnt":' + result.length.toString() + 
                             ',"multi_rcds":' + 
                             JSON.stringify(result, trimStrings) + '}');
                }
                conn.close((err) => {
                    if (err) { throw err; }
                })
            }
        })
    })
});

function trimStrings(key, value) {
    if (typeof value === 'string') {
      return value.trimEnd();
    }
    return value;
}