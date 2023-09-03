#!/QOpenSys/pkgs/bin/python

from urllib.parse import parse_qs
import json
import pyodbc
import pandas as pd

JSON_String = ""
JSON_Count = 0
err = ""

def exec_SQL(stmt):
    global JSON_String
    global JSON_Count
    global err

    conn = pyodbc.connect(
        'Driver={IBM i Access ODBC Driver}; '
        'System=localhost; '
        'UID=websxx; '
        'PWD=websxx; '
        )
    cursor = conn.cursor()
    try:
        df = pd.read_sql(stmt, conn)
        JSON_Count = len(df)
        if JSON_Count == 0:
            return 404
        else:
            df = df.astype({'REGNO': int, 'BIRTHD': int})
            JSON_String = \
                df.applymap(lambda x: x.strip() \
                if isinstance(x, str) \
                else x).to_json(orient='records')
    except Exception as e:
        err = str(e)
        return 500
    finally:
        cursor.close()
        conn.close()
    return 200

def app(environ, start_response):
    global JSON_String
    global JSON_Count
    global err

    reqMethod = environ.get('REQUEST_METHOD')
    qs_dict = parse_qs(environ.get('QUERY_STRING'))
    content_len = int(environ.get('CONTENT_LENGTH', 0))

    if reqMethod == "GET":
        in_regNo = qs_dict.get('regNo', [''])[0]
        sql_rc = exec_SQL( \
            "select * from websxxlib.person where REGNO=" + \
            str(in_regNo))
    elif reqMethod == "POST":
        body = environ.get('wsgi.input').read(content_len)
        req_JSON = json.loads(body.decode('utf-8'))
        in_kanaName = (req_JSON['kanaName'].encode('utf-16be')) \
                      .hex().encode('ascii')
        sql_rc = exec_SQL( \
            "select * from websxxlib.person where KNNAME like UX" \
            + str(in_kanaName)[1:][:-1] + "0025'")
    else:
        sql_rc = 405

    if sql_rc == 200:
        start_response('200 OK', [('Content-type', 'text/json')])
        if reqMethod == "GET":
            outStr = '{"single_rcd":' + JSON_String[1:][:-1] + '}'
            outStr = outStr.encode().decode('unicode-escape')
            return [outStr.encode('utf-8')]
        else:
            outStr = '{"rcd_cnt":' + str(JSON_Count) + \
                     ',"multi_rcds":' + JSON_String + '}'
            outStr = outStr.encode().decode('unicode-escape')
            return [outStr.encode('utf-8')]
    elif sql_rc == 404:
        start_response('404 Not found', \
                       [('Content-type', 'text/plain')])
        return '404 Not found.\r\n'
    elif sql_rc == 405:
        start_response('405 Method Not Allowed', \
                       [('Content-type', 'text/plain')])
        return '405 Method Not Allowed.\r\n'
    elif sql_rc == 500:
        start_response('500 Internal Server Error', \
                       [('Content-type', 'text/plain')])
        return '500 Internal Server Error.\r\n' + err

if __name__ == '__main__':
    from flup.server.fcgi import WSGIServer
    WSGIServer(app).run()