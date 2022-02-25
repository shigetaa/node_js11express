# コンフィギュレーションとエラー処理

## 起動スクリプトを変更する
起動スクリプトを操作するには、`package.json`ファイルの中にある「scripts」プロパティをさがします。
そこには「test」スクリプトのプレースホルダがあり、そのテストスクリプトの末尾にコマンドを加え、次の行に `"start": "node main.js"` を追加します。

このスクリプトがあれば、`npm start` の実行で、アプリケーションが起動されるようになります。

こうしてメインアプリケーションファイルの名前を抽象化すれば、それを知っている必要がなくなるわけです。`package.json`ファイルは以下の様に記述します。

```json
"scripts": {
	"test": "echo \"Error: no test specified\" && exit 1",
	"start": "node main.js"
},
```

`script` オブジェクトの中で`start`と言うキーを使えば、アプリケーションは、`npm start` でも、`npm run start` でも、`npm run-script start` でも起動出来るようになります。

## Express.js でエラーを処理する
Express.js によって、開発プロセスが大いに改善されました。特に嬉しいのは、経路が存在しないパスに対するリクエストが来ても、アプリケーションが永久にハングしたりしないことです。
けれども、たとえばホームページに対するリクエストが来た時、そのリクエストを処理する経路がなかったら、「Cannot GET /」という、そっけないメッセージがブラウザに出てしまいます。

Express.js でエラー処理を行うには、いくつかのアプローチがあります。
1つ目はコンソールにログを出力するというほうほうです。
ただし通常のHTMLページを送信するのとは別の処理なので、新しいコントローラを作り、`http-status-codes` をインストールするのが良いでしょう、ちなみにインストール方法は以下のコマンドでインストールします。
```bash
npm i http-status-codes
```
次に、`controllers`フォルダに `errorController.js` を作成し下記のコードを記述します。
この関数は、通常のミドルウェア関数よりも、引数を１つ多く含んでいます。
もしリクエストとレスポンスのサイクルでエラーが発生したら、それは最初の引数にあらわれます。
`console.log` と似た `console.error` は `error` オブジェクトの`stack` を適切にロギングしてくれるので、何がうまくいかなかったのかわかるでしょう。

```javascript
exports.logErrors = (error, req, res, next) => {
	console.error(error.stack);
	next(error);
};
```
次に、このミドルウェア関数を使う事をExpress.jsに知らせるために、`main.js` ファイルで `require` によって `errorController.js` をロードした上で、`app.use(errorController.logErrors)` を追加します。

次に、エラー内容を出力する関数と、エラーステータスコードをレスポンスに返す処理を`errorController.js`に追記していきます。
```javascript
const httpStatus = require("http-status-codes");

exports.logErrors = (error, req, res, next) => {
	console.error(error.stack);
	next(error);
};

exports.respondNoResourceFound = (req, res) => {
	let errorCode = httpStatus.NOT_FOUND;
	res.status(errorCode);
	res.send(`${errorCode} | The page does not exist!`);
};

exports.respondInternalError = (error, req, res, next) => {
	let errorCode = httpStatus.INTERNAL_SERVER_ERROR;
	console.log(`ERROR occurred: ${errorCode}`);
	res.status(errorCode);
	res.send(`${errorCode} | Sorry, our application is experiencing a problem!`);
};
```
次に、このミドルウェア関数を使う事をExpress.jsに知らせるために、`main.js` ファイルで下記のコードを追記します。
```javascript
app.use(errorController.respondNoResourceFound);
app.use(errorController.respondInternalError);
```
エラーページをカスタマイズしたい場合は、先ほど作成した`respondNoResourceFound`関数を下記の様に改良します。
```javascript
exports.respondNoResourceFound = (req, res) => {
	let errorCode = httpStatus.NOT_FOUND;
	res.status(errorCode);
	//res.send(`${errorCode} | The page does not exist!`);
	res.sendFile(`./public/errors/${errorCode}.html`, {
		root: "./"
	});
};
```
エラーページ管理用フォルダとして`public/errors`フォルダを作ります。
```bash
mkdir public
mkdir public/errors
```
作成したフォルダの中にエラーページ`404.html` と `500.html` ページを下記の様に作成します。
`public/errors/404.html`
```html
<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Not Found</title>
</head>

<body>
	<h1>Not Found</h1>
</body>

</html>
```
`public/errors/500.html`
```html
<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Internal Error</title>
</head>

<body>
	<h1>Internal Error</h1>
</body>

</html>
```
これで、エラー時にエラーページの内容が表示されるはずですので、アプリケーション実行して動作を確認してみましょう。
```bash
node main.js
```
```bash
server start http://localhost:3000/
```
今回経路URLを追加した /main/xxx をWebブラウザで http://localhost:3000/xxx にアクセスしてみて**Not Found**が表示されるか確認してみてください。

## 静的ファイルを供給する
アプリケーションで、各種の静的ファイルやアセットを供給するとしたら、何百行ものコードが必要になりそうですが、Express.jsを使えば、それらの種類のファイルの面倒を自動的に見てもらえます。
必要なのは、それらの静的ファイルをどこでみつければいいのかをExpress.jsにしらせるだけです。

静的ファイルの供給をExpress.js で実行するには、static メソッドを使う必要があります。
このメソッドは、静的ファイルを含むフォルダへの絶対パスを受け取ります。
他のミドルウェア関数の場合と同じく、この機能を使うことをExpress.jsの `app` インスタンスに知らせる必要があります。
静的ファイルの供給を有効にするには、`main.js` に `app.use(express.static("public"))` を追加します。

この1行のコードによって、アプリケーションは `main.js` と同じ階層の `public` フォルダを使って、静的ファイルを供給する様になります。

動作確認の為に、先ほど作ったエラーページが `public/errors/404.html` に保存しているので、ブラウザで　http://localhost:3000/errors/404.html にアクセスしてエラーページが表示されれば静的ページの供給ができてます。
