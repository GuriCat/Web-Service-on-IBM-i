const express = require('express');
const app = express();
app.use(express.json());
const port = process.env.PORT || 10480;
app.listen(port, () => {console.log(`\nポート${port}でLISTEN開始。`)});

const odbc = require("odbc");

app.get('/favicon.ico', function(req, res) { 
    res.status(204);
    res.end();    
});

app.get('/:regNo', (req, res) => {
    console.log(req.ip + 'から"' + req.params.regNo + '"の検索要求。');
    odbc.connect('DSN=*LOCAL;CCSID=1208;', (err, conn) => {
        let stmt = "SELECT * FROM WEBSXXLIB.PERSON WHERE REGNO = " + req.params.regNo;
        conn.query(stmt, (err, result) => {
            if (err) {
                res.status(500).send('検索エラー。');
            } else {
                if (result.length == 0) {
                    res.status(404).send('データなし。');
                } else {
                    res.send(JSON.stringify(result));
            }}
            conn.close((err) => {
                if (err) { throw err; }
            })
        })
    })
});