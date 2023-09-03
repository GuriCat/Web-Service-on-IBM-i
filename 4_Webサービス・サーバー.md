# 4 Webサービス・サーバー

この章では、IBM i上で稼働するWebサービスのサーバー実装例を解説します。

下図は「2.3.2 Webサービス・サーバー実装」の表をシンプルに模式化したものです。この章では右の番号順に、IBM iでWebサービス・サーバーを実装した例を解説します。

![4_Webサービス・サーバー.jpg](/files/4_Webサービス・サーバー.jpg)

各手法の特長、メリット/デメリットなどは「2.3.2 Webサービス・サーバー実装」を参照ください。

<br>

①～⑥の各手法で2種類のWebサービスを作成します。

?> 当資料ではRESTアプリケーションの設計標準は論じず、単純化したWebサービス・サーバーを構築。本番業務として設計する際は下記のような事項の検討を推奨。<br>・「Webサービス1」でパラメーター指定にQUERY_STRING(.../person/?regNo=xxx)を使用している。他にパス・パラメーター(.../person/xxx/)による実装パターンあり。<br>・「Webサービス2」で使用するPOSTメソッドはCRUD(Create、Read、Update、Delete)のCreateに対応させることが多いが、この例ではReadに割り当て。

![4_Webサービス・サーバー2.jpg](/files/4_Webサービス・サーバー2.jpg)

* 「Webサービス1」はGETメソッドを使用し、登録番号を指定して1件のデータを取得。クライアントからのリクエストはURI(QUERY_STRING)で受け取る。

* 「Webサービス2」POSTメソッドを使用し、「姓名(読み)」を前方部分一致で検索して複数データを取得。例えば、クライアントが「アイ」で検索すると、「アイカワ」、「アイザワ」、「アイハラ」などが得られる。クライアントからのリクエストはJSON形式をHTTPのbodyで受け取る。

<br>

いずれのWebサービスも、JSON形式の検索結果をHTTP応答と合わせてクライアントに返します。生成するJSONの形式は「② IWS (ILE-RPG)」に合わせ、Webサービス・サーバーの動作確認にはcurlを使用します。

<br>

## 4.1 ① IWS (SQL)

IWS(IBM統合Webサービス・サーバー。IBM Integrated Web Services)では、専用のウィザードを利用してコーディングを行わずにWebサービスを作成できます。階層的なJSONの出力など凝った指定はありませんが、シンプルなWebサービスをほんの数分で作成できます。

下図はIWSを利用したWebサービスの処理の流れを示します。IHS、IASなどの関連ソフトウェアとともに、IWSが図の中央に位置しています。多くのIBM iで、これらのソフトウェアはインストール済みでしょう。

![4.1_①_IWS_SQL.jpg](/files/4.1_①_IWS_SQL.jpg)

IWSではウィザード内で定義する**SQLステートメント**、または、Webサービス用に作成された**ILEモジュール**のいずれかをWebサービス化できます。

SQLステートメントを利用したREST APIは、IBM i 7.4(SF99662 レベル1以降)、7.3(SF99722 レベル19以降)からサポートされています。ご自身のIBM iで使用する場合は前提情報を確認するとともに、最新版に更新する事をお勧めします。

?>  IWSの情報は「Integrated Web Services for IBM i - Web services made easy」(https://www.ibm.com/support/pages/node/633935 )を、更新に関しては「IBM Integrated Web Services (IWS) PTF Strategy」(https://www.ibm.com/support/pages/ibm-integrated-web-services-iws-ptf-strategy )などを参照。

<br>

下表にIWSによるWebサービス・サーバーと、Webサービスの作成手順を示します。基本的に、Webサービス・サーバーは5ステップ、Webサービス(SQL)は8ステップ、Webサービス(ILE)は10ステップのウィザードで作成できます。

![4.1_①_IWS_SQL2.jpg](/files/4.1_①_IWS_SQL2.jpg)

<font size="-2">
  ※ ウィザードを進めるとステップNoが連番にならない場合があります。<br>また、数値はIWSのバージョンやPTFレベルによって変化します。
</font>

シンプルなWebサービスをSQLで提供する、あるいは、既存のPRGなどのプログラム資産をWebサービス化する場合、IWSを利用すれば、少ない工数でクイックに開発～展開が実現できるでしょう。

<br>

### <u>ワーク4 IWSでWebサービス・サーバーを作成</u>

<font color="blue">

IWSはIBM iバージョンやTR/PTFレベルにより、画面・機能が変わります。ワークの手順が継続できない場合はハンズオン用のサーバーを使用下さい。

ウィザード実行中にWebブラウザのウインドゥサイズを変えたり、別のタブを表示したりすると実行中のステップから画面が遷移する事があるので、ウィザード中は変更しないようにしましょう。

ハンズオン用サーバーを利用する場合は「01」を「1.3設定情報」に合わせて下さい。
</font>

<br>

**□ W4-1.** Webブラウザから「(IBMのホスト名またはIPアドレス):2001/HTTPAdmin」にアクセスし、QSECOFR(または特殊権限ALLOBJとIOSYSCFGを所有するユーザー)で「IBM Web Administration for i」へログイン。

![ワーク4_IWSでWebサービス・サーバーを作成.jpg](/files/ワーク4_IWSでWebサービス・サーバーを作成.jpg)

「全てのサーバーの管理」画面で、左上の「セットアップ」タブをクリック。

![ワーク4_IWSでWebサービス・サーバーを作成2.jpg](/files/ワーク4_IWSでWebサービス・サーバーを作成2.jpg)

「新規Web Services サーバーの作成」をクリックしてウィザードを開始。

**□ W4-2.** 「Web サービス・サーバー名の指定 - ステップ **1/5**」が表示されるので、サーバー名(上の例では「WEBS01」)に既存のWebアプリケーション・サーバー名と重複しない任意の名前を指定し、サーバー記述を入力して「次へ」をクリック。

![ワーク4_IWSでWebサービス・サーバーを作成3.jpg](/files/ワーク4_IWSでWebサービス・サーバーを作成3.jpg)

**□ W4-3.** 「サーバーのネットワーク属性の指定 - ステップ **2/5**」では、サーバーのIPアドレスとポートを指定して「次へ」をクリック。

?> ポート番号には、著名なサービスやプロトコルが利用するWell-known portをさけて1024以上、かつ、他のサーバーが利用していない番号を指定。また、Webブラウザによってはセキュリティ強化のために10080番ポートへのアクセスを制限しているのでこれも避ける。

![ワーク4_IWSでWebサービス・サーバーを作成4.jpg](/files/ワーク4_IWSでWebサービス・サーバーを作成4.jpg)

**□ W4-4.** ステップ「サーバーのサブシステムの指定 - ステップ **3/5**」ではWebサービス・サーバーが稼働するサブシステムを指定可能。ここではそのまま「次へ」をクリック。

![ワーク4_IWSでWebサービス・サーバーを作成5.jpg](/files/ワーク4_IWSでWebサービス・サーバーを作成5.jpg)

**□ W4-5.** 「サーバーのユーザー ID の指定 - ステップ **4/5**」ではサーバーのユーザーIDを指定。デフォルトのまま「次へ」をクリック。

?> デフォルトではユーザー・プロフィール「QWSERVICE」を使用。このユーザー・プロフィールの初期設定は状況が*DISABLED、パスワード無しになっているので、デフォルトを利用するには、CHGUSRPRFコマンドで、状況を*ENABLEDに変更、任意のパスワードを設定。なお、「新規ユーザーIDの作成」は*SECADM特殊権限が必要。

![ワーク4_IWSでWebサービス・サーバーを作成6.jpg](/files/ワーク4_IWSでWebサービス・サーバーを作成6.jpg)

<font color="blue">

ハンズオンでは5250画面からDSPUSRPRFコマンドでユーザーQWSERVICEの状況を確認し、*DISABLEDになっている場合はインストラクターに伝えて下さい。
</font>

**□ W4-6.** 「要約 - ステップ **5/5**」が表示されるので、内容を確認して入力ミスなどが無ければ「完了」をクリック。

![ワーク4_IWSでWebサービス・サーバーを作成7.jpg](/files/ワーク4_IWSでWebサービス・サーバーを作成7.jpg)

**□ W4-7.** 「Web サービス・サーバーの管理」が表示され、状況が「実行中」か確認。

![ワーク4_IWSでWebサービス・サーバーを作成8.jpg](/files/ワーク4_IWSでWebサービス・サーバーを作成8.jpg)


<br>

### <u>ワーク5 IWSでSQLステートメントからWebサービス1を作成</u>

<font color="blue">

IWSはIBM iバージョンやTR/PTFレベルにより、画面・機能が変わります。ワークの手順が継続できない場合はハンズオン用のサーバーを使用下さい。

ハンズオン用サーバーを利用する場合は「xx」を「1.3設定情報」に合わせて下さい。
</font>

<br>

**□ W5-1.** 下表のような仕様の「Webサービス1」を、前のワークで作成したWebアプリケーション・サーバー「WEBS01」に追加する。各設定項目を確認。

|処理|設定項目|設定値|
|----|-------|-----|
|URLで指定された｢REGNO｣のレコードを返す|URL|…/person/?regNo=xxx|
||HTTPメソッド|GET|
||取得レコード|単一|
||リクエスト|QUERY_STRING|
||SQL|SELECT * FROM WEBSxxLIB.PERSON WHERE REGNO = ?|

**□ W5-2.** 「Webサービス・サーバーの管理」画面で、左ペインの「新規サービスの配置」をクリックし、ウィザードを開始。

![ワーク5_IWSでSQLステートメントからWebサービス1を作成.jpg](/files/ワーク5_IWSでSQLステートメントからWebサービス1を作成.jpg)

**□ W5-3.** 「Web サービス・タイプの指定 - ステップ **1/8**」が表示されるので、「Webサービス・タイプ」に「REST」、「Web サービス実装の指定:」に「Web サービスとしての SQL」を選択し、「次へ」をクリック。

![ワーク5_IWSでSQLステートメントからWebサービス1を作成1.jpg](/files/ワーク5_IWSでSQLステートメントからWebサービス1を作成1.jpg)

**□ W5-4.** 「サービス名の指定 - ステップ **2/8**」が表示されるので、リソース名に任意のパス文字列(ここではデータベースファイル名「person」を設定)を、「サービス記述」にこのサービスの説明を入力し、「次へ」をクリック。

![ワーク5_IWSでSQLステートメントからWebサービス1を作成2.jpg](/files/ワーク5_IWSでSQLステートメントからWebサービス1を作成2.jpg)

**□ W5-5.** 次の「セキュリティー制約の指定 - ステップ **3/8**」でセキュリティ制約(暗号化/認証の有無)を指定。ここでは、デフォルトのまま、セキュリティ無しで続行。

![ワーク5_IWSでSQLステートメントからWebサービス1を作成3.jpg](/files/ワーク5_IWSでSQLステートメントからWebサービス1を作成3.jpg)

**□ W5-6.** 「SQL ステートメントの指定 - ステップ **4/8**」で「追加」をクリックし、このWebサービスが実行するSQLを指定。

![ワーク5_IWSでSQLステートメントからWebサービス1を作成4.jpg](/files/ワーク5_IWSでSQLステートメントからWebサービス1を作成4.jpg)

「プロシージャー名」に任意の名前(例では「getByRegNoProc」)を、「SQLステートメント/パラメーター名」に実行するSQL文と変数を入力し、「続行」をクリック。

![ワーク5_IWSでSQLステートメントからWebサービス1を作成5.jpg](/files/ワーク5_IWSでSQLステートメントからWebサービス1を作成5.jpg)

パラメーター(「?」)の数に応じて、パラメーター名、使用法、データ・タイプが設定されている事を確認し、「次へ」をクリック。

![ワーク5_IWSでSQLステートメントからWebサービス1を作成6.jpg](/files/ワーク5_IWSでSQLステートメントからWebサービス1を作成6.jpg)

**□ W5-7.** 「SQL 情報の指定 - ステップ **5/8**」では、SQLが返す行が単一か複数か、文字列のTrim、エラー時の挙動を指定。「Webサービス1」では、クライアントが指定した登録番号にマッチしたレコードを1行返すように、「単一行結果セット」を指定して「次へ」をクリック。

![ワーク5_IWSでSQLステートメントからWebサービス1を作成7.jpg](/files/ワーク5_IWSでSQLステートメントからWebサービス1を作成7.jpg)

**□ W5-8.** 「リソース・メソッド情報の指定 - ステップ **6/8**」画面で、RESTのHTTP通信関連の設定を指定し、「次へ」をクリック。

![ワーク5_IWSでSQLステートメントからWebサービス1を作成8.jpg](/files/ワーク5_IWSでSQLステートメントからWebサービス1を作成8.jpg)

**□ W5-9.** 「このサービスのユーザー ID を指定 - ステップ **7/8**」はデフォルトのま何も変更せず「次へ」をクリック。

![ワーク5_IWSでSQLステートメントからWebサービス1を作成9.jpg](/files/ワーク5_IWSでSQLステートメントからWebサービス1を作成9.jpg)

**□ W5-10.** 「要約 - ステップ **8/8**」が表示されるので、内容を確認して入力ミスなどが無ければ「完了」をクリック。

![ワーク5_IWSでSQLステートメントからWebサービス1を作成a.jpg](/files/ワーク5_IWSでSQLステートメントからWebサービス1を作成a.jpg)

**□ W5-11.** 「配置済みサービスの管理」画面が表示される。「最新表示」をクリックして、状況が「インストール中」から「実行中」になるまで待機。

![ワーク5_IWSでSQLステートメントからWebサービス1を作成b.jpg](/files/ワーク5_IWSでSQLステートメントからWebサービス1を作成b.jpg)

**□ W5-12.** sshクライアントでIBM iにログインし、curlコマンドでWebサービス1からデータが得られることを確認。

```bash
bash-5.1$ curl -s -X GET 'http://ibmi:10134/web/services/person/?regNo=123' | jq
{
  "person_GetByRegNoProc_R": {
    "REGNO": 123,
    "KJNAME": "奥　勝義",
    "KNNAME": "ｵｸ ｶﾂﾖｼ",
    "GENDER": "M",
    "TEL": "095053194",
    "MOBILE": "09029664487",
    "POST": "852-8056",
    "PREF": "長崎県　",
    "ADDR1": "長崎市",
    "ADDR2": "大宮町1-17-6",
    "ADDR3": "",
    "BIRTHD": 19890521
  }
}
bash-5.1$
```

**□ W5-13.** (オプション) 「配置済みサービスの管理」画面で、①作成したサービス「person」の「Swaggerの表示」をクリックしてSwaggerをブラウザに表示。②Swagger Editor (https://editor.swagger.io/) にアクセスし、「person」のSwaggerをSwagger Editorの左ペインに貼付けて③右ペインの項目で「Webサービス1」の仕様を確認。

![ワーク5_IWSでSQLステートメントからWebサービス1を作成c.jpg](/files/ワーク5_IWSでSQLステートメントからWebサービス1を作成c.jpg)

<br>

### <u>ワーク6 IWSでSQLステートメントからWebサービス2を作成</u>

**□ W6-1.** 下表のような仕様の「Webサービス2」を、前のワークで作成したWebアプリケーション・サーバー「WEBS01」のサービス「person」に追加する。各設定項目を確認。

|処理|設定項目|設定値|
|----|-------|-----|
|｢KNNAME｣の値がJSONで指定された文字列で始まるレコードを返す|URL|…/person/|
||HTTPメソッド|POST|
||取得レコード|複数|
||リクエスト|Body(JSON形式)|
||SQL|SELECT * FROM WEBSxxLIB.PERSON WHERE KNNAME LIKE ? || '%'|
<br>

**□ W6-2.** 配置済みのサービスに新規Webサービスを追加するため、「配置済みサービスの管理」画面から実行中のサービス「person」を停止。「最新表示」をクリックして「状況」が「停止済み」になったら「再配置」をクリックしてウィザードを開始。

![ワーク6_IWSでSQLステートメントからWebサービス2を作成.jpg](/files/ワーク6_IWSでSQLステートメントからWebサービス2を作成.jpg)

**□ W6-3.** 「サービス名の指定 - ステップ **1/8**」は、何も変更せずに「次へ」をクリック。

![ワーク6_IWSでSQLステートメントからWebサービス2を作成1.jpg](/files/ワーク6_IWSでSQLステートメントからWebサービス2を作成1.jpg)

**□ W6-4.** 「セキュリティー制約の指定 - ステップ **2/8**」もそのまま「次へ」をクリック。

![ワーク6_IWSでSQLステートメントからWebサービス2を作成2.jpg](/files/ワーク6_IWSでSQLステートメントからWebサービス2を作成2.jpg)

**□ W6-5.** 「データベース・プロパティーの指定 - ステップ **3/8**」もそのまま「次へ」をクリック。

![ワーク6_IWSでSQLステートメントからWebサービス2を作成3.jpg](/files/ワーク6_IWSでSQLステートメントからWebサービス2を作成3.jpg)

**□ W6-6.** 「SQL ステートメントの指定 - ステップ **4/8**」で「Webサービス1」の設定があることを確認し、「追加」をクリック。

![ワーク6_IWSでSQLステートメントからWebサービス2を作成4.jpg](/files/ワーク6_IWSでSQLステートメントからWebサービス2を作成4.jpg)

「プロシージャー名」に任意の名前(例では「getByKnnameProc」)を、「SQLステートメント/パラメーター名」に実行するSQL文と変数を入力し、「続行」をクリック。

![ワーク6_IWSでSQLステートメントからWebサービス2を作成5.jpg](/files/ワーク6_IWSでSQLステートメントからWebサービス2を作成5.jpg)

下の画面の様に正常にプロシージャー/SQLステートメントが登録され、パラメーター名に「PARM00001」が自動的に設定された事を確認。パラメーター名を変更するため、SQLステートメント左のチェックボックスをチェック。

![ワーク6_IWSでSQLステートメントからWebサービス2を作成6.jpg](/files/ワーク6_IWSでSQLステートメントからWebサービス2を作成6.jpg)

パラメーター名を「knname」に変更し、「続行」をクリック。

![ワーク6_IWSでSQLステートメントからWebサービス2を作成7.jpg](/files/ワーク6_IWSでSQLステートメントからWebサービス2を作成7.jpg)

SQLパラメーター名が変更された事を確認して「次へ」をクリック。

![ワーク6_IWSでSQLステートメントからWebサービス2を作成8.jpg](/files/ワーク6_IWSでSQLステートメントからWebサービス2を作成8.jpg)

**□ W6-7.** 「SQL 情報の指定 - ステップ **5/8**」では最初に「Webサービス1」の設定(プロシージャー「getByRegNoProc」) が表示されるので、そのまま「次へ」をクリック。

**□ W6-8.** 追加したプロシージャー「getByKnnameProc」の情報が表示されるので、「SQL結果タイプ」に「マルチ行結果セット」を選択して「次へ」をクリック。

![ワーク6_IWSでSQLステートメントからWebサービス2を作成9.jpg](/files/ワーク6_IWSでSQLステートメントからWebサービス2を作成9.jpg)

**□ W6-9.** 「リソース・メソッド情報の指定 - ステップ **5/8**」でも、最初に「Webサービス1」の設定が表示されるので、そのまま「次へ」をクリック。

**□ W6-10.** 「Webサービス2」では「Webサービス1」と異なる設定を指定。

![ワーク6_IWSでSQLステートメントからWebサービス2を作成a.jpg](/files/ワーク6_IWSでSQLステートメントからWebサービス2を作成a.jpg)

**□ W6-11.** 「このサービスのユーザー ID を指定 - ステップ **7/8**」はデフォルトのま何も変更せず「次へ」をクリック。

![ワーク6_IWSでSQLステートメントからWebサービス2を作成b.jpg](/files/ワーク6_IWSでSQLステートメントからWebサービス2を作成b.jpg)

**□ W6-12.** 「要約 - ステップ **8/8**」が表示されるので、内容を確認して入力ミスなどが無ければ「完了」をクリック。「Webサービス2」が追加される。

![ワーク6_IWSでSQLステートメントからWebサービス2を作成c.jpg](/files/ワーク6_IWSでSQLステートメントからWebサービス2を作成c.jpg)

**□ W6-13.** 「配置済みサービスの管理」画面が表示されるので、「最新表示」で状況を更新し、インストールが完了して「停止済み」になったら「始動」をクリックします。

![ワーク6_IWSでSQLステートメントからWebサービス2を作成d.jpg](/files/ワーク6_IWSでSQLステートメントからWebサービス2を作成d.jpg)

「実行中」に変われば「Webサービス2」を利用できます。

**□ W6-14.** sshクライアントでIBM iにログインし、curlコマンドでWebサービス2からデータ(複数項目)が得られることを確認。

```bash
bash-5.1$ curl -s -X POST 'http://ibmi:10134/web/services/person/' -H 'Content-Type: application/json' -d '{"knname": "ｱｶ"}' | jq
{
  "person_GetByKnnameProc_R": [
    {
      "REGNO": 856,
      "KJNAME": "明石　正",
      "KNNAME": "ｱｶｲｼ ﾀﾀﾞｼ",
      "GENDER": "M",
      "TEL": "0486678896",
      "MOBILE": "08069077495",
      "POST": "350-0113",
      "PREF": "埼玉県　",
      "ADDR1": "比企郡川島町",
      "ADDR2": "東部2-9-9",
      "ADDR3": "東部スカイ216",
      "BIRTHD": 19621208
    },
    {
      "REGNO": 929,
      "KJNAME": "我妻　幸春",
      "KNNAME": "ｱｶﾞﾂﾏ ﾕｷﾊﾙ",
      "GENDER": "M",
～～～～～～～～～～～～～～～ 後略 ～～～～～～～～～～～～～～～～～
```

**□ W6-15.** (オプション) 「配置済みサービスの管理」画面で、①作成したサービス「person」の「Swaggerの表示」をクリックしてSwaggerをブラウザに表示。②Swagger Editor (https://editor.swagger.io/ )にアクセスし、「person」のSwaggerをSwagger Editorの左ペインに貼付けて③右ペインの項目で「Webサービス1」(GET)および「Webサービス2」(POST)の仕様を確認。

![ワーク6_IWSでSQLステートメントからWebサービス2を作成e.jpg](/files/ワーク6_IWSでSQLステートメントからWebサービス2を作成e.jpg)

<br>

## 4.2 ② IWS (ILE-RPG)

IWSのウィザードを利用すれば、ILE-RPGをWebサービス化できます。具体的には、ILE-RPGの\*PGMまたは\*SRVPGMをIWSの「新規サービスの配置」ウィザードで登録・配置してWebサービス化します。

IWSの「新規サービスの配置」ウィザードは、下記の流れでILE-RPGプログラムの情報をWebサービスに関連付けます。

  ① H仕様書で「PGMINFO(\*PCML:\*MODULE:\*DCLCASE)」を宣言し、Webサービス化するプロシージャーに「EXPORT」を指定

?> PCML(プログラム呼び出しマークアップ言語)情報をモジュールに直接生成。「*DCLCASE」はIBM i 7.3で拡張された機能(7.1/7.2は要PTF)で、PCML内のパラメーター名の大小文字表記がRPGソースと同じになる(指定しない場合は全て大文字)。

  ② ILE-RPGをコンパイルして\*PGMまたは\*SRVPGMを作成
  
  ③ IWSへ作成した\*PGMまたは\*SRVPGMを登録。

  下図のように、「新規サービスの配置」ウィザードの最初のステップ「Web サービス・タイプの指定」の「Webサービス実装の指定」で「WebサービスとしてのILEプログラム・オブジェクト」を選択し、作成した\*PGMまたは\*SRVPGMをIFSパス形式(例えば「/QSYS.LIB/ライブラリー名.LIB/プログラム名.SRVPGM」)で入力

  ![4.2_②_IWS_ILE-RPG.jpg](/files/4.2_②_IWS_ILE-RPG.jpg)

  ④ ウィザードの「Webサービスとして外部化するエクスポート・プロシージャーの選択」でEXPORTされたプロシージャーと入出力パラメーターが表示されるので、Webサービス化するプロシージャーと使用法(入出力)を選択

<br>

では、④の時点でILE-RPGモジュールのプロシージャーがIWSのウィザードにどのように認識されるかを見てみましょう。

<br>

下図は1つの入力パラメーターに対し、単一のデータ構造とHTTP状況を返す例です。RPG側のプロシージャー名、パラメーター名、パラメーター型などのプロシージャー・インターフェースの定義を、IWSが正しく認識している事がわかります。複数の出力がある場合、IWSはこれら(データ構造やHTTP状況)をJSONやXMLにラップしてクライアントに返します。

![4.2_②_IWS_ILE-RPG1.jpg](/files/4.2_②_IWS_ILE-RPG1.jpg)

<br>

次はデータ構造の配列を含む例です。1回のリクエストで複数件のデータベース・レコード情報を返す場合などに利用します。

![4.2_②_IWS_ILE-RPG2.jpg](/files/4.2_②_IWS_ILE-RPG2.jpg)

IWSウィザードで「長さフィールドの検出」がチェック(選択)されている点に留意ください。IWSのマニュアルにはこの項目について「**常に選択状態にすべき**。非選択は旧バージョン用」と記載されています。ここをチェックした場合はILE-RPGプログラム側で、｢配列変数名＋“_LENGTH”｣を名前とした変数(この例の場合は「multi_rcds_LENGTH」)にデータ件数を設定します。

?> 「IBM i Version 2.6 Integrated Web Services Server Administration and Programming Guide」(https://public.dhe.ibm.com/systems/support/i/iws/systems_i_software_iws_pdf_WebServicesServer_new.pdf )の72ページを参照。

<br>

「4.1 ① IWS (SQL)」と同様に、「Webサービス1」(登録番号による1件検索)および「Webサービス2」(読み仮名の先頭一致検索)の2種の検索処理を行うILE-RPGのソースコードを示します。
 
**(ILE-RPGサービス・プログラムWEBSxxLIB/IWSSVRRPG)**

```
0001.00 H NOMAIN PGMINFO(*PCML:*MODULE:*DCLCASE)                      
0002.00  * 登録者一覧 - KEY:REGNO 登録番号                            
0003.00 FPERSON    IF   E           K DISK    USROPN                  
0004.00  * 登録者一覧 - KEY:KNNAME 姓名（読み）                       
0005.00 FPERSONL1  IF   E           K DISK    USROPN                  
0006.00 F                                     RENAME(PERSONR:PERSONLR)
0007.00  ************************************************************ 
0008.00  * 変数の宣言                                                 
0009.00  ************************************************************ 
0010.00  * HTTP 戻りコード                                            
0011.00 D H_OK            C                   200                     
0012.00 D H_NOTFOUND      C                   404                     
0013.00  *                                                            
0014.00  * オリジナルのレコード様式を DS にマップ                     
0015.00 D person_r1       DS                  LIKEREC(PERSONR:*INPUT) 
0016.00 D person_r2       DS                  LIKEREC(PERSONLR:*INPUT)
0017.00  *                                                            
0018.00  * 登録者一覧　レコード定義 (JSON の項目名用に再定義 )        
0019.00 D personRec       DS                  QUALIFIED TEMPLATE      
0020.00 D   registNumber                 5S 0                        
0021.00 D   name_kanji                  22                           
0022.00 D   name_kana                   20                           
0023.00 D   gender                       1                           
0024.00 D   tel_primary                 12                           
0025.00 D   tel_secondary...                                         
0026.00 D                               12                           
0027.00 D   postalCode                   8                           
0028.00 D   prefecture                  10                           
0029.00 D   address_1                   32                           
0030.00 D   address_2                   32                           
0031.00 D   address_3                   32                           
0032.00 D   dateOfBirth                  8S 0                        
0033.00  *                                                           
0034.00  ************************************************************
0035.00  * プロトタイプ宣言                                          
0036.00  ************************************************************
0037.00  * 登録番号をキーとした 1 レコード検索                       
0038.00 D getByRegno      PR                                         
0039.00 D   key_regno                    5S 0 CONST                  
0040.00 D   single_rcd                        LIKEDS(personRec)          
0041.00 D   httpStatus                  10I 0                            
0042.00  *                                                               
0043.00  * 名前（カナ）を部分キーとした複数レコード検索                  
0044.00 D getByKanaName   PR                                             
0045.00 D   key_knname                  20    CONST                      
0046.00 D   multi_rcds_LENGTH...                                         
0047.00 D                               10I 0                            
0048.00 D   multi_rcds                        LIKEDS(personRec)          
0049.00 D                                     DIM(1000) OPTIONS(*VARSIZE)
0050.00 D   httpStatus                  10I 0                            
0051.00  *                                                               
0052.00  ************************************************************    
0053.00  * プロシージャー                                                
0054.00  ************************************************************    
0055.00  * 登録番号をキーとした 1 レコード検索                           
0056.00 P getByRegno      B                   EXPORT                     
0057.00 D getByRegno      PI                                             
0058.00 D   key_regno                    5S 0 CONST                      
0059.00 D   single_rcd                        LIKEDS(personRec)          
0060.00 D   httpStatus                  10I 0                        
0061.00  *                                                           
0062.00   CLEAR person_r1;                                           
0063.00                                                              
0064.00   OPEN(E) PERSON;                                            
0065.00   CHAIN(E) key_regno PERSONR person_r1;                      
0066.00                                                              
0067.00   IF %FOUND;                                                 
0068.00     single_rcd = person_r1;                                  
0069.00     httpStatus = H_OK;                                       
0070.00   ELSE;                                                      
0071.00     httpStatus = H_NOTFOUND;                                 
0072.00   ENDIF;                                                     
0073.00                                                              
0074.00   CLOSE(E) PERSON;                                           
0075.00  *                                                           
0076.00 P getByRegno      E                                          
0077.00  *                                                           
0078.00  ************************************************************
0079.00  * 名前（カナ）を前方一致の部分キーとした複数レコード検索    
0080.00 P getByKanaName   B                   EXPORT           
0081.00 D getByKanaName   PI                                   
0082.00 D   key_knname                  20    CONST            
0083.00 D   multi_rcds_LENGTH...                               
0084.00 D                               10I 0                  
0085.00 D   multi_rcds                        LIKEDS(personRec)
0086.00 D                                     DIM(1000)        
0087.00 D                                     OPTIONS(*VARSIZE)
0088.00 D   httpStatus                  10I 0                  
0089.00  *                                                     
0090.00    CLEAR person_r2;                                    
0091.00    multi_rcds_LENGTH = 1;                              
0092.00                                                        
0093.00    OPEN(E) PERSONL1;                                   
0094.00    SETLL(E) key_knname PERSONLR;                       
0095.00                                                        
0096.00    IF %FOUND(PERSONL1);                                
0097.00      DOW (1 = 1);                                      
0098.00        READ PERSONL1 person_r2;                        
0099.00        IF %EOF(PERSONL1);                              
0100.00          LEAVE;                                                         
0101.00        ENDIF;                                                           
0102.00        multi_rcds(multi_rcds_LENGTH) = person_r2;                       
0103.00        IF key_knname <> %SUBST(multi_rcds(multi_rcds_LENGTH).name_kana :
0104.00                                1 : %LEN(%TRIMR(key_knname)));           
0105.00          LEAVE;                                                         
0106.00        ENDIF;                                                           
0107.00        multi_rcds_LENGTH += 1;                                          
0108.00        IF multi_rcds_LENGTH > 1000;                                     
0109.00          LEAVE;                                                         
0110.00        ENDIF;                                                           
0111.00      ENDDO;                                                             
0112.00    ENDIF;                                                               
0113.00                                                                         
0114.00    multi_rcds_LENGTH -= 1;                                              
0115.00    IF multi_rcds_LENGTH > 0;                                            
0116.00      httpStatus = H_OK;                                                 
0117.00    ELSE;                                                                
0118.00      httpStatus = H_NOTFOUND;                                           
0119.00    ENDIF;                                                               
0120.00                      
0121.00    CLOSE(E) PERSONL1;
0122.00  *                   
0123.00 P getByKanaName   E  
```

* 105～106行目：検索キーとして指定された文字列長分のみを比較。

下記の手順で*SRVPGMにコンパイルします。

```
> CHGCURLIB CURLIB(WEBSxxB)                                             
   現行ライブラリーが WEBSXXLIB に変更された。                            
> CRTRPGMOD MODULE(QTEMP/IWSSVRRPG) SRCFILE(SOURCE)                       
   モジュール IWSSVRRPG がライブラリー QTEMP に入れられました。最高の重大 
     度は 00 。 XX/XX/XX の XX:XX:XX に作成されました。                   
> CRTSRVPGM SRVPGM(IWSSVRRPG) MODULE(QTEMP/IWSSVRRPG) EXPORT(*ALL)        
   サービス・プログラム IWSSVRRPG がライブラリー WEBSXXLIB に作成された。
```
 
<br>

### <u>ワーク7 IWSでILE-RPGをWebサービス化</u>

Webサービス1/2を実装したILE-RPGサービス・プログラム「IWSSVRRPG」を、IWSの「新規サービスの配置」ウィザードでWebサービス化します。

<br>

<font color="blue">

IWSはIBM iバージョンやTR/PTFレベルにより、画面・機能が変わります。ワークの手順が継続できない場合はハンズオン用のサーバーを使用下さい。

ウィザード実行中にWebブラウザのウインドゥサイズを変えたり、別のタブを表示したりすると実行中のステップから画面が遷移する事があるので、ウィザード中は変更しないようにしましょう。

ハンズオン用サーバーを利用する場合は「01」を「1.3設定情報」に合わせて下さい。
</font>

**□ W7-1.** 「Webサービス・サーバーの管理」画面で、左上の「配置済みサービスの管理」をクリック。登録済みのサービス名を確認し、左上の「新規サービスの配置」をクリックして「新規サービスの配置」ウィザードを開始。

![ワーク7_IWSでILE-RPGをWebサービス化.jpg](/files/ワーク7_IWSでILE-RPGをWebサービス化.jpg)

**□ W7-2.** 「Webサービス・タイプの指定- ステップ **1/10**」でサービス・タイプがRESTであることを確認、「WebサービスとしてのILEプログラム・オブジェクト」を選択し、「プログラム・オブジェクトのパス」にIFS形式でILE-RPGサービス・プログラム(例では「/QSYS.LIB/WEBSxxLIB.LIB/IWSSVRRPG.SRVPGM」)を入力して「次へ」をクリック。

![ワーク7_IWSでILE-RPGをWebサービス化1.jpg](/files/ワーク7_IWSでILE-RPGをWebサービス化1.jpg)

**□ W7-3.** 「サービス名の指定- ステップ **2/10**」では、「リソース名」に既存の名前と重複しないサービス名を指定し、任意の「サービス記述」(例では「person2」)を入力。「URIパス・テンプレート」はデフォルトの「/」のままで「次へ」をクリック。

![ワーク7_IWSでILE-RPGをWebサービス化2.jpg](/files/ワーク7_IWSでILE-RPGをWebサービス化2.jpg)

**□ W7-4.** 「セキュリティー制約の指定- ステップ **3/10**」は、ここではデフォルトを変更せずに「次へ」をクリック。

![ワーク7_IWSでILE-RPGをWebサービス化3.jpg](/files/ワーク7_IWSでILE-RPGをWebサービス化3.jpg)

**□ W7-5.** 「Webサービスとして外部化するエクスポート・プロシージャーの選択- ステップ **4/10**」画面が表示されるので、「全て展開表示」をクリック。

![ワーク7_IWSでILE-RPGをWebサービス化4.jpg](/files/ワーク7_IWSでILE-RPGをWebサービス化4.jpg)

ウィザードは、ILERPGのPCML情報からEXPORTされているプロシージャーと入出力パラメーターを提示するので、各プロシージャーのパラメーターがILE-RPGの定義通りに提示されていることを確認し、「次へ」をクリック。

**□ W7-6.** 「ILE プロシージャー情報の指定- ステップ **5/10**」では、プロシージャーごとに文字列のトリムやプロシージャー呼出し成功／失敗時のHTTP状況コードを指定。いずれのプロシージャーもデフォルトのまま「次へ」をクリック。

![ワーク7_IWSでILE-RPGをWebサービス化5.jpg](/files/ワーク7_IWSでILE-RPGをWebサービス化5.jpg)

**□ W7-7.** 「リソース・メソッド情報の指定- ステップ **6/10**」で、プロシージャー毎に、HTTP要求メソッド、HTTP応答コード、入出力メディア・タイプ、入力パラメーターのラップ、などを選択/入力。設定を確認して「次へ」をクリック。

**(Webサービス2のプロシージャー「GETBYKANANAME」)**

![ワーク7_IWSでILE-RPGをWebサービス化6.jpg](/files/ワーク7_IWSでILE-RPGをWebサービス化6.jpg)

**(Webサービス1のプロシージャー「GETBYREGNO」)**

![ワーク7_IWSでILE-RPGをWebサービス化7.jpg](/files/ワーク7_IWSでILE-RPGをWebサービス化7.jpg)

**□ W7-8.** 「このサービスのユーザーIDを指定- ステップ **7/10**」はデフォルトのままWebサービス・サーバーのユーザーIDを使用することとし、「次へ」をクリック。

![ワーク7_IWSでILE-RPGをWebサービス化8.jpg](/files/ワーク7_IWSでILE-RPGをWebサービス化8.jpg)

**□ W7-9.** 「ライブラリー・リストの指定- ステップ **8/10**」では、Webサービス実行時のライブラリー・リストを必要に応じて指定。デフォルトのまま「次へ」をクリック。

![ワーク7_IWSでILE-RPGをWebサービス化9.jpg](/files/ワーク7_IWSでILE-RPGをWebサービス化9.jpg)

**□ W7-10.** 「受け渡すトランスポート情報の指定- ステップ **9/10**」で、呼び出されるプログラムに渡す環境変数を必要に応じて選択。例のILE-RPGサービス・プログラム「IWSSVRRPG」は環境変数を参照しないので、デフォルト(未選択)のまま「次へ」をクリック。

![ワーク7_IWSでILE-RPGをWebサービス化a.jpg](/files/ワーク7_IWSでILE-RPGをWebサービス化a.jpg)

**□ W7-11.** 「要約- ステップ **10/10**」画面で「完了」をクリックするとWebサービスが配置される。

![ワーク7_IWSでILE-RPGをWebサービス化b.jpg](/files/ワーク7_IWSでILE-RPGをWebサービス化b.jpg)

**□ W7-12.** 「配置済みサービスの管理」画面が表示される。「最新表示」をクリックして、状況が「インストール中」から「実行中」になるまで待機。

![ワーク7_IWSでILE-RPGをWebサービス化c.jpg](/files/ワーク7_IWSでILE-RPGをWebサービス化c.jpg)

**□ W7-13.** sshクライアントでIBM iにログインし、curlコマンドでWebサービス1からデータが得られることを確認。

```bash
bash-5.1$ curl -s -X GET 'http://ibmi:10134/web/services/person2/?regNo=21' | jq
{
  "single_rcd": {
    "registNumber": 21,
    "name_kanji": "米山　正義",
    "name_kana": "ｺﾒﾔﾏ ﾏｻﾖｼ",
    "gender": "M",
    "tel_primary": "0192810576",
    "tel_secondary": "09050659927",
    "postalCode": "027-0035",
    "prefecture": "岩手県　",
    "address_1": "宮古市",
    "address_2": "花輪2-14-3",
    "address_3": "ヴィレッジ花輪215",
    "dateOfBirth": 19850515
  }
}
bash-5.1$
```

**□ W7-14.** 同様にcurlコマンドでWebサービス2からデータ(複数項目)が得られることを確認。

```bash
bash-5.1$ curl -s -X POST 'http://ibmi:10134/web/services/person2/' -H 'Content-Type: application/json' -d '{"key_knname": "ﾖｺ"}' | jq
{
  "multi_rcds": [
    {
      "registNumber": 979,
      "name_kanji": "横尾　良吉",
      "name_kana": "ﾖｺｵ ﾘｮｳｷﾁ",
      "gender": "M",
      "tel_primary": "0878893150",
      "tel_secondary": "08092020150",
      "postalCode": "766-0025",
      "prefecture": "香川県　",
      "address_1": "仲多度郡まんのう町",
      "address_2": "真野3-20-14",
      "address_3": "真野庵310",
      "dateOfBirth": 19670225
    },
    {
      "registNumber": 222,
      "name_kanji": "横尾　蓮",
      "name_kana": "ﾖｺｵ ﾚﾝ",
      "gender": "M",
      "tel_primary": "0877771952",
      "tel_secondary": "08039690834",
～～～～～～～～～～～～～～～ 後略 ～～～～～～～～～～～～～～～～～
```

**□ W7-15.** (オプション) curlを「-v」オプション(HTTPリクエストの詳細表示)付きで実行し、存在しないレコード(例え検索キーに「x」を指定)を要求した時のHTTP応答を確認。

**□ W7-16.** (オプション) 「配置済みサービスの管理」画面で、①作成したサービス「person2」の「Swaggerの表示」をクリックしてSwaggerをブラウザに表示。②Swagger Editor (https://editor.swagger.io/ )にアクセスし、「person2」のSwaggerをSwagger Editorの左ペインに貼付けて③右ペインの項目で「Webサービス1」(GET)および「Webサービス2」(POST)の仕様を確認。

![ワーク7_IWSでILE-RPGをWebサービス化d.jpg](/files/ワーク7_IWSでILE-RPGをWebサービス化d.jpg)

<br>

## 4.3 ③ CGI (ILE-RPG)

この節ではILE-RPGプログラムをIBM HTTP ServerのCGI経由でWebサービスとして利用する例を解説します。

?> CGIは「Common Gateway Interface」の略で、Webサーバー上でユーザー・プログラムを動作させるための仕組み。詳細は「CGIプログラミング」(https://www.ibm.com/docs/ja/i/7.5?topic=programming-cgi )を参照。

「IBM Web Administration for i」でWebブラウザからIHS(Apache Webサーバー)を構成できますが、操作が冗長/複雑になります。以下ではIHSの構成を手動で行います。主要な構成要素を下図に示します。

?> 手動で作成した構成が「IBM Web Administration for i」の「すべてのHTTPサーバー」に表示されない場合はWebブラウザを再起動。また、構成の手順を省力化したい場合は「新しい HTTP サーバーの作成」ウィザードでWebサーバーの初期構成を作成し、必要な部分を修正すると効率的。

![4.3_③_CGI_ILE-RPG.jpg](/files/4.3_③_CGI_ILE-RPG.jpg)

<br>

構成は大きく次の2ステップで作成します。

①	ファイルQUSRSYS/QATMHINSTCのメンバーに、IFS上のHTTP構成ファイル情報の場所を登録。

```
> ADDPFM FILE(QUSRSYS/QATMHINSTC) MBR(WEBSXX) TEXT('Web サービス・サーバー
  (ILE-CGI)')                                                             
   メンバー WEBSXX が QUSRSYS のファイル QATMHINSTC に追加された。        
> UPDDTA FILE(QUSRSYS/QATMHINSTC) MBR(WEBSXX)                             

  ファイル中のデータ処理                         モード  . . :    入力          
  様式  . . . . :   QTMHINC                      ファイル  . :   QATMHINSTC     
                                                                                
                                                                                
 Instance Data: -apache -d /www/websxx -f conf/httpd.conf -AutoStartN           
```

②	IFSの「/」ディレクトリー下にHTTP関連ディレクトリーを作成。EDTFコマンドなどでHTTPサーバーの設定を「httpd.conf」ファイルに記述。

?> 「HTTP サーバーの作成」ウィザードで作成するとhttpd.confはCCSID 13488 (UCS2)で作成される。一方で「Web Servicesサーバーの作成」ウィザードで作成されるhttpd.confはCCSID 1208 (UTF-8)となる。どちらが(あるいは「どちらも」)正しいのかは不明。

```
> CMD('mkdir /www/websxx ; cd /www/websxx/ ; mkdir conf htdocs logs ; t
  ouch -C 1208 /www/websxx/conf/httpd.conf')                               
   コマンドは終了状況 0 で正常に終了しました。                            
```

**(HTTP構成ファイル /www/websxx/conf/httpd.conf)**

```
0001 Listen *:10180
0002 DocumentRoot /www/websxx/htdocs
0003 AddCharset UTF-8 .html .pgm
0004 TraceEnable Off
0005 Options -FollowSymLinks
0006 LogFormat "%h %T %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" combined
0007 LogFormat "%{Cookie}n \"%r\" %t" cookie
0008 LogFormat "%{User-agent}i" agent
0009 LogFormat "%{Referer}i -> %U" referer
0010 LogFormat "%h %l %u %t \"%r\" %>s %b" common
0011 CustomLog logs/access_log combined
0012 LogMaint logs/access_log 7 0
0013 LogMaint logs/error_log 7 0
0014 DefaultFsCCSID 1399
0015 DefaultNetCCSID 1208
0016 ServerUserID websxx
0017 ScriptAlias /cgi-bin /qsys.lib/websxxlib.lib
0018 <Directory /www/websxx/htdocs>
0019      Require all granted
0020 </Directory>
0021 <Directory /qsys.lib/websxxlib.lib>
0022      Require all granted
0023 </Directory>
0024 <Location /cgi-bin/>
0025      CGIJobCcsid 1399
0026 </Location>
```

* 3行目：AddCharsetディレクティブで、拡張子が「html」および「pgm」のファイルの文字セットにUTF-8を指定。
* 15行目：DefaultNetCCSIDディレクティブで、CGIプログラムの入力要求データ、および、要求元(クライアント・ブラウザー)に返信するCGIプログラムからの出力応答データ変換の文字セットにUTF-8(CCSID 1208)を指定。
* 17行目：ScriptAliasディレクティブで、CGIプログラムを配置するライブラリーをIFS形式で指定。
* 21～23行目のDirectoryディレクティブで、CGIプログラム・ライブラリーへのアクセスを許可。
* 24～26行目のLocationディレクティブで、CGIジョブ実行時に使用されるCCSID、CGIジョブの文字セット環境、およびサーバーがCGIプログラムの入出力データを変換する時に使用される EBCDIC CCSIDに、日本語EBCDIC英数小文字(CCSID 1399)を指定。

<br>

CGIプログラムは下図のロジックでWebサービスを実装しています。実際のコードは「5.2.1 ILE-RPGプログラム：WEBSxxLIB/WSCGI」を参照ください。

![4.3_③_CGI_ILE-RPG1.jpg](/files/4.3_③_CGI_ILE-RPG1.jpg)

<br>

クライアントからのリクエストに対する正常時の応答は次のようになります。

* HTTP200：正常終了

  * GET (Webサービス1)
```bash
bash-5.1$ curl http://ibmi:10180/cgi-bin/wscgi.pgm?regNo=123
{"single_rcd":{"registNumber":123,"name_kanji":"奥　勝義","name_kana":"ｵｸ ｶﾂﾖｼ","gender":"M","tel_primary":"095053194","tel_secondary":"09029664487","postalCode":"852-8056","prefecture":"長崎県　","address_1":"長崎市","address_2":"大宮町1-17-6","address_3":"","dateOfBirth":19890521}}
```

  * POST (Webサービス2)
```bash
bash-5.1$ curl -X POST -H "Content-Type: application/json" -d '{"kanaName" : "ｱｷ"}' http://ibmi:10180/cgi-bin/wscgi.pgm
{"rcd_cnt":6,"multi_rcds":[{"registNumber":769,"name_kanji":"秋田　里香","name_kana":"ｱｷﾀ ﾘｶ","gender":"F","tel_primary":"0763716410","tel_secondary":"09040～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
山　直吉","name_kana":"ｱｷﾔﾏ ﾅｵｷﾁ","gender":"M","tel_primary":"0234199664","tel_secondary":"09094896891","postalCode":"990-2404","prefecture":"山形県　","address_1":"山形市","address_2":"八森3-2-5","address_3":"","dateOfBirth":19601109}]}
```

エラー時の応答をcurlに「-v」(処理状況の詳細を出力)オプションを指定して確認します。

* HTTP404：リソースが見つからない(検索対象データなし)
  * GET (Webサービス1)
```bash
bash-5.1$ curl -s -v http://ibmi:10180/cgi-bin/wscgi.pgm?regNo=12345
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
< HTTP/1.1 404 Not found
< Date: Wed, 12 Apr 2023 07:53:36 GMT
< Server: Apache
< Transfer-Encoding: chunked
< Content-Type: text/plain; charset=UTF-8
<
404 Not found.
```

  * POST (Webサービス2)
```bash
bash-5.1$ curl -s -v -X POST -H "Content-Type: application/json" -d '{"kanaName" : "xx"}' http://ibmi:10180/cgi-bin/wscgi.pgm
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
< HTTP/1.1 404 Not found
< Date: Mon, 17 Apr 2023 02:58:25 GMT
< Server: Apache
< Transfer-Encoding: chunked
< Content-Type: text/plain; charset=UTF-8
<
404 Not found.
```

* HTTP405：サポートされないHTTPメソッド

```bash
bash-5.1$ curl -s -v -X PUT http://ibmi:10180/cgi-bin/wscgi.pgm?regNo=123
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
* Mark bundle as not supporting multiuse
< HTTP/1.1 405 Method Not Allowed
< Date: Wed, 12 Apr 2023 07:55:21 GMT
< Server: Apache
< Transfer-Encoding: chunked
< Content-Type: text/plain; charset=UTF-8
<
405 Method Not Allowed.
* Connection #0 to host ibmi left intact
```

* HTTP500：内部エラー

```bash
bash-5.1$ curl -s -v http://ibmi:10180/cgi-bin/wscgi.pgm?regNo=xxxx
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
* Mark bundle as not supporting multiuse
< HTTP/1.1 500 Internal Server Error
< Date: Wed, 12 Apr 2023 07:52:50 GMT
< Server: Apache
< Connection: close
< Transfer-Encoding: chunked
< Content-Type: text/plain; charset=UTF-8
<
500 Internal Server Error.
* Closing connection 0
```

<br>

---

<br>

IBM HTTP ServerとILE-RPGを組み合わせてWebサービスを構築した例を紹介しました。CGIはOS/400バージョン3.2/3.7からサポートされている技術であり、安定したWebサービスの基盤と言えます。ILE-RPGやSQLの機能拡張と合わせて、柔軟で高機能なWebサービスの構築を検討する際の有力な選択肢となるでしょう。

<br>

なお、基幹業務のWebサービスとして利用する場合は、「2.2 Webサービスの要件」で述べた様な、下記の機能/非機能要件を考慮する事をお勧めします。

* **セキュリティ**：Webサービスで使用する通信経路の暗号化方法。また、ブラックボックス・テストなどの手法により、不正なアクセスに対する耐性を確認。

* **監査対応**：IBM HTTP Serverのログ以外に、アプリケーション側でのログ取得の要否を検討。ログを取得する場合は、目的、項目、運用方法を規定。

* **パフォーマンス**：ピーク時を定義し、応答時間やシステムリソースの使用率が許容値にある事。必要であれば実環境でテストを実施。結果によって、システムリソースの追加、回線の広帯域化、ロードバランシングなどの対応を検討。

* **可用性**：Webサービスに業務上の時限が設定されている場合、Webサービス・サーバーの計画/非計画停止に備えてサーバーを二重化する必要性を考慮。

* **文字コード**：Webサービスで許容する文字セット(JIS90/JIS2004/ユニコードなど)。非対応の文字コードが含まれたデータの扱い(通信エラー扱い、「？」など特定文字に置き換え、エスケープ形式で保持、など)を規定。

<br>

---

<br>

### (参考) SQLによるDB⇒JSON変換

ILE-RPGプログラム「WSCGI」はクライアントに返すJSON文字列をロジックで作りこんでいますが、SQLのJSON機能を利用すればこの部分を簡略化できます。

下記のようなSQL文を実行すると選択されたレコードの内容がJSON文字列に変換されるので、これをクライアントに送信します。

?> SQLによるJSON処理の詳細はIBM Docsの「JSON データの生成」(https://www.ibm.com/docs/ja/i/7.5?topic=data-generating-json )を参照。


```sql
0001 SELECT JSON_OBJECT(
0002     'records' VALUE JSON_ARRAYAGG(
0003       JSON_OBJECT(
0004         'registNumber' VALUE REGNO, 
0005         'name_kanji' VALUE TRIM(KJNAME), 
0006         'name_kana' VALUE TRIM(KNNAME)
0007       )
0008     )
0009   )
0010   FROM WEBSXXLIB.PERSON
0011   WHERE KNNAME LIKE 'ｱｶ' || '%'
0012 ;
```

<br>

3行目：JSON_OBJECTスカラー関数でデータベースのカラムを1レコード1行のJSONデータに変換。

```
{"registNumber":856,"name_kanji":"明石　正","name_kana":"ｱｶｲｼ ﾀﾀﾞｼ"}
{"registNumber":929,"name_kanji":"我妻　幸春","name_kana":"ｱｶﾞﾂﾏ ﾕｷﾊﾙ"}
{"registNumber":599,"name_kanji":"上野　浩之","name_kana":"ｱｶﾞﾉ ﾋﾛﾕｷ"}
```

2行目：JSON_ARRAYAGG集約関数で結果をラップし、配列を作成。

```json
[{"registNumber":856,"name_kanji":"明石　正","name_kana":"ｱｶｲｼ ﾀﾀﾞｼ"},{"registNumber":929,"name_kanji":"我妻　幸春","name_kana":"ｱｶﾞﾂﾏ ﾕｷﾊﾙ"},{"registNumber":599,"name_kanji":"上野　浩之","name_kana":"ｱｶﾞﾉ ﾋﾛﾕｷ"}]
```

1行目：再度JSON_OBJECTスカラー関数で配列をラップして単一のJSONオブジェクトを生成し、SELECTの出力とする。

```json
{"records":[{"registNumber":856,"name_kanji":"明石　正","name_kana":"ｱｶｲｼ ﾀﾀﾞｼ"},{"registNumber":929,"name_kanji":"我妻　幸春","name_kana":"ｱｶﾞﾂﾏ ﾕｷﾊﾙ"},{"registNumber":599,"name_kanji":"上野　浩之","name_kana":"ｱｶﾞﾉ ﾋﾛﾕｷ"}]}
```

PASE環境で実行してjqコマンドで表示すれば生成されたJSONの構造が分かります。

```bash
bash-5.1$ db2 "SELECT JSON_OBJECT('records' VALUE JSON_ARRAYAGG(JSON_OBJECT('registNumber' VALUE REGNO, 'name_kanji' VALUE TRIM(KJNAME), 'name_kana' VALUE TRIM(KNNAME)))) FROM WEBSXXLIB.PERSON WHERE KNNAME LIKE 'ｱｶ' || '%'" | grep -i "^{" | jq .
{
  "records": [
    {
      "registNumber": 856,
      "name_kanji": "明石　正",
      "name_kana": "ｱｶｲｼ ﾀﾀﾞｼ"
    },
～～～～～～～～～～～～～～～ 後略 ～～～～～～～～～～～～～～～～～
```

<br>

## 4.4 ④ PASE CGI (Python)

IHS(IBM HTTP Server)はCGIプログラムとして、ILE C/C++、ILE RPG、およびILE COBOLの他に、PASE for iのプログラム(スクリプト)を実行する事ができます。この節ではPythonスクリプトのCGIからの利用例を紹介します。

<br>

下図は関連コンポーネントの構成概要を示します。

![4.4_④_PASE_CGI_Python.jpg](/files/4.4_④_PASE_CGI_Python.jpg)

HTTP構成で拡張子「.py」が要求された時にラッパー・スクリプトを経由して目的のPythonスクリプトを呼び出す点が構成上のポイントです。ではHTTP構成から確認しましょう。

**(HTTP構成ファイル /www/pasecgi/conf/httpd.conf)**

```
0001 Listen *:10380
0002 DocumentRoot /www/pasecgi/htdocs
0003 TraceEnable Off
0004 Options -FollowSymLinks
0005 LogFormat "%h %T %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" combined
0006 LogFormat "%{Cookie}n \"%r\" %t" cookie
0007 LogFormat "%{User-agent}i" agent
0008 LogFormat "%{Referer}i -> %U" referer
0009 LogFormat "%h %l %u %t \"%r\" %>s %b" common
0010 CustomLog logs/access_log combined
0011 LogMaint logs/access_log 7 0
0012 LogMaint logs/error_log 7 0
0013 
0014 CGIJobCCSID 1399
0015 <Directory />
0016      Require all denied
0017 </Directory>
0018 <Directory /www/pasecgi/htdocs>
0019      Require all granted
0020 </Directory>
0021 
0022 AddType application/x-httpd-python .py
0023 Action application/x-httpd-python /python-bin/pycgi
0024 ScriptAlias /python-bin/ /QOpenSys/usr/python-scripts/
0025 <Directory /QOpenSys/usr/python-scripts>
0026      Require all granted
0027 </Directory>
0028 
0029 Alias /python-script /QOpenSys/usr/python-scripts
0030 <Location /python-script>
0031      Order deny,allow
0032      Allow from all
0033 </Location>
```

* 22行目：AddTypeディレクティブで拡張子「.py」をコンテンツ・タイプ「application/x-httpd-python」として登録。
* 23行目：Actionディレクティブで、拡張子「.py」で終わるパスが要求された場合に、常に「/python-bin/pycgi」が呼ばれるように指定。
* 24行目：ScriptAliasディレクティブで、パス「/python-bin/」のファイルシステム上の実パスを「/QOpenSys/usr/python-scripts/」に指定。

  ?> ScriptAliasは基本的にAliasesと同じだが、ターゲット・ディレクトリーのドキュメントがアプリケーションとして扱われ、クライアントに送信されるドキュメントとしてではなく、要求されたときにサーバーによって実行される。

* 25～27行目のDirectoryディレクティブで「/QOpenSys/usr/python-scripts」へのアクセスを許可。
* 29行目：Aliasディレクティブで、パス「/python-script」のファイルシステム上の実パスを「/QOpenSys/usr/python-scripts」に指定。
* 30～33行目：Locationディレクティブで、パス「/python-script」へのアクセスを許可。

<br>

Wrapperスクリプトの「pycgi」は3行のPythonスクリプトです。クライアントからの要求の末尾の拡張子が「.py」の場合に呼び出されるようにhttpd.confを設定します。

![4.4_④_PASE_CGI_Python1.jpg](/files/4.4_④_PASE_CGI_Python1.jpg)

<br>

**(Pythonスクリプト /QOpenSys/usr/python-scripts/pycgi)**

```python
0001 #!/QOpenSys/pkgs/bin/python
0002 import os
0003 os.execlp(os.environ['PATH_TRANSLATED'], 'argv')
```

* 1行目：デフォルトのPythonで以下の命令の実行をシバンで指定。
* 3行目：CGIは環境変数「PATH_TRANSLATED」にローカル(IBM i)の絶対パス情報を記録するので、execlp()関数は現在のプロセスを置き換える形で渡されたパス(Pythonスクリプト)を実行。

<br>

最終的に「pycgi」がURLで指定されたPythonスクリプト(上の例では「personqry.py」)を実行し、その結果がクライアントに戻されます。

Wrapperスクリプト「pycgi」を含め、PythonスクリプトをIBM iに配置する際に下記の考慮事項があります。

* 文字コードはUTF-8(CCSID 1208)で作成し、改行コードにLFを使用。
* スクリプトの実行にはパーミッションが必要なので、シェルから「chmod 755 パス」のように必要な権限を付与。

<br>

以下は「Webサービス1/2」の機能を実行するPython CGIスクリプトの例です。

?> PythonのCGIサポートは「cgi --- CGI (ゲートウェイインターフェース規格)のサポート」(https://docs.python.org/ja/3/library/cgi.html )などを参照。

**(Pythonスクリプト /QOpenSys/usr/python-scripts/personqry.py)**

```python
0001 #!/QOpenSys/pkgs/bin/python
0002 
0003 import os, sys, io
0004 import cgi
0005 import json
0006 import pyodbc
0007 import pandas as pd
0008 
0009 sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
0010 sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
0011 sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
0012 
0013 JSON_String = ""
0014 JSON_Count = 0
0015 err = ""
0016 
0017 def exec_SQL(stmt):
0018     global JSON_String
0019     global JSON_Count
0020     global err
0021     conn = pyodbc.connect(
0022         'Driver={IBM i Access ODBC Driver}; '
0023         'System=localhost; '
0024         'UID=websxx; '
0025         'PWD=websxx; '
0026         )
0027     cursor = conn.cursor()
0028     try:
0029         df = pd.read_sql(stmt, conn)
0030         JSON_Count = len(df)
0031         if JSON_Count == 0:
0032             return 404
0033         else:
0034             # 整数値に変換して「.0」を除去
0035             df = df.astype({'REGNO': int, 'BIRTHD': int})
0036             # JSON変換と空白除去
0037             JSON_String = \
0038                 df.applymap(lambda x: x.strip() \
0039                 if isinstance(x, str) \
0040                 else x).to_json(orient='records')
0041     except Exception as e:
0042         err = str(e)
0043         return 500
0044     finally:
0045         cursor.close()
0046         conn.close()
0047     return 200 
0048 
0049 reqMethod = os.environ["REQUEST_METHOD"]
0050 
0051 if reqMethod == "GET":
0052     form = cgi.FieldStorage() 
0053     sql_rc = exec_SQL( \
0054         "select * from websxxlib.person where REGNO=" + \
0055         form.getvalue("regNo"))
0056 elif reqMethod == "POST":
0057     req_dict = json.loads(sys.stdin.read(int(os.environ.get \
0058                          ('CONTENT_LENGTH', '0'))))
0059     sql_rc = exec_SQL( \
0060         "select * from websxxlib.person where KNNAME like '" + \
0061         req_dict["kanaName"] + "%'")
0062 else:
0063     sql_rc = 405
0064 
0065 if sql_rc == 200:
0066     print("Status: 200 OK\r\nContent-type: text/json\r\n")
0067     # 末尾文字を削除
0068     if reqMethod == "GET":
0069         outStr = '{"single_rcd":' + JSON_String[1:][:-1] + '}'
0070         print(outStr.encode().decode('unicode-escape'))
0071     else:
0072         outStr = '{"rcd_cnt":' + str(JSON_Count) + \
0073                  ',"multi_rcds":' + JSON_String + '}'
0074         print(outStr.encode().decode('unicode-escape'))
0075 elif sql_rc == 404:
0076     print("Status: 404 Not found\r\n" \
0077           "Content-Type: text/plain\r\n\r\n404 Not found.")
0078 elif sql_rc == 405:
0079     print("Status: 405 Method Not Allowed\r\n" \
0080           "Content-Type: text/plain\r\n\r\n" \
0081           "405 Method Not Allowed.")
0082 elif sql_rc == 500:
0083     print("Status: 500 Internal Server Error\r\n" \
0084           "Content-Type: text/plain; charset=utf-8\r\n\r\n" \
0085           "500 Internal Server Error\r\n" + err)
```

* 17行目～：関数「exec_SQL」は渡されたSQLを実行し、結果をグローバル変数のJSON_String、JSON_Count、errに記録、HTTPステータスを戻り値で返す。
* 29行目：渡されたSQL文をODBC経由で実行し、結果をDataFrameに記録。
* 34～40行目：DataFrameの値を整形し、JSON形式に変換。DataFrame全体に関数を適用するためapplymap()を使用し、ラムダ式(無名関数)でデータ型が文字の場合にstrip()を実行。「to_json」メソッドでpandas.DataFrameをJSONに変換する際、他の実装例に合わせたJSON形式とするため「orient=‘records’」を指定。
* 51～61行目：HTTPメソッドがGETの場合、CGIモジュールが提供するFieldStorageクラスで「regNo」に対応する値を取り出してSQL文を構築。POSTの場合は、Pythonの辞書(dict)型オブジェクトに、json.loadsでデコードしたデータを代入し、この辞書変数「req_dict」から「kanaName」をキーとする値を取り出し、SQL文を構築。
* 65～74行目：関数「exec_SQL」の戻り値(HTTPのステータス)が200は正常終了なので、HTTPヘッダーとJSONデータを書き出し。このとき、データが「\u1234」のようにユニコード・エスケープされているとJSONデータの視認性が著しく低下するので、「decode(‘unicode-escape’)」で元の文字列にデコード。
* 75行目～：関数「exec_SQL」でエラーが発生した場合は、エラーの内容に応じた応答を出力。

<br>

ILE-RPGのCGIと同様にcurlからリクエストを発行して応答を確認します。

* HTTP200：正常終了
  * GET (Webサービス1)
```bash
bash-5.1$ curl -s http://ibmi:10380/python-script/personqry.py?regNo=167
{"single_rcd":{"REGNO":167,"KJNAME":"大嶋　孝義","KNNAME":"ｵｵｼﾏ ﾀｶﾖｼ","GENDER":"M","TEL":"0265809955","MOBILE":"09035781258","POST":"389-0807","PREF":"長野県","ADDR1":"千曲市","ADDR2":"戸倉温泉4-3-10","ADDR3":"戸倉温泉プラチナ108","BIRTHD":19710715}}
```

  * POST (Webサービス2)
```bash
bash-5.1$ curl -s -X POST -H "Content-Type: application/json" -d '{"kanaName" : "ﾀﾅ"}' http://ibmi:10380/python-script/personqry.py
{"rcd_cnt":4,"multi_rcds":[{"REGNO":148,"KJNAME":"棚橋　勇二","KNNAME":"ﾀﾅﾊｼ ﾕｳｼﾞ","GENDER":"M","TEL":"04457395","MOBILE":"08020543726","POST":"285-0034","P～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
JNAME":"田辺　盛夫","KNNAME":"ﾀﾅﾍﾞ ﾓﾘｵ","GENDER":"X","TEL":"059204155","MOBILE":"08092556107","POST":"518-0015","PREF":"三重県","ADDR1":"伊賀市","ADDR2":"土橋2-12-7","ADDR3":"土橋アパート401","BIRTHD":19500901}]}
```

* HTTP404：リソースが見つからない(検索対象データなし)
  * GET (Webサービス1)
```bash
bash-5.1$ curl -s -v http://ibmi:10380/python-script/personqry.py?regNo=12345
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
< HTTP/1.1 404 Not found
< Date: Tue, 18 Apr 2023 05:55:24 GMT
< Server: Apache
< Transfer-Encoding: chunked
< Content-Type: text/plain
<
404 Not found.
```

  * POST (Webサービス2)
```bash
bash-5.1$ curl -s -v -X POST -H "Content-Type: application/json" -d '{"kanaName" : "xx"}' http://ibmi:10380/python-script/personqry.py
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
< HTTP/1.1 404 Not found
< Date: Tue, 18 Apr 2023 05:57:18 GMT
< Server: Apache
< Transfer-Encoding: chunked
< Content-Type: text/plain
<
404 Not found.
```

* HTTP405：サポートされないHTTPメソッド

```bash
bash-5.1$ curl -s -v -X PUT http://ibmi:10380/python-script/personqry.py?regNo=123
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
* Mark bundle as not supporting multiuse
< HTTP/1.1 405 Method Not Allowed
< Date: Tue, 18 Apr 2023 06:00:33 GMT
< Server: Apache
< Transfer-Encoding: chunked
< Content-Type: text/plain
<
405 Method Not Allowed.
* Connection #0 to host ibmi left intact
```

* HTTP500：内部エラー

```bash
bash-5.1$ curl -s -v http://ibmi:10380/python-script/personqry.py?regNo=xxxx
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
* Mark bundle as not supporting multiuse
< HTTP/1.1 500 Internal Server Error
< Date: Tue, 18 Apr 2023 06:47:41 GMT
< Server: Apache
< Connection: close
< Transfer-Encoding: chunked
< Content-Type: text/plain; charset=utf-8
<
500 Internal Server Error
Execution failed on sql 'select * from lmswxxlib.person where REGNO=xxxx': ('42S22', '[42S22] [IBM][System i Access ODBC Driver][DB2 for i5/OS]SQL0206 - カラムまたはグローバル変数XXXXが見つかりませんでした。 (-206) (SQLExecDirectW)')
* Closing connection 0
```

<font size="-2">
※ 予期しないエラーが発生した場合は、ディレクトリー「/www/pasecgi/logs」のファイル「error_log.Qcyymmddxx」(c:世紀、yy:西暦下2桁、mm:月、dd:日付、xx:連番)に記録があるか確認。
</font>

<br>

## 4.5 ⑤ PASE WSGI (Python)

WSGI (Web Server Gateway Interfaceの略でPEP 3333で定義。ウィズギー/ウィスキーと発音)は、Python独自のWebサーバーとWebアプリケーションを接続するための標準化されたインターフェース定義です。

?> PEPは「Python Enhancement Proposal」の略で、Pythonの機能や仕様、検討過程などを記載した公開文書。詳細は「PEP 0」(https://peps.python.org/# )を参照。

IHSはZend Enabler (QZFAST.SRVPGM)と呼ばれるApacheモジュールを使用してPASEベースのFastCGI(WSGI)サーバーに接続し、ソケットレベルで通信を行います。Zend EnablerはIBMが提供する汎用FastCGI実装であり、任意のPASE FastCGIサーバーに接続できます。

![4.5_⑤_PASE_WSGI_Python.jpg](/files/4.5_⑤_PASE_WSGI_Python.jpg)

<br>

IHS側でhttpd.confにZend Enabler (FastCGI)の設定を追加します。

**(HTTP構成ファイル /www/fastcgi/conf/httpd.conf)**

```
0001 Listen *:10580
0002 DocumentRoot /www/fastcgi/htdocs
0003 TraceEnable Off
0004 Options -FollowSymLinks
0005 LogFormat "%h %T %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" combined
0006 LogFormat "%{Cookie}n \"%r\" %t" cookie
0007 LogFormat "%{User-agent}i" agent
0008 LogFormat "%{Referer}i -> %U" referer
0009 LogFormat "%h %l %u %t \"%r\" %>s %b" common
0010 CustomLog logs/access_log combined
0011 LogMaint logs/access_log 7 0
0012 LogMaint logs/error_log 7 0
0013 
0014 LoadModule zend_enabler_module /QSYS.LIB/QHTTPSVR.LIB/QZFAST.SRVPGM
0015 
0016 <Directory />
0017    Require all denied
0018 </Directory>
0019 <Directory /www/fastcgi/htdocs>
0020    Require all granted
0021 </Directory>
0022 
0023 Alias /python-script /QOpenSys/usr/python-scripts
0024 <Directory /QOpenSys/usr/python-scripts>
0025    Require all granted
0026    AddType application/x-httpd-python .py
0027    AddHandler fastcgi-script .py
0028 </Directory>
0029 <Directory /python-script>
0030    Require all granted
0031 </Directory>
```

* 14行目：ライブラリーQHTTPSVRのサービス・プログラム、QZFASTから、モジュールzend_enabler_moduleをロード。
* 27行目：AddHandlerディレクティブに「fastcgi-script .py」を指定。

さらに、httpd.confと同じディレクトリーにファイル「fastcgi.conf」を作成します。基本的にZendの推奨値を指定していますが、PHPの部分をPython用に変更しています。

?> 「fastcgi.conf」の設定は、Zendのホームページ「Configure PASE FastCGI Support for PHP Processing」(https://help.zend.com/zend/current/content/i5_configure_pase_fastcgi_support_for_php_processing.htm )を参照。

**(HTTP構成ファイル /www/fastcgi/conf/fastcgi.conf)**

```
0001 Server type="application/x-httpd-python" CommandLine="/QOpenSys/usr/python-scripts/fastcgi.py" StartProcesses="1"
0002 IpcDir /www/fastcgi/logs
0003 IpcPublic *RWX
0004 Language LANG=C CCSID=1208
```

「fastcgi.conf」の設定内容を下表に示します。

|行|パラメーター|説明|推奨値|
|--|-----------|---|------|
|1|Server type|httpd.confファイルのAddTypeディレクティブ(例では26行目)で指定されたMIMEタイプと一致する必要あり||	
||CommandLine|PASEのFastCGIスクリプト名||
||StartProcesses|PASE FastCGIワーカーのジョブを監視/起動|"1"|
|2|IpcDir|FastCGIソケットファイルを作成するために使用するディレクトリー。指定されたディレクトリーはWebサーバーでファイルの読み取り/書き込み権限がある事	||
|3|IpcPublic|FastCGIのソケット権限ディレクティブ||
|4|LANG|デフォルト言語||
||CCSID|デフォルトのCCSID|819か1208|

?> 詳細はIBMのAPAR「SE45583 - HTTPSVR - FastCGI socket authorities directives support」(https://www.ibm.com/support/pages/apar/SE45583 )を参照。 

<br>

PythonスクリプトはWSGIの作法に合わせてコーディングする必要があります。以下は「Webサービス1/2」の機能を実装したPython WSGI(FastCGI)スクリプトです。

最初にWSGIサーバーを起動する必要があり、ソース末尾の「WSGIServer(app).run()」で関数「app」を起動しています。この例ではWSGIサーバーに「flup」パッケージを使用しているので、あらかじめpip3コマンドでインストールしておきます。

**(Python WSGIスクリプト /QOpenSys/usr/python-scripts/fastcgi.py)**

```python
0001 #!/QOpenSys/pkgs/bin/python
0002 
0003 from urllib.parse import parse_qs
0004 import json
0005 import pyodbc
0006 import pandas as pd
0007 
0008 JSON_String = ""
0009 JSON_Count = 0
0010 err = ""
0011 
0012 def exec_SQL(stmt):
0013     global JSON_String
0014     global JSON_Count
0015     global err
0016 
0017     conn = pyodbc.connect(
0018         'Driver={IBM i Access ODBC Driver}; '
0019         'System=localhost; '
0020         'UID=websxx; '
0021         'PWD=websxx; '
0022         )
0023     cursor = conn.cursor()
0024     try:
0025         df = pd.read_sql(stmt, conn)
0026         JSON_Count = len(df)
0027         if JSON_Count == 0:
0028             return 404
0029         else:
0030             df = df.astype({'REGNO': int, 'BIRTHD': int})
0031             JSON_String = \
0032                 df.applymap(lambda x: x.strip() \
0033                 if isinstance(x, str) \
0034                 else x).to_json(orient='records')
0035     except Exception as e:
0036         err = str(e)
0037         return 500
0038     finally:
0039         cursor.close()
0040         conn.close()
0041     return 200
0042 
0043 def app(environ, start_response):
0044     global JSON_String
0045     global JSON_Count
0046     global err
0047 
0048     reqMethod = environ.get('REQUEST_METHOD')
0049     qs_dict = parse_qs(environ.get('QUERY_STRING'))
0050     content_len = int(environ.get('CONTENT_LENGTH', 0))
0051 
0052     if reqMethod == "GET":
0053         in_regNo = qs_dict.get('regNo', [''])[0]
0054         sql_rc = exec_SQL( \
0055             "select * from websxxlib.person where REGNO=" + \
0056             str(in_regNo))
0057     elif reqMethod == "POST":
0058         body = environ.get('wsgi.input').read(content_len)
0059         req_JSON = json.loads(body.decode('utf-8'))
0060         in_kanaName = (req_JSON['kanaName'].encode('utf-16be')) \
0061                       .hex().encode('ascii')
0062         sql_rc = exec_SQL( \
0063             "select * from websxxlib.person where KNNAME like UX" \
0064             + str(in_kanaName)[1:][:-1] + "0025'")
0065     else:
0066         sql_rc = 405
0067 
0068     if sql_rc == 200:
0069         start_response('200 OK', [('Content-type', 'text/json')])
0070         if reqMethod == "GET":
0071             outStr = '{"single_rcd":' + JSON_String[1:][:-1] + '}'
0072             outStr = outStr.encode().decode('unicode-escape')
0073             return [outStr.encode('utf-8')]
0074         else:
0075             outStr = '{"rcd_cnt":' + str(JSON_Count) + \
0076                      ',"multi_rcds":' + JSON_String + '}'
0077             outStr = outStr.encode().decode('unicode-escape')
0078             return [outStr.encode('utf-8')]
0079     elif sql_rc == 404:
0080         start_response('404 Not found', \
0081                        [('Content-type', 'text/plain')])
0082         return '404 Not found.\r\n '
0083     elif sql_rc == 405:
0084         start_response('405 Method Not Allowed', \
0085                        [('Content-type', 'text/plain')])
0086         return '405 Method Not Allowed.\r\n '
0087     elif sql_rc == 500:
0088         start_response('500 Internal Server Error', \
0089                        [('Content-type', 'text/plain')])
0090         return '500 Internal Server Error.\r\n' + err
0091 
0092 if __name__ == '__main__':
0093     from flup.server.fcgi import WSGIServer
0094     WSGIServer(app).run()
```

* 3行目：WSGIではクエリ文字列を取得して処理するケースが多いので、cgiの代わりにparse_qsをインポート。
* 43行目：app関数の最初の引き数は環境変数、二番目の引き数はステータスコードとレスポンスヘッダーを受け取る呼び出し可能なオブジェクト。戻り値にはクライアントに返す文字列を指定。
* 52、57、65行目：要求されたHTTPメソッドによって「Webサービス1」、「Webサービス2」の検索処理を実行。
* 60～65行目：「Webサービス2」でSQLの検索文字列に半角カタカナを渡すと、PASE CGIと同じ方法ではUTF-8の16進表現となり、SQLが正常に実行されない。このため、「Unicode グラフィック・ストリング定数」(https://www.ibm.com/docs/ja/i/7.4?topic=constants-graphic-string )に変換。

![4.5_⑤_PASE_WSGI_Python1.jpg](/files/4.5_⑤_PASE_WSGI_Python1.jpg)

* 68、79、83、87行目：関数「exec_SQL」の戻り値に応じたif～elifブロック内で処理を実行。CGIとは異なり、start_response関数の第一パラメーターにHTTP状況を、第二パラメーターに応答ヘッダーを、関数appの戻り値に出力データを指定。

<br>

構成が完了し、IHSを起動したらcurlからリクエストを発行して動作を確認しましょう。

* HTTP200：正常終了
  * GET (Webサービス1)
```bash
bash-5.1$ curl -s http://ibmi:10580/python-script/personqry.py?regNo=234
{"single_rcd":{"REGNO":234,"KJNAME":"野沢　哲郎","KNNAME":"ﾉｻﾞﾜ ﾃﾂﾛｳ","GENDER":"M","TEL":"0777182259","MOBILE":"09024590852","POST":"604-8462","PREF":"京都府","ADDR1":"京都市中京区","ADDR2":"西ノ京北円町3-2-14","ADDR3":"西ノ京北円町アパート318","BIRTHD":19900505}}
```

  * POST (Webサービス2)
```bash
bash-5.1$ curl -s -X POST -H "Content-Type: application/json" -d '{"kanaName" : "ｻｲ"}' http://ibmi:10580/python-script/personqry.py 
{"rcd_cnt":2,"multi_rcds":[{"REGNO":556,"KJNAME":"斎藤　敦盛","KNNAME":"ｻｲﾄｳ ｱﾂﾓﾘ","GENDER":"X","TEL":"0563250431","MOBILE":"08064981798","POST":"441-2316","PREF":"愛知県","ADDR1":"北設楽郡設楽町","ADDR2":"荒尾2-15-12","ADDR3":"","BIRTHD":19501125},{"REGNO":429,"KJNAME":"斎藤　尚三","KNNAME":"ｻｲﾄｳ ｼｮｳｿﾞｳ","GENDER":"M","TEL":"0241243351","MOBILE":"09073642508","POST":"979-1451","PREF":"福島県","ADDR1":"双葉郡双葉町","ADDR2":"渋川4-13-16","ADDR3":"","BIRTHD":19850619}]}
```

* HTTP404：リソースが見つからない(検索対象データなし)
  * GET (Webサービス1)
```bash
bash-5.1$ curl -s -v http://ibmi:10580/python-script/personqry.py?regNo=12345
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
< HTTP/1.1 404 Not found
< Date: Wed, 19 Apr 2023 06:01:43 GMT
< Server: Apache
< Transfer-Encoding: chunked
< Content-Type: text/plain
<
404 Not found.
```
  * POST (Webサービス2)
```bash
bash-5.1$ curl -s -v -X POST -H "Content-Type: application/json" -d '{"kanaName" : "xx"}' http://ibmi:10580/python-script/personqry.py
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
< HTTP/1.1 404 Not found
< Date: Wed, 19 Apr 2023 06:03:23 GMT
< Server: Apache
< Transfer-Encoding: chunked
< Content-Type: text/plain
<
404 Not found.
```

* HTTP405：サポートされないHTTPメソッド

```bash
bash-5.1$ curl -s -v -X PUT http://ibmi:10580/python-script/personqry.py?regNo=123
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
* Mark bundle as not supporting multiuse
< HTTP/1.1 405 Method Not Allowed
< Date: Wed, 19 Apr 2023 06:04:36 GMT
< Server: Apache
< Transfer-Encoding: chunked
< Content-Type: text/plain
<
405 Method Not Allowed.
* Connection #0 to host ibmi left intact
```

* HTTP500：内部エラー

```bash
bash-5.1$ curl -s -v http://ibmi:10580/python-script/personqry.py?regNo=xxxx
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
* Mark bundle as not supporting multiuse
< HTTP/1.1 500 Internal Server Error
< Date: Wed, 19 Apr 2023 06:18:26 GMT
< Server: Apache
< Connection: close
< Transfer-Encoding: chunked
< Content-Type: text/plain
<
500 Internal Server Error.
* Closing connection 0
Execution failed on sql 'select * from websxxlib.person where REGNO=xxxx': ('42S22', '[42S22] [IBM][System i Access ODBC Driver][DB2 for i5/OS]SQL0206 - \x0e\x1af\x1a[\x1aw\x1au\x1aj\x1a\x1a\x1aB\x1a\x1a\x1a\x1a\x1a\x1a\x1a\x1a\x1a?\x1a\x1a\x0fXXXX\x0e\x1a{\x1a\x1a\x1al\x1af\x1a\x1a\x1au\x1a\x1a\x1a]\x1a\x1a\x1a\x1a\x1aj\x1a\x1a\x0f (-206) (SQLExecDirectW)')bash-5.1$
```

<font size="-2">
※ ODBCドライバーから返るエラーメッセージの漢字部分が変換エラーで文字化けするため、前後の情報からエラーを確認。
</font>

<p>　</p>

SGIはその作法に則ったコーディングが必要で、デバッグの手順がCGIと異なり、文字のエンコードもPython CGIと異なる動作をします。FastCGIと組み合わせた構成のメリットの一つであるパフォーマンスも、利用した範囲では通常のPython CGIから劇的に向上する訳ではありません。

PythonによるWebサービスを実装する場合、CGIやWSGIで個別に開発するより、Python用のWebフレームワークを探す方が効果的かもしれません。Django、Flask、Pyramid、Tornado、FastAPI、Zope、Bottleなど、多くのWebフレームワークがあるので、要件やIBM iでの稼働可否によって選択できるでしょう。

<br>

## 4.6 ⑥ Node.js＋Express

Node.jsは非同期・イベント駆動のJavaScript実行環境です。その特性からスケーラブルなネットワークアプリケーションを構築するためにサーバー・サイドで主として利用されています。下記に主な特徴をあげます。

* メリット
  * ノンブロッキングI/Oモデルを採用しており、大量のリクエストに対応可能

  ?> いわゆる「C10K(クライアント1万台)問題」が回避可能とされている。ただし、ODBC接続などサーバー側にクライアント毎のプロセス(ジョブ)を必要とする処理では個別の対応が必要であろう。

  * シングルスレッドで動作しており、システムリソースの消費が非常に少ない
  * Webブラウザでも動作するJavaScript言語で開発するため馴染みやすい

* デメリット
  * シングルスレッドで動作するため、特定の処理の遅延やエラーがサービス全体を滞留・停止させる
  * 非同期モデルの理解が困難。非同期関数、コールバック、Promise、async/awaitなど、非同期処理を扱う手法が複数あり、要件によって選択が必要

<br>

Node.jsの初版は2009年と若い言語環境ですが、2015年以降はほぼ半年に一度の頻度で新バージョンが発表されています。また、各リリースは「Current」(最新版) ⇒「Active LTS」(安定版) ⇒「Maintenance」(保守版)と移行し、寿命はおおよそ2～3年です。

?> リリース頻度のは詳細は「Node.js Release Working Group」(https://github.com/nodejs/release )を参照。

![4.6_⑥_Node.js＋Express.jpg](/files/4.6_⑥_Node.js＋Express.jpg)

<br>

以下の例では、下図のようにIHSではなく「Express」Webアプリケーション・フレームワークがHTTPサーバー機能を担います。IBM iに関連するのはODBCドライバーのみなので、各種LinuxやWindowsなど、Node.jsとODBCドライバーが動作する環境であればほぼそのまま利用できるでしょう。
<br>

![4.6_⑥_Node.js＋Express1.jpg](/files/4.6_⑥_Node.js＋Express1.jpg)

<br>

他のWebサービス・サーバー実装例と異なり、この構成ではNode.jsのスクリプトを起動してWebサービスを開始します。例えば下図のように、PASEシェル(sshなど)からシェルスクリプトを起動、あるいは、CLからQshellでスクリプトを起動します。

![4.6_⑥_Node.js＋Express2.jpg](/files/4.6_⑥_Node.js＋Express2.jpg)


|スクリプト/ファイル|記述|
|-----------------|----|
|startREST.sh|シェルスクリプト(Node.jsスクリプトを起動)|
|personQry.js|Node.jsスクリプト(Webサービス・サーバー)|
|personQry.log|実行状況のログ|

<br>

Webサービスを実装したNode.jsスクリプト「personQry.js」のリストを掲載します。

**(Node.jsスクリプト /home/websxx/personQry.js)**

```js
0001 const express = require('express');
0002 const path = require('path');
0003 
0004 const app = express();
0005 app.use(express.static(path.join(__dirname, '/public')));
0006 app.use(express.json());
0007 app.use(express.urlencoded({ extended: true }));
0008 const port = process.env.PORT || 10480;
0009 app.listen(port, () => {console.log(`\nポート${port}でLISTEN開始。`)});
0010 
0011 const odbc = require("odbc");
0012 
0013 app.use('/', (req, res, next) => {
0014     switch(req.method) {
0015         case 'GET':
0016             break
0017         case 'POST':
0018             break
0019         default:
0020             console.log(req.ip + 'から非サポートの' + req.method + 'メソッド要求。');
0021             res.status(405).send('405 Method Not Allowed.')
0022     }
0023     next()
0024 });
0025 
0026 app.get('/', (req, res) => {
0027     console.log('「/」へのGET要求。')
0028     res.sendFile(path.join(__dirname + '/index_rest.html'));
0029 });
0030 
0031 app.get('/api/v1/person/:regNo', (req, res) => {
0032     console.log(req.ip + 'から「/api/v1/person」へのGET要求。');
0033     odbc.connect('DSN=*LOCAL;CCSID=1208;', (err, conn) => {
0034         if (err) { throw err; }
0035         let stmt = "SELECT * FROM WEBSXXLIB.PERSON WHERE REGNO = " +
0036                    req.params.regNo;
0037         console.log(stmt);
0038         conn.query(stmt, (err, result) => {
0039             if (err) {
0040                 res.status(500).
0041                     send('500 Internal Server Error.<br><br>' + err)
0042             } else {
0043                 if (result.length == 0) {
0044                     res.status(404).send('404 Not found.');
0045                 } else {
0046                     console.log(result.length + "件が検索された。");
0047                     res.send('{"single_rcd":' +
0048                              JSON.stringify(result, trimStrings).
0049                              substring(1).slice(0, -1) + '}');
0050                 }
0051                 conn.close((err) => {
0052                     if (err) { throw err; }
0053                 })
0054             }
0055         })
0056     })
0057 });
0058 
0059 app.post('/api/v1/persons', (req, res) => {
0060     console.log(req.ip + 'から「/api/v1/persons」へのPOST要求。');
0061     console.log(req.body);
0062     odbc.connect('DSN=*LOCAL;CCSID=1208;', (err, conn) => {
0063         if (err) { throw err; }
0064         let stmt = "SELECT * FROM WEBSXXLIB.PERSON WHERE KNNAME LIKE '" +
0065                    req.body.kanaName + "%'";
0066         console.log(stmt);
0067         conn.query(stmt, (err, result) => {
0068             if (err) {
0069                 res.status(500).
0070                     send('500 Internal Server Error.<br><br>' + err)
0071             } else {
0072                 if (result.length == 0) {
0073                     res.status(404).send('404 Not found.');
0074                 } else {
0075                     console.log(result.length + "件が検索された。");
0076                     res.send('{"rcd_cnt":' + result.length.toString() + 
0077                              ',"multi_rcds":' + 
0078                              JSON.stringify(result, trimStrings) + '}');
0079                 }
0080                 conn.close((err) => {
0081                     if (err) { throw err; }
0082                 })
0083             }
0084         })
0085     })
0086 });
0087 
0088 function trimStrings(key, value) {
0089     if (typeof value === 'string') {
0090       return value.trimEnd();
0091     }
0092     return value;
0093 }
```

* 1行目：WebフレームワークのExpressを使用するので、requireでExpressモジュールを読み込み。
* 13行目：「app.use()」は指定したパスに対する共通の処理を記述。ここではHTTPのリクエスト・メソッドのチェックを行なう。
* 26行目：「app.get」でルート(「/」)へのget要求があった場合の処理を記述。ここでは、現在実行中のソースコードが格納されているディレクトリーパス(__dirname)に存在する「/index_rest.html」をクライアントに送る。
* 31行目：「Webサービス1」の実装で、「/api/v1/person/:regNo」へのGET要求を処理。他の実装例と異なり、「:regNo」はURLの一部で、指定した部分をreq.params.regNoで取り出す。
* 33行目：Node.jsのODBCモジュールでIBM i のDBに接続する場合、接続文字列に「CCSID=1208;」を指定しないと文字化けが発生。
* 39～50行目：SQLの実行結果を判定し、HTTPレスポンスを構成するためのオブジェクトである「res」で応答を返す。
* 59行目： URLに「/api/v1/persons」を指定したPOSTメソッドが要求された時に「Webサービス2」を実行。
* 64～65行目：クライアントからのHTTPリクエストを含む「req」オブジェクトから「req.body.kanaName」で検索文字列を取得。この値を使用してSQLを実行し、応答を返す。

<br>

スクリプトの実行前に、sshセッションで下記を確認します。

* 現行ディレクトリーがホームディレクトリである ⇒ pwdを実行して「/home/WEBSXX」と表示される)
* express、odbcが利用可能 ⇒ npm listを実行してこれらがリストされる
* スクリプト「personQry.js」が現行ディレクトリーに存在する ⇒ ls -la *.jsを実行してpersonQry.jsが表示される

<br>

確認で問題が無ければ「node personQry」でスクリプトを起動します。エラーがなければ「ポート10480でLISTEN開始。」と表示され、クライアントからのリクエスト待ちになります。別のsshセッションを起動し、curlコマンドでWebサービスの動作を確認します。

* HTTP200：正常終了
  * GET (Webサービス1)
```bash
bash-5.1$ curl -s http://ibmi:10480/api/v1/person/134
{"single_rcd":{"REGNO":134,"KJNAME":"北尾　照夫","KNNAME":"ｷﾀｵ ﾃﾙｵ","GENDER":"X","TEL":"0740258850","MOBILE":"09036968467","POST":"520-1111","PREF":"滋賀県","ADDR1":"高島市","ADDR2":"鴨3-2-4","ADDR3":"ハイツ鴨403","BIRTHD":19521117}}
```

  * POST (Webサービス2)
```bash
bash-5.1$ curl -s -X POST -H "Content-Type: application/json" -d '{"kanaName" : "ﾀｲ"}' http://ibmi:10480/api/v1/persons 
{"rcd_cnt":3,"multi_rcds":[{"REGNO":616,"KJNAME":"平　邦夫","KNNAME":"ﾀｲﾗ ｸﾆｵ","GENDER":"M","TEL":"0280153747","MOBILE":"","POST":"321-0226","PREF":"栃木県","ADDR1":"下都賀郡壬生町","ADDR2":"中央町2-15","ADDR3":"中央町ランド419","BIRTHD":19771231},{"REGNO":953,"KJNAME":"平　正記","KNNAME":"ﾀｲﾗ ﾏｻｷ","GENDER":"X","TEL":"0969746661","MOBILE":"09068097951","POST":"861-3515","PREF":"熊本県","ADDR1":"上益城郡山都町","ADDR2":"城平4-10","ADDR3":"","BIRTHD":19550410},{"REGNO":628,"KJNAME":"平　優志","KNNAME":"ﾀｲﾗ ﾕｳｼ","GENDER":"M","TEL":"0531058523","MOBILE":"09029188110","POST":"490-1141","PREF":"愛知県","ADDR1":"海部郡大治町","ADDR2":"馬島1-10","ADDR3":"","BIRTHD":19980206}]} 
```

この時にNodeスクリプトの起動側sshセッションには下記のように表示されます。

```bash
bash-5.1$ node personQry

ポート10480でLISTEN開始。
::ffff:10.x.xxx.xxから「/api/v1/person」へのGET要求。
SELECT * FROM WEBSXXLIB.PERSON WHERE REGNO = 134
1件が検索された。
::ffff:10.x.xxx.xxから「/api/v1/persons」へのPOST要求。
{ kanaName: 'ﾀｲ' }
SELECT * FROM WEBSXXLIB.PERSON WHERE KNNAME LIKE 'ﾀｲ%'
3件が検索された。
```

* HTTP404：リソースが見つからない(検索対象データなし)
  * GET (Webサービス1)
```bash
bash-5.1$ curl -s -v http://ibmi:10480/api/v1/person/13467
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
< HTTP/1.1 404 Not Found
< X-Powered-By: Express
～～～～～～～～～～～～～～～ 後略 ～～～～～～～～～～～～～～～～～
```

  * POST (Webサービス2)
```bash
bash-5.1$ curl -s -v -X POST -H "Content-Type: application/json" -d '{"kanaName" : "xx"}' http://ibmi:10480/api/v1/persons
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
< HTTP/1.1 404 Not Found
< X-Powered-By: Express
～～～～～～～～～～～～～～～ 後略 ～～～～～～～～～～～～～～～～～
```

* HTTP405：サポートされないHTTPメソッド

```bash
bash-5.1$ curl -s -v -X PUT http://ibmi:10480/api/v1/person/123
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
* Mark bundle as not supporting multiuse
< HTTP/1.1 405 Method Not Allowed
< X-Powered-By: Express
～～～～～～～～～～～～～～～ 後略 ～～～～～～～～～～～～～～～～～
```

* HTTP500：内部エラー

```bash
bash-5.1$ curl -s -v http://ibmi:10480/api/v1/person/xxxx
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
* Mark bundle as not supporting multiuse
< HTTP/1.1 500 Internal Server Error
< X-Powered-By: Express
< Content-Type: text/html; charset=utf-8
～～～～～～～～～～～～～～～ 中略 ～～～～～～～～～～～～～～～～～
* Connection #0 to host ibmi left intact
500 Internal Server Error.<br><br>Error: [odbc] Error executing the sql statementbash-5.1$
```

<br>

Ctrl+Cを押してスクリプトを終了 します。 

<br>

### (参考) Node.js実行環境の設定

2023年4月現在、IBM iではNode.jsのバージョン8から18が利用可能です。例で使用するODBCパッケージ(https://www.npmjs.com/package/odbc )がサポートしているNode.jsの最新バージョンが16なので、これを使用します。

デフォルトのNode.jsバージョンはalternativesコマンドで確認・変更します。

?> 権限の低いユーザーで変更を試みると「update-alternatives: error: unable to remove '/QOpenSys/etc/alternatives/node.dpkg-tmp': 指定されたアクションにはファイルのアクセス権がありません。」とエラーになるので、変更する場合は高権限ユーザーで実行。

```bash
bash-5.1$ alternatives --config node
There are 6 choices for the alternative node (providing /QOpenSys/pkgs/bin/node).

  Selection    Path                                  Priority   Status
------------------------------------------------------------
  0            /QOpenSys/pkgs/lib/nodejs18/bin/node   18        auto mode
  1            /QOpenSys/pkgs/lib/nodejs10/bin/node   10        manual mode
  2            /QOpenSys/pkgs/lib/nodejs12/bin/node   12        manual mode
  3            /QOpenSys/pkgs/lib/nodejs14/bin/node   14        manual mode
* 4            /QOpenSys/pkgs/lib/nodejs16/bin/node   16        manual mode
  5            /QOpenSys/pkgs/lib/nodejs18/bin/node   18        manual mode
  6            /QOpenSys/pkgs/lib/nodejs8/bin/node    8         manual mode

Press <enter> to keep the current choice[*], or type selection number:
```

<br>

Node.jsスクリプトで使用するパッケージをnpmコマンドでインストールします。nodeとnpmのバージョン、そしてインストール済みのパッケージを確認します。

?> npmは「Node Package Manager」の略でJavaScript系のパッケージ管理ツール。

```bash
bash-5.1$ node -v
v16.19.1
bash-5.1$ npm -v
8.19.3
bash-5.1$ npm list
websxx@1.0.0 /home/WEBSXX
└── (empty) 

bash-5.1$
```

「npm list」の出力でパッケージが空であれば、インストール前に「npm init」でプロジェクトを初期化してカレントディレクトリにpackage.jsonを作成します。

```bash
bash-5.1$ npm init -y
Wrote to /home/WEBSXX/package.json:

{
  "name": "websxx",
  "version": "1.0.0",
  "main": "personQry.js",
～～～～～～～～～～～～～～～ 後略 ～～～～～～～～～～～～～～～～～
```

今回使用するexpressとodbcパッケージをインストールし、「npm list」で確認します。

?> オプションの「--save-dev」はローカル・インストールの指定で、パッケージが「./node_module」フォルダにインストールされる。同時にカレントディレクトリーのファイル「package.json」内のdevDependenciesにインストールしたパッケージが記録され、他の環境にインストール(npm install)する際に参照可能。

```bash
bash-5.1$ npm install -save-dev express odbc

added 118 packages, and audited 119 packages in 7s

10 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
bash-5.1$ npm list
websxx@1.0.0 /home/WEBSXX
├── express@4.18.2
└── odbc@2.4.7
```

<br>

下記は動作確認用のサンプル・スクリプト「testPackage.js」です。sshセッションで「node testPackage」を実行し、例えばWebブラウザから「http://ibmi:10480/(登録番号) 」にアクセスするとsshのセッションに要求が表示され、Webブラウザに結果が表示されます。スクリプトはsshでCtrl+Cを押して終了させます。

```js
0001 const express = require('express');
0002 const app = express();
0003 app.use(express.json());
0004 const port = process.env.PORT || 10480;
0005 app.listen(port, () => {console.log(`\nポート${port}でLISTEN開始。`)});
0006 
0007 const odbc = require("odbc");
0008 
0009 app.get('/favicon.ico', function(req, res) {   ← 不要なリクエストを無視
0010     res.status(204);
0011     res.end();    
0012 });
0013 
0014 app.get('/:regNo', (req, res) => {
0015     console.log(req.ip + 'から"' + req.params.regNo + '"の検索要求。');
0016     odbc.connect('DSN=*LOCAL;CCSID=1208;', (err, conn) => {
0017         let stmt = "SELECT * FROM WEBSXXLIB.PERSON WHERE REGNO = " + req.params.regNo;
0018         conn.query(stmt, (err, result) => {
0019             if (err) {
0020                 res.status(500).send('検索エラー。');
0021             } else {
0022                 if (result.length == 0) {
0023                     res.status(404).send('データなし。');
0024                 } else {
0025                     res.send(JSON.stringify(result));
0026             }}
0027             conn.close((err) => {
0028                 if (err) { throw err; }
0029             })
0030         })
0031     })
0032 });
```
