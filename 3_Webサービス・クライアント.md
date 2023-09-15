# 3 Webサービス・クライアント

この章では、IBM i上で稼働するWebサービスのクライアント実装例を解説します。

下図は「2.3.1 Webサービス・クライアント実装」の表をシンプルに模式化したものです。以下ではⒶからⒸまで順番にWebサービス・クライアントの実装例を解説します。Ⓓ、Ⓔ、Ⓕは割愛し、参考として、CLP+curl＋Python、および、CLP+curl＋SQLの例を紹介します。

![3_Webサービス・クライアント.jpg](/files/3_Webサービス・クライアント.jpg)

<p>　</p>

---

<br>

## 3.1 Ⓐ curlコマンドによるクライアント

curlは、HTTPを含むさまざまなプロトコルでデータを転送するコマンドです。多彩な機能と豊富なオプションを持ち、コマンド一つでWebサービスにアクセスできます。

?> 「curl」は「カール」と発音。実行例の「-s」は進捗を非表示とするオプション。詳細はcurlのホームページ(https://curl.se/ )などを参照。

<br>

この節では気象庁の「天気予報API」にアクセスして情報を取得します。下記のようなURLをリクエストすれば天気情報がJSON形式のファイルで取得できます。

?> 気象庁の「天気予報API」は非公式APIで仕様も非公開。https://twitter.com/e_toyoda/status/1364504338572410885 に「仕様の継続性や運用状況のお知らせを気象庁はお約束していないという意味で、APIではない」と記載有り。2023/3月時点で情報が取得できないエリアが存在する。

* 天気概況（明後日まで）
  * https://www.jma.go.jp/bosai/forecast/data/overview_forecast/エリア.json
* 天気予報（明後日まで・週間）
  * https://www.jma.go.jp/bosai/forecast/data/forecast/エリア.json
* 天気概況（週間）
  * https://www.jma.go.jp/bosai/forecast/data/overview_week/エリア.json

<font size="-2">
※ 気象庁のエリア(一次細分区域)一覧は「気象警報・注意報や天気予報の発表区域」(https://www.jma.go.jp/jma/kishou/know/saibun/ )を参照。
</font>

<br>

気象庁のエリアは下表の例のような階層になっているようです。

|階層名|階層|キー|名前(name)|親キー(parent)|子キー(children)|
|------|---|----|---------|--------------|---------------|
|centers|地方|010300|関東甲信地方|(なし)|080000～200000|
|offices|都道府県|130000|東京都|010300|130010～130040|
|class10s||130010|東京地方|130000|130011～130015|
|class15s||130011|２３区西部|130010|1310100～1312000|
|class20s|市区町村|1310100|千代田区|130011|(なし)|

<font size="-2">
※ 階層「class20s」の値は自治体コード＋「00」とされている様子。
</font>

<br>

<p>　</p>

### (参考) 全国の「天気情報」エリア

下図は気象庁の天気情報エリア情報の、「offices」階層のキー(都道府県レベル)を示します。

![参考_全国の「天気情報」エリア.jpg](/files/参考_全国の「天気情報」エリア.jpg)

<br>

### 3.1.1 sshでcurlを実行

PASEシェルから引き数にURLを指定してcurlを実行すると、URL内で指定したエリア(下記実行例の「030000」は岩手県)の「天気概況」が取得できます。

```bash
bash-5.1$ curl -s 'https://www.jma.go.jp/bosai/forecast/data/overview_forecast/030000.json' | jq
{
  "publishingOffice": "盛岡地方気象台",
  "reportDatetime": "2023-03-14T16:31:00+09:00",
  "targetArea": "岩手県",
  "headlineText": "",
  "text": "高気圧が本州付近を覆っています。\n\n岩手県は、晴れています。\n\n１４日夜は、高気圧に覆われて、晴れるでしょう。\n\n１５日は、高気圧に覆われて、晴れる見込みです。\n\n＜天気変化等の留意点＞\n１５日は、 特にありません。"
}
bash-5.1$
```

この例ではcurlで取得したデータをjqで加工して出力しています。

?> jqは軽量で柔軟なコマンドラインJSONプロセッサでで。JSONデータをスライス、フィルタリング、マッピング、変換可能。詳細はGitHubのhttps://stedolan.github.io/jq/ などを参照。

「天気予報API」では、天気情報を取得する際に指定する「エリアコード」がJSON形式のファイル(URLはhttps://www.jma.go.jp/bosai/common/const/area.json )に記載されています。

VS Codeでこのファイルを開いてフォーマットすると、下図のような階層構造がで表示されます。

![3.1.1_sshでcurlを実行.jpg](/files/3.1.1_sshでcurlを実行.jpg)

「天気情報API」では、階層「offices」のキー(例では「011000」)を指定すると情報が取得できる場合が多いようです。

<br>

jqでエリアコードと名称の一覧をCSVで出力するには次のように実行します。画面出力をファイルにリダイレクトしてテーブルを作成しても良いでしょう。

```bash
bash-5.1$ cat area.json | jq -r '.offices | to_entries | map({"areacode":(.key|tostring),"areaname":(.value.name)}) | .[] | [.areacode,.areaname] | @csv'
"011000","宗谷地方"
"012000","上川・留萌地方"
"013000","網走・北見・紋別地方"
"014030","十勝地方"
～～～～～～～～～～～～～～～ 後略 ～～～～～～～～～～～～～～～～～
```
<br>

下表は上記コマンドでjqが行っている処理の概要です。

![3.1.1_sshでcurlを実行2.jpg](/files/3.1.1_sshでcurlを実行2.jpg)

次の例のように、名称の一部(下の例では「東京」)を含むデータの抽出もできます。

```bash
bash-5.1$ cat area.json | jq -r '.offices | to_entries | map({"areacode":(.key|tostring),"areaname":(.value.name)}) | .[] | select(.areaname | contains("東京"))'
{
  "areacode": "130000",
  "areaname": "東京都"
}
bash-5.1$
```
<br>

PythonやNode.jsなどのWebアプリケーションでJSONを処理する際に、前／後処理の実施、テストデータの作成、入出力JSONデータの確認などにjqを利用すれば、効率的に開発が進められるでしょう。

<br>

### 3.1.2 CLプログラムからcurlを実行

次のようなCLプログラムでcurlを呼び出し、結果を5250画面に表示できます。

**(CLプログラムWEBSxxLIB/WEATHERCLP)**

```
0001.00              PGM        PARM(&AREACODE)                                       
0002.00              DCL        VAR(&AREACODE) TYPE(*CHAR) LEN(32)                    
0003.00              DCL        VAR(&OUTFILE) TYPE(*CHAR) LEN(128)                    
0004.00              DCL        VAR(&QSHCMD) TYPE(*CHAR) LEN(1000)                    
0005.00                                                                               
0006.00              CHGJOB     CCSID(1399)                                           
0007.00              ADDENVVAR  ENVVAR(QIBM_MULTI_THREADED) VALUE(Y) REPLACE(*YES)    
0008.00              ADDENVVAR  ENVVAR(QIBM_QSH_CMD_ESCAPE_MSG) VALUE(Y) REPLACE(*YES)
0009.00                                                                               
0010.00              CHGVAR     VAR(&QSHCMD) VALUE('/QOpenSys/usr/bin/sh -c +         
0011.00                           "/QOpenSys/pkgs/bin/curl -s +                       
0012.00                           https://www.jma.go.jp/bosai/forecast/data/o+        
0013.00                           verview_forecast/' |< &AREACODE |< '.json +         
0014.00                           | /QOpenSys/pkgs/bin/jq -rM +                       
0015.00                           ''.reportDatetime, .targetArea, .text'' +           
0016.00                           > /home/WEBSXX/' |< &AREACODE |< '.txt"')           
0017.00              QSH        CMD(&QSHCMD)                                          
0018.00              MONMSG     MSGID(QSH0000) EXEC(DO)                               
0019.00                SNDPGMMSG  MSG(' スクリプト実行時にエラー。 ')                 
0020.00                GOTO       CMDLBL(EXIT)                              
0021.00              ENDDO                                                  
0022.00              DSPF       STMF('/home/WEBSXX/' |< &AREACODE |< '.txt')
0023.00                                                                     
0024.00  EXIT:       ENDPGM                                                 
```

* 7～8行目：Qshell実行環境を、マルチスレッド許可、QSHメッセージをエスケープで出力に設定。
* 10～16行目：Qshell経由でパラメーターで指定されたエリアの天気情報を取得してSTMFに書き出すPASEコマンド文字列を組み立て。jqの「M」で出力文字列ｗをモノクロ(文字色エスケープなし)を指定。
* 22行目：PASEコマンドの標準出力(文字コードUTF-8)が書き込まれたSTMFをDSPFコマンドで表示。

エリアコードをパラメーターに指定して実行すると天気情報が表示されます。
<br>

```
> CALL PGM(WEATHERCLP) PARM(('050000'))

  表示  : /home/WEBSXX/050000.txt                                        
  レコード        1 OF       9 BY  18                       カラム     1 
  制御   :                                                               
....+....1....+....2....+....3....+....4....+....5....+....6....+....7...
 ************* データの始め ****************                             
2023-04-03T10:32:00+09:00               ← キー「reportDatetime」の値
 秋田県                                  ← キー「targetArea」の値
 東北地方は、高気圧に覆われています。    
                                      
 秋田県は、晴れています。                 ← キー「text」の値
～～～～～～～～～～～～～～～ 後略 ～～～～～～～～～～～～～～～～～
```

<br>

### (参考) Qshell環境変数

CLからPASE環境を起動する際、この動作を制御する環境変数がいくつか提供されています。その中で主要と思われる環境変数を下表に示します。

?> 全ての定義済み環境変数はIBM Docsの「変数」(https://www.ibm.com/docs/ja/i/7.5?topic=language-shell-variables )を参照。

|環境変数|説明|初期値|
|--------|---|-----|
|QIBM_QSH_CMD_ESCAPE_MSG|値が「Y」の場合、QSH0006およびQSH0007 メッセージが常にエスケープ・メッセージとして送信され、終了状況がゼロより大きいときは、QSH0005メッセージもエスケープ・メッセージとして送信される|なし|
|QIBM_QSH_CMD_OUTPUT|設定値によりQSH CLコマンドからの出力を制御。<br>・「STDOUT」：出力をCランタイム端末セッションに表示<br>・「NONE」出力を廃棄<br>・「FILE」：出力を指定したファイルに書き出し<br>・「FILEAPPEND」：出力を指定されたファイルに追加|STDOUT|
|QIBM_MULTI_THREADED|qshが開始するプロセスが複数のスレッドを作成できるかどうかを決定。この変数の値が「Y」であれば、qshが開始するすべての子プロセスがスレッドを開始可能|N|
|QSH_REDIRECTION_TEXTDATA|リダイレクトに指定されたファイルから読み取るデータ、またはそのファイルに書き込むデータを、テキスト・データとして取り扱うか(値が「Y」)、2進データとして取り扱うか(値が「Y」以外)を決定|Y|

CLプログラム内でQSHコマンドのエラーをMONMSGコマンドで検出するには、環境変数QIBM_QSH_CMD_ESCAPE_MSGを「Y」に設定する必要があります。

ファイル「STDOUT」をOVRDBFコマンドで指定変更すれば、通常は画面に表示される標準出力をファイルに書き出すことができます。同様に、環境変数QIBM_QSH_CMD_OUTPUTに直接「FILE=<i>(IFSパス名)</i>」と指定すれば、そのファイルに標準出力が書き出されます。

?> 同様の手法はIBMサポート文書「CL Program that Calls QSHELL to Run a Java Class」(https://www.ibm.com/support/pages/cl-program-calls-qshell-run-java-class )などに利用例有り。

IBMはPASEをQshellの子プロセスとして起動する方法を推奨していまが、QSHコマンドからPASEプログラムを呼び出す場合、環境変数QIBM_MULTI_THREADEDを「Y」に変更しないと動作しない場合があります。

?> 起動方法の詳細はIBMサポート文書「How to Call PASE Commands/Scripts from a Command Line, CL Program, or in a Submitted Job」(https://www.ibm.com/support/pages/how-call-pase-commandsscripts-command-line-cl-program-or-submitted-job )を参照。

<br>

### <u>ワーク2 curlコマンドによるWebサービスの利用</u>

<br>

<font color="blue">
ワークでは登録不要／無料／商利用可の「公開Webサービス」を利用します。ワークの実施にあたっては下記を遵守ください。

* 短時間に多くのリクエストを発行しない
* API仕様と大きく異なるリクエストを行わない
* Webサービス／サーバーが利用不可の場合はワークをスキップする
</font>

<br>

**□ W2-1.** sshクライアントからIBM iにログインし、curlコマンドで任意の地域の天気情報を取得して表示。

```bash
bash-5.1$ curl -s 'https://www.jma.go.jp/bosai/forecast/data/overview_forecast/020000.json' | jq
{
  "publishingOffice": "青森地方気象台",
  "reportDatetime": "2023-03-15T10:32:00+09:00",
  "targetArea": "青森県",
  "headlineText": "",
  "text": "高気圧が本州付近を覆っています。\n\n青森県は、晴れとなっています。\n\n１５日は、高気圧に覆われて、晴れるでしょう。\n\n１６日は、前線が東北地方を通過するため、曇りや晴れで、昼前から昼過ぎにかけて雨の 降る所が多くなる見込みです。"
}
bash-5.1$
```

**□ W2-2.** (オプション) jqコマンドにパラメーターを追加し、キー「targetArea」および「text」の値のみを表示。

?> ヒント：CLプログラム「WEATHER」の17～18行目を参照。

**□ W2-3.** CLプログラムからcurlコマンドで天気情報を取得して表示。

* 5250画面からコマンド「WRKMBRPDM FILE(WEBSxxLIB/SOURCE)」を実行し、メンバー「WEATHERCLP」をオプション14でコンパイル。または、下記コマンドで直接コンパイル。

```
> CRTCLPGM PGM(WEBSxxLIB/WEATHERCLP) SRCFILE(WEBSxxLIB/SOURCE)  
   プログラム WEATHERCLP がライブラリー WEBSXXLIB に作成された。
```

* 任意のエリアコードをパラメーターに指定してプログラムを実行し、天気情報が画面に表示される事を確認。

**□ W2-4.** (オプション) curlなどのPASEアプリケーションから、CLやRPGのプログラムが値を受け取る方法を考察。

**□ W2-5.** (オプション) curlコマンドで他の公開Web APIを利用。

* 「郵便番号検索API」(http://zip.cgis.biz/ )で7桁の郵便番号(例では「1630449」)からCSVおよびXML形式で住所を取得。

**(CSV形式の取得と整形例)**

```bash
bash-5.1$ curl -s http://zip.cgis.biz/csv/zip.php?zn=1630449 | iconv -f EUC-JP -t UTF-8 | sed -e '1d' | cut -d ',' -f 5-7 | sed -e 's/[^"]*"\([^"]*\)"[^"]*/\1/g'
東京都新宿区西新宿新宿三井ビル（４９階）
```

<font size="-2">
※	サーバーから返されるデータの文字コードがEUCなのでiconvでUTF-8に変換。<br>
※	sedを利用して「1d」で1行目を削除。<br>
※	cutで「,」を区切り文字とし、CSV行の5～7番目の項目を抽出。<br>
※	sedの正規表現「s/[^"]*"\([^"]*\)"[^"]*/\1/g」でダブルクォーテーション内の文字列を抽出。<br>&nbsp;nbsp;nbsp;「[^"]*」は「"」を含まない文字列にマッチする。取り出す文字列を「\(」と「\)」でくくり、「\1」で参照。
</font>

**(XML形式の取得と整形例)**

```bash
bash-5.1$ curl -s http://zip.cgis.biz/xml/zip.php?zn=1630449 | xmllint --xpath "//*[@state or @city or @address]" - | sed 's/[^"]*"\([^"]*\)"[^"]*/\1/g'
東京都新宿区西新宿新宿三井ビル（４９階）
```

<font size="-2">
※	xmllintでXMLから住所要素の値のみ抽出。xpathの「//」は起点となるノードの子孫すべての集合を表し、末尾の「-」は標準(入)出力を意味する。
</font>

* 「Wikipedia API」(https://m.mediawiki.org/wiki/API:REST_API/Reference )で任意の検索語からWikipediaの該当ページの抜粋をJSON形式で取得。

下記の例では「佐々木 岩手 野球」を検索語として、最大3件までWikipediaの項目を検索。

```bash
bash-5.1$ curl -s --get --data-urlencode "q=佐々木 岩手 野球" -d "limit=3" "https://ja.wikipedia.org/w/rest.php/v1/search/page" | sed 's/<[^>]*>//g' | jq -r '.pages[] | "タイトル:" + .title, "概要:" + .excerpt'
タイトル:岩手県
概要:ウィキデータのデータ Category:岩手県 陸中国 陸前国 陸奥国 岩手県カテゴリのカテゴリツリー 岩手県庁 岩手県の観光地 岩手県の県道一覧 岩手県高等学校一覧 岩手県高等学校の廃校一覧 岩手県中学校一覧 岩手県中学校の廃校一覧 岩手県小学校一覧 岩手県出身の人物一覧 岩手・宮城内陸地震 日本の地方公共団体一覧
タイトル:佐々木朗希
概要:佐々木 朗希（ささき ろうき、2001年11月3日 - ）は、岩手県陸前高田市出身のプロ野球選手（投手）。右投右打。千葉ロッテマリーンズ所属。 愛称は令和の怪物。 日本プロ野球（NPB）記録かつ世界記録となる13者連続奪三振、プロ野球タイ記録の
～～～～～～～～～～～～～～～ 後略 ～～～～～～～～～～～～～～～～～
```

<font size="-2">
※	curlのパラメーターに漢字など英数字以外の文字を使用する場合は「--data-urlencode」を指定。
※	sedでHTMLタグ(「<」と「>」、およびこれらで囲まれた部分)を除去。
</font>

**□ W2-6.** (オプション) □W2-5で、整形処理(水色以外)を指定せずにcurl部分のみを実行し、サーバーが返す内容を出力し、整形後と比較。

<br>

## 3.2 Ⓑ Webブラウザによるクライアント

Webブラウザ(＋Javascript)を利用すれば、容易にWebサービスを利用できます。Webサービスの標準的なデータ形式であるJSONは「JavaScript Object Notation」(JavaScriptのオブジェクト記法)の略称であり、JacaScriptを最初に搭載したのが古のNetscapeブラウザであることを思い起こせば、これらの親和性の高さがうかがえるでしょう。

WebサービスはWebの標準技術を利用しており、WebブラウザをクライアントとしたSNSや各種Webアプリケーションなどで広く使われています。Webブラウザをクライアントとして利用すれば、既存のWebサイトにWebサービスから得られる情報を追加して利便性を高めたり、WebサービスにアクセスするJavaScriptを用意してテストを行ったりと、容易に生産性の向上が図れるでしょう。

<br>

下図のように、Webブラウザから「天気情報」サービスにアクセスして画面に表示できます。ブラウザが搭載する「開発者ツール」を利用すれば、HTMLのソースや構造、コンソール・メッセージ、ネットワークの詳細などを確認できます。

![3.2_Ⓑ_Webブラウザによるクライアント.jpg](/files/3.2_Ⓑ_Webブラウザによるクライアント.jpg)

<br>

以下に「天気情報」を取得するHTMLのソースを示します。表現力に優れたHTML/CSSと、高機能なJavascript言語に習熟すれば、使いやすく表現力の高いWebサイトが構築できるでしょう。

**(HTMLファイル GetWebService.html)**

```html
0001 <!DOCTYPE html>
0002 <html>
0003 
0004 <head>
0005     <meta charset="utf-8">
0006     <title>天気情報取得</title>
0007 </head>
0008 
0009 <body>
0010     <h1>天気情報取得</h1>
0011     <p>エリアコードを入力し、「情報を取得」をクリック。</p>
0012     <form id="input_form">
0013         <input type="text" , id="areacode" placeholder="6桁のコード" />
0014         <input type="submit" value="情報を取得" />
0015         <input type="button" id="reload" value="クリア" />
0016     </form>
0017     <br>
0018     <hr> <br>
0019     <p id="weather_time"></p>
0020     <p id="weather_areaname"></p>
0021     <p id="weather_info"></p>
0022     <p id="error_msg"></p>
0023 
0024     <script>
0025         document.addEventListener('DOMContentLoaded', function () {
0026             document.getElementById("reload").addEventListener("click", function () {
0027                 window.location.reload()
0028             })
0029         })
0030 
0031         var form = document.getElementById('input_form')
0032 
0033         form.addEventListener('submit', function (e) {
0034             e.preventDefault()
0035 
0036             fetch("https://www.jma.go.jp/bosai/forecast/data/overview_forecast/" +
0037                 document.getElementById('areacode').value + ".json")
0038                 .then(res => res.json())
0039                 .then(weather_json => {
0040                     console.log(weather_json)
0041                     weather_time.innerHTML = weather_json.reportDatetime
0042                     weather_areaname.innerHTML = weather_json.targetArea
0043                     weather_info.innerHTML = weather_json.text
0044                     error_msg.innerText = ""
0045                 })
0046                 .catch(err => {
0047                     weather_time.innerHTML = ""
0048                     weather_areaname.innerHTML = ""
0049                     weather_info.innerHTML = ""
0050                     error_msg.innerText = "情報を取得できませんでした：" + err
0051                 })
0052         })
0053     </script>
0054     
0055 </body>
0056 
0057 </html>
```

* 25～29行目：「クリア」ボタンをクリックした時にページをリロード。
* 36～37行目：入力値(エリアコード)をURLに組み込んでfetch()でデータを取得。
* 38～45行目：1つ目の.then()はfetch()の戻り値(HTTP応答を含むPromiseオブジェクト)を引き数とし、アロー関数(=>)でJSONデータを取り出す。2つ目の.then()の引数には前の.then()の戻り値(JSONデータ)がセットされるので、これを引き数としたアロー関数でJSONの各キーの値をHTMLの対応するid属性を持つ要素に設定。

<br>

### <u>ワーク3 WebブラウザからWebサービスを利用</u>

**□ W3-1.** HTMLファイル「GetWebService.html」をPCのディスク、IBM iの共用フォルダーなど任意の場所に配置。

**□ W3-2.** HTMLファイルをWebブラウザで開き、任意のエリアコード(例えば東京都は「130000」)を入力して「情報を取得」ボタンをクリックし、天気情報が取得できることを確認。

**□ W3-3.** (オプション) Webブラウザの開発者ツールを開き、Webサービス・サーバーから返されるデータなどを確認。

  * Google ChromeおよびMicrosoft Edgeブラウザの場合、Ctrl+Shift+Iで「開発者(デベロッパー)ツール」を表示。
  * 「コンソール」タブをクリックし、受信したJSONデータなどを確認。

![ワーク3_WebブラウザからWebサービスを利用.jpg](/files/ワーク3_WebブラウザからWebサービスを利用.jpg)

<br>

## 3.3 Ⓒ SQL＋ILE-RPG

ILE言語では、組み込みSQLのHTTP関数」を使用してWebサービス・クライアントを開発できます。この手法はSQLが主体で、すべてのWebサービス関連機能をSQLで実行します。ここではSQLのHTTP関数を利用した組み込みSQLをILE-RPGで実装した例を紹介します。

利用するSQL機能は次の2つです。

* QSYS2.HTTP_GETスカラー関数

  HTTP GET要求を使用して、指定したURLからテキストベースのリソースを取得します。オプションでHTTPヘッダー情報や、HTTP基本認証で使用するユーザーIDとパスワード、https通信で使用する証明書ストアなどを指定できます。

* JSON_TABLE表関数

  JSONを解析して結果表を返します。ISO 9075:2016で定義されており、IBM iでは7.3から利用可能になっています。

<br>

天気情報を取得するには下記のような構造のSQLを実行します。

![3.3_Ⓒ_SQL＋ILE-RPG.jpg](/files/3.3_Ⓒ_SQL＋ILE-RPG.jpg)


httpsで保護されたサイトへアクセスするため、HTTP_GETスカラー関数のオプションで証明書ストアを指定しています。

JSON_TABLE表関数ではCOLUMNS節でJSONデータから返す列を定義します。列(例えば「area」)の名前と属性を定義し、PATH式でJSONデータのキーを指定して値を割り当てます。 
このSQLを実行してデータを取得・表示するILE-RPGプログラムの例を示します。

?> PATH式中の「lax」は、JSONの特定の構造エラー(配列の入れ子や値の欠損など)を許容。

**(ILE-RPGプログラムWEBSxxLIB/WEATHERRPG)**

```
0001.00 H DFTACTGRP(*NO) OPTION(*SRCSTMT:*NOUNREF:*NODEBUGIO)     
0002.00 H MAIN(weather_client)                                    
0003.00  *                                                        
0004.00 P weather_client  B                                       
0005.00 D                 PI                  EXTPGM('WEATHERRPG')
0006.00 D   areaCode                    32                        
0007.00  *                                                        
0008.00 D inData          DS                  QUALIFIED           
0009.00 D  area                        100    VARYING             
0010.00 D  datetime                     25                        
0011.00 D  weather                    2000    VARYING             
0012.00  *                                                        
0013.00 D url             S           1024    VARYING             
0014.00 D opt             S                   LIKE(url)           
0015.00 D stmt            S          10000    VARYING             
0016.00 D SQL_error       S           1024    VARYING             
0017.00  *                                                        
0018.00 D dspMsg          PR                                      
0019.00 D                               51    CONST               
0020.00 D                                1P 0 CONST                               
0021.00                                                                           
0022.00   // SQL ステートメント構築                                               
0023.00   url = 'https://www.jma.go.jp/bosai/forecast/data/overview_forecast/' +  
0024.00         %TRIM(areaCode) + '.json';                                        
0025.00   opt = '{"sslCertificateStoreFile":"/home/javaTrustStore/fromJava.KDB"}';
0026.00                                                                           
0027.00   stmt = 'SELECT * FROM JSON_TABLE('                                  +   
0028.00          '  QSYS2.HTTP_GET(''' + url + ''',''' + opt + ''')'          +   
0029.00          '    FORMAT JSON, ''lax $'''                                 +   
0030.00          '  COLUMNS('                                                 +   
0031.00          '    area NVARCHAR(100) PATH ''lax $.targetArea'', '         +   
0032.00          '    datetime CHAR(25) PATH ''lax $.reportDatetime'', '      +   
0033.00          '    weather NVARCHAR(2000) PATH ''lax $.text'' '            +   
0034.00          '  )'                                                        +   
0035.00          ') AS t';                                                        
0036.00                                                                           
0037.00   // SQL の実行                                                           
0038.00   EXEC SQL PREPARE S1 FROM :stmt;                                         
0039.00   EXEC SQL DECLARE C1 CURSOR FOR S1;                                      
0040.00   EXEC SQL OPEN C1;                                                  
0041.00   EXEC SQL FETCH C1 INTO :inData;                                    
0042.00                                                                      
0043.00   SELECT;                                                            
0044.00     WHEN SqlCode = 100;                                              
0045.00       dspMsg(' データなし。 ' : 1);                                  
0046.00     WHEN SqlCode < 0;                                                
0047.00       EXEC SQL GET DIAGNOSTICS CONDITION 1 :SQL_error = MESSAGE_TEXT;
0048.00       dspMsg('SQL エラー "' + SQL_error + '" が検出された。 ' : 1);  
0049.00     WHEN SqlCode = 0;                                                
0050.00       dspMsg(' 都道府県： ' + inData.area : 0);                      
0051.00       dspMsg(' 日付時刻： ' + inData.datetime : 0);                  
0052.00       dspMsg(' 天気情報： ' + inData.weather : 1);                   
0053.00     OTHER;                                                           
0054.00       dspMsg(' 予期しない SQL コード： ' + %CHAR(SqlCode) : 1);      
0055.00   ENDSL;                                                             
0056.00                                                                      
0057.00   EXEC SQL CLOSE C1;                                                 
0058.00                                                                      
0059.00   RETURN;                                                            
0060.00                                             
0061.00 P weather_client  E                         
0062.00                                             
0063.00  * 画面にメッセージを表示                   
0064.00 P dspMsg          B                   EXPORT
0065.00 D dspMsg          PI                        
0066.00 D   message                     51    CONST 
0067.00 D   pause                        1P 0 CONST 
0068.00  *                                          
0069.00 D dummy           S              1          
0070.00  *                                          
0071.00   IF pause = 1;                             
0072.00     DSPLY message '' dummy;                 
0073.00   ELSE;                                     
0074.00     DSPLY message;                          
0075.00   ENDIF;                                    
0076.00                                             
0077.00   RETURN;                                   
0078.00  *                                          
0079.00 P dspMsg          E                         
```

* 6行目：パラメーターは数字6桁のエリアコードを文字変数で受け取り。
* 8～11行目：SQLのSELECT文で結果を受け取るデータ構造を定義。
* 27～35行目：SQLステートメントを構築。
* 43行目：変数SQLCODEの値によって処理を選択。

  ?> SQLCODEのリストはIBM Docsの「SQL メッセージのリスト」(https://www.ibm.com/docs/ja/i/7.5?topic=codes-listing-sql-messages)を参照。

* 64行目：サブプロシージャー「dspMsg」でWebサービスから取得したデータを5250画面に表示。

プログラムを実行すると天気情報を取得し、画面に表示します。

```
> CALL PGM(WEATHERRPG) PARM(('150000'))

                         プログラム・メッセージの表示                           
                                                                                
 QSYS のサブシステム QINTER のジョブ 411858/XXXXXX/QPADEV0003 が 23/03/29 09:  
 DSPLY   都道府県：  新潟県                                                     
 DSPLY   日付時刻： 2023-03-29T10:43:00+09:00                                   
 DSPLY   天気情報：  　北陸地方は、高気圧に覆われています。　　                 
                                                                                


  応答を入力して，実行キーを押してください。                                    
    応答 . . .                                                                  
```

<br>

### (参考) QSYS2のHTTP APIでhttpsを利用

暗号化通信を行うには、サーバー側とクライアント側の双方の対応が必要です。大まかな流れとしては次のようになります。

① クライアントがサーバーに暗号通信を要求(通常はhttps/ポート443で接続)

?> 「https」はHTTP over SSL(Secure Sockets Layer)/TLS(Transport Layer Security)の略。

② サーバーはサーバー証明書を含む証明書チェーンをクライアントに送信

③ クライアントはサーバー証明書の正当性を確認

④ クライアントとサーバーは共通鍵方式で暗号化通信を開始

?> 当資料では暗号化の詳細は扱わない。

![参考_QSYS2のHTTP_APIでhttpsを利用.jpg](/files/参考_QSYS2のHTTP_APIでhttpsを利用.jpg)

**サーバー証明書**：公開鍵と所有者情報を含むデジタル証明書で、httpsなど公開鍵で暗号化された通信で使用します。自身でも作成できますが、外部と通信を行う場合は信頼できる第三者の「認証局」(CA：Certificate Authorities)から発行されたサーバー証明書を使用し、そのサーバー(ドメイン)の「真正性」を担保します。多くの場合、「ルート証明書」(GeoTrustやGlobalsign、DigiCertなどが発行) ⇒「中間CA証明書」(1～2階層) ⇒「サーバー証明書」の3段階でサーバー証明書が認証されます。

?> プライベートな認証局を構築すれば、容易にプライベートなサーバー証明書を作成できる。通信の暗号化だけが目的であり、既知の信頼できるホスト間でのみ通信を行う場合は、必ずしも第三者が発行したサーバー証明書は必要ではない。

**キーストア**：デジタル証明書と秘密鍵のリポジトリで、「鍵ストア」とも呼ばれます。サーバーのキーストアはほとんど空であるのに対し、クライアント(WebブラウザやJava付属のcacertsファイル)には多くの証明書(主にルート証明書)が初めから登録されています。クライアントがサーバー証明書を認証する際、キーストアの情報に基づいて証明書チェーン(サーバー⇔中間CA⇔ルート)をたどり、送られたルート証明書とキーストアに登録されたルート証明書を突合してサーバー(ドメイン)を認証します。

?> Windowsは「証明書ストア」に電子証明書や秘密鍵などの情報を保持する。

<br>

QSYS2のHTTP APIをhttpsで利用する場合、通信先サーバーの証明書を認証するためのキーストアが必要になります。キーストアには下表のような形式があります。

|形式|拡張子例|対応ツール例|備考|
|----|-------|-----------|----|
|JKS|.jks、<br>.keystore|keytool、opensslなど|Java KeyStoreの略。JavaでSSLを利用する際に利用|
|PKCS#12|.p12、<br>.pfx|(同上)|Public-Key Cryptography Standards #12の略で現在のデファクト|
|KDB|.kdb|gsk?capicmd(?はバージョン)など |IBM Global Security Kit (GSKit)のネイティブ形式(IBM独自のCMS V4)|
|Microsoft証明書ストア|-|certlm.mscなど|GUIまたはPowerShellのコマンドレットで操作|

?> GSKitはWindows、AIX、z/OS、Linuxなど多くのプラットフォームで動作するコマンドラインツールであり、WebSphere MQなど多くのIBM製品に同梱。IBM iではDCMやシステムAPIで対応。

?> GSKitはCSM(Certificate Management System) V5(PKCS12)をサポート。キーストアの形式は例えば「gsk8capicmd_64 -keydb -list -db キーストアのパス -pwパスワード」で確認可能。

クライアント(HTTP API、Webブラウザ、curlコマンドなど)によって使用するキーストアの形式が異なり、QSYS2のHTTP APIはIBM独自のKDB形式を利用するようです。

IBMのサイトには下図の様に、Java付属のcacertsを元にして新しいキーストアを作成するSQLスクリプトを掲載されています。

![参考_QSYS2のHTTP_APIでhttpsを利用2.jpg](/files/参考_QSYS2のHTTP_APIでhttpsを利用2.jpg)

?>「HTTP関数の概要」(https://www.ibm.com/docs/ja/i/7.5?topic=programming-http-functions-overview )、および、「SSL Considerations for QSYS2 HTTP Functions」(https://www.ibm.com/support/pages/ssl-considerations-qsys2-http-functions )。

?> 主要CAのルート証明書が登録済みであれば証明書を追加する作業が軽減できる。例えばIBM i 7.5(2022年末時点)のJDKに付属するcacertsには84個の証明書が登録済みであり、コマンド<code>QSH CMD('keytool -keystore /QOpenSys/QIBM/ProdData<br>/JavaVM/jdk80/64bit/jre/lib/security/cacerts -list -v <br>-storepass changeit | grep  発行者  | wc -l')」</code>で確認可能。

?> IBM iにはデフォルトのキーストア「/QIBM/UserData/ICSS/cert/Server/DEFAULT.KDB」があるが、「*SYSTEM」キーストアとして各種アプリケーションからの利用が想定される事、出荷時は1認証局(localca)と1証明書が存在するのみである事から、HTTP API用に新規のキーストアを用意。

<br>

IBM提供のSQLスクリプトがエラーなどで正常に動作しない場合は、「5.2.2 ILE-CLプログラム：JKS2KDB」のプログラムでキーストアを作成します。

Webサーバーの証明書が、クライアントのキーストアに登録済みのルート認証局から発行されていれば、個別の登録なしでhttps通信ができます。しかし、独自に「プライベート認証局」を構築し、ここで発行した証明書を認証するには個別に証明書をキーストアに登録する必要があります。

IBM iではDCM (Digital Certificate Manager。ディジタル証明書マネージャー)を利用して証明書をキーストアに登録します。Webブラウザで「http://ibmi:2006/dcm」にアクセスして高権限ユーザー(QSECOFRなど)でログインするとDCM画面(下図はIBM i 7.5の例)となり、ここからキーストア(DCMでは「証明書ストア」)を開いて証明書をキーストアにインポートします。

![参考_QSYS2のHTTP_APIでhttpsを利用3.jpg](/files/参考_QSYS2のHTTP_APIでhttpsを利用3.jpg)

?> DCMはWebアプリケーションであり、ブラウザの操作が必要。デジタル証明書の運用をバッチ化する場合、オープンソース/無保証の「DCM Tools for IBM i」(https://github.com/ThePrez/DCM-tools )や、GSKit (gsk8capicmd_64などのコマンド)が稼働する他プラットフォームとの連携(IBM iでは動作不可)などの方法が考えられる。

?> DCMはIBM iのバージョン/PTFレベルによってUIが異なる。詳細は「How To Import Personal Certificates Into a Digital Certificate Manager Keystore on the IBM i OS」(https://www.ibm.com/support/pages/node/6515666 )などを参照。

<br>

## 3.4 ILE/OSS/SQLの連携

この章で解説したcurlなどのOSSとILEプログラム、SQLのHTTP機能は、柔軟に組み合わせて利用できます。これらを連携してWebサービスのクライアントを実装した例を2つ紹介します。

<br>

### 3.4.1 CLP＋curl＋PythonでCSV出力

1つめの例では次の処理を行います。

①	CLでファイル名を「ジョブ名-ユーザー名-ジョブ番号-日付時刻」に設定

②	CLがcurlを呼び出してWebサービスからJSONデータを取得し、「/tmp/(ファイル名).json」に保管

③	CLからPythonを呼び出してJSONファイルをCSVファイルに変換し、「/tmp/(ファイル名).csv」に保存

![3.4.1_CLP＋curl＋PythonでCSV出力.jpg](/files/3.4.1_CLP＋curl＋PythonでCSV出力.jpg)

CLプログラムは「CALL PGM(WSCSAMPLE1) PARM(('410000'))」のようにエリアコードをパラメーターに指定して実行するとCSVファイルが生成されます。

既出のcurl＋jqでも同様の処理が可能ですが、PythonでJSONデータを読み込めば、これをグラフ化したり、メールで送信したり、DBに書き込んだりと応用がしやすくなります。

**(CLプログラムWEBSxxLIB/WSCSAMPLE1)**

```
0001.00              PGM        PARM(&AREACODE)                                       
0002.00              DCL        VAR(&AREACODE) TYPE(*CHAR) LEN(32)                    
0003.00              DCL        VAR(&QSHCMD) TYPE(*CHAR) LEN(1000)                    
0004.00              DCL        VAR(&STMF) TYPE(*CHAR) LEN(64)                        
0005.00              DCL        VAR(&JOBJOB) TYPE(*CHAR) LEN(10)                      
0006.00              DCL        VAR(&JOBUSER) TYPE(*CHAR) LEN(10)                     
0007.00              DCL        VAR(&JOBNBR) TYPE(*CHAR) LEN(6)                       
0008.00              DCL        VAR(&JOBDATTIM) TYPE(*CHAR) LEN(20)                   
0009.00                                                                               
0010.00              /* 実行環境の設定 */                                             
0011.00              CHGJOB     CCSID(1399)                                           
0012.00              ADDENVVAR  ENVVAR(QIBM_MULTI_THREADED) VALUE(Y) REPLACE(*YES)    
0013.00              ADDENVVAR  ENVVAR(QIBM_QSH_CMD_ESCAPE_MSG) VALUE(Y) REPLACE(*YES)
0014.00              /* ストリームファイル名の設定 */                                 
0015.00              RTVJOBA    JOB(&JOBJOB) USER(&JOBUSER) NBR(&JOBNBR) +            
0016.00                           DATETIME(&JOBDATTIM)                                
0017.00              CHGVAR     VAR(&STMF) VALUE('/tmp/' || &JOBJOB |< '-' +          
0018.00                           || &JOBUSER |< '-' || &JOBNBR |< '_' || +           
0019.00                           &JOBDATTIM)                                         
0020.00                                                                          
0021.00              /* Web サービスから curl で JSON データを検索し、 +         
0022.00                 Python で CSV ファイルに変換 */                          
0023.00              CHGVAR     VAR(&QSHCMD) VALUE('/QOpenSys/usr/bin/sh -c +    
0024.00                           ' || '"export +                                
0025.00                           PATH=/QOpenSys/pkgs/bin:$PATH ; ' || +         
0026.00                           'curl -s +                                     
0027.00                           https://www.jma.go.jp/bosai/forecast/data/o+   
0028.00                           verview_forecast/' |< &AREACODE |< '.json > ' +
0029.00                           || &STMF |< '.json ; ' || +                    
0030.00                           '/home/websxx/json2csv.py ' || &STMF |< '"')   
0031.00              QSH        CMD(&QSHCMD)                                     
0032.00              MONMSG     MSGID(QSH0000) EXEC(DO)                          
0033.00                SNDPGMMSG  MSG(' スクリプト実行時にエラー。 ')            
0034.00                GOTO       CMDLBL(EXIT)                                   
0035.00              ENDDO                                                       
0036.00                                                                          
0037.00  EXIT:       ENDPGM                                                      
```

* 17～19行目：Webサービスから取得するJSONおよび出力するCSVのパス名を「/tmp/(ジョブ名-ユーザー名-ジョブ番号_日付時刻).拡張子」とする。

**(Pythonスクリプト /home/websxx/json2csv.py)**

```python
0001 #!/QOpenSys/pkgs/bin/python
0002 import json, csv, sys
0003 
0004 with open(sys.argv[1] + '.json', 'r') as in_f:
0005     jsonl_data = [json.loads(line) for line in in_f.readlines()]
0006 
0007 with open(sys.argv[1] + '.csv', 'w', encoding="utf_8_sig") as out_f:
0008     writer = csv.DictWriter(out_f, fieldnames=jsonl_data[0].keys(), 
0009                             doublequote=True, quoting=csv.QUOTE_NONNUMERIC)
0010     writer.writeheader()
0011     for item in jsonl_data:
0012         writer.writerow(item)
```

* 4～5行目：天気情報は大カッコ(「[」「」」)が無く1行で完結する形式 なので、行ごとにJSONデータとして読み込む。

  ?> JSONL(JSON lines)などと呼ばれる形式に近い。

* 7行目：出力先のCSVファイルを指定。「encoding="utf_8_sig"」でCSVの先頭にBOMを付加し、Excelの特定バージョンで直接開いた時の文字化けを回避。
* 8～9行目：出力するCSV形式の指定。文字項目のみダブルクォーテーションでくくる。
10行目：見出し行(キー値)を付加。不要な場合はコメントアウト。

<br>

### 3.4.2 CLP＋curl＋SQLでDB出力

2つめの例では次の処理を行います。

①	CLでファイル名を「ジョブ名-ユーザー名-ジョブ番号-日付時刻」に設定

②	CLがcurlを呼び出してWebサービスからJSONデータを取得し、「/tmp/(ファイル名).json」に保管

③	CLからRUNSQLコマンドで「/tmp/(ファイル名).json」のデータをDBに出力

![3.4.2_CLP＋curl＋SQLでDB出力.jpg](/files/3.4.2_CLP＋curl＋SQLでDB出力.jpg)

この例ではJSONファイルの解析とフォーマット、DB出力をDb2 for iのSQLが行います。Webサービスをデータ交換に利用する、あるいは、複数/大量のデータをWebサービスから取得して保管する、などの用途に応用できるでしょう。

**(CLプログラムWEBSxxLIB/WSCSAMPLE2)**

```
0001.00              PGM        PARM(&AREACODE)                                        
0002.00              DCL        VAR(&AREACODE) TYPE(*CHAR) LEN(32)                     
0003.00              DCL        VAR(&QSHCMD) TYPE(*CHAR) LEN(1000)                     
0004.00              DCL        VAR(&STMF) TYPE(*CHAR) LEN(64)                         
0005.00              DCL        VAR(&JOBJOB) TYPE(*CHAR) LEN(10)                       
0006.00              DCL        VAR(&JOBUSER) TYPE(*CHAR) LEN(10)                      
0007.00              DCL        VAR(&JOBNBR) TYPE(*CHAR) LEN(6)                        
0008.00              DCL        VAR(&JOBDATTIM) TYPE(*CHAR) LEN(20)                    
0009.00                                                                                
0010.00              /* 実行環境の設定 */                                              
0011.00              CHGJOB     CCSID(1399)                                            
0012.00              ADDENVVAR  ENVVAR(QIBM_MULTI_THREADED) VALUE(Y) REPLACE(*YES)     
0013.00              ADDENVVAR  ENVVAR(QIBM_QSH_CMD_ESCAPE_MSG) VALUE(Y) REPLACE(*YES) 
0014.00              /* ストリームファイル名の設定 */                                  
0015.00              RTVJOBA    JOB(&JOBJOB) USER(&JOBUSER) NBR(&JOBNBR) +             
0016.00                           DATETIME(&JOBDATTIM)                                 
0017.00              CHGVAR     VAR(&STMF) VALUE('/tmp/' || &JOBJOB |< '-' +           
0018.00                           || &JOBUSER |< '-' || &JOBNBR |< '_' || +            
0019.00                           &JOBDATTIM)                                          
0020.00                                                                             
0021.00              /* Web サービスから curl で JSON データを検索 */               
0022.00              CHGVAR     VAR(&QSHCMD) VALUE('/QOpenSys/usr/bin/sh -c +       
0023.00                           ' || '"export +                                   
0024.00                           PATH=/QOpenSys/pkgs/bin:$PATH ; ' || +            
0025.00                           'curl -s +                                        
0026.00                           https://www.jma.go.jp/bosai/forecast/data/o+      
0027.00                           verview_forecast/' |< &AREACODE |< '.json > ' +   
0028.00                           || &STMF |< '.json"')                             
0029.00              QSH        CMD(&QSHCMD)                                        
0030.00              MONMSG     MSGID(QSH0000) EXEC(DO)                             
0031.00                SNDPGMMSG  MSG(' スクリプト実行時にエラー。 ')               
0032.00                GOTO       CMDLBL(EXIT)                                      
0033.00              ENDDO                                                          
0034.00                                                                             
0035.00              /* 一時テーブルを作成 */                                       
0036.00              RUNSQL     SQL('DROP TABLE SESSION.WXINFO')                    
0037.00              MONMSG     MSGID(CPF0000)                                      
0038.00              RUNSQL     SQL('DECLARE GLOBAL TEMPORARY TABLE SESSION.WXINFO +
0039.00                 (AREA     VARCHAR(100)  CCSID 5035 NOT NULL WITH DEFAULT, + 
0040.00                  DATETIME CHAR(25)      CCSID 1027 NOT NULL WITH DEFAULT, + 
0041.00                  WEATHER  VARCHAR(2000) CCSID 5035 NOT NULL WITH DEFAULT)') 
0042.00              /* JSON から一時テーブルにデータを出力 */                      
0043.00              RUNSQL     SQL( +                                              
0044.00         'INSERT INTO SESSION.WXINFO                                 ' |> +  
0045.00         '  SELECT *                                                 ' |> +  
0046.00         '    FROM JSON_TABLE(                                       ' |> +  
0047.00         '      (SELECT * FROM TABLE(VALUES                          ' |> +  
0048.00         '             GET_CLOB_FROM_FILE('''                             +  
0049.00                         |< &STMF |< '.json'', 1)                    ' |> +  
0050.00         '            ))                                             ' |> +  
0051.00         '      FORMAT JSON, ''lax $''                               ' |> +  
0052.00         '      COLUMNS(                                             ' |> +  
0053.00         '        area NVARCHAR(100) PATH ''lax $.targetArea'',      ' |> +  
0054.00         '        datetime CHAR(25) PATH ''lax $.reportDatetime'',   ' |> +  
0055.00         '        weather NVARCHAR(2000) PATH ''lax $.text''         ' |> +  
0056.00         '      )                                                    ' |> +  
0057.00         '    ) AS t                                                 ' |> +  
0058.00         '    WITH CS                                                ')      
0059.00              /* 出力の確認 */                                               
0060.00              RUNQRY     QRY(*NONE) QRYFILE((QTEMP/WXINFO))     
0061.00                                                                
0062.00  EXIT:       ENDPGM                                            
```

* 1～19行目：前のプログラム「WSCSAMPLE1」と同じ。
* 38～41行目：DECLARE GLOBAL TEMPORARY TABLEステートメントで一時表を作成。修飾子にSESSIONを指定し、表がライブラリーQTEMPに作成される。
* 44～57行目：47～50行でGET_CLOB_FROM_FILE関数を使ってcurlで取得したJSONデータを読み込む。このデータを46～56行のJSON_TABLE表関数で表にマップし、この表データを44行目のINSERTステートメントで一時表に挿入。

<br>

プログラムを実行すると、生成された一時表をQueryで表示します

```
> CALL PGM(WSCSAMPLE2) PARM(('410000'))

                                                           報告書の表示    
                                                                           
  行の位置指定 . . . . . . .                                               
  行    ....+....1... | 0....+...11....+...12....+...13....+...14....+...15
        AREA          |    DATETIME                   WEATHER              
 000001  佐賀県       |    2023-03-31T16:37:00+09:00   　佐賀県は、高気圧に
 ****** ********  報告書の終わり  ********                                 
```
