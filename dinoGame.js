/* canvasでの画像表示は、
 ユーザーの手元で画像がローディングされていることが前提
　JavaScriptでimgタグをJavaScript上でバーチャルに作る
　それで、画像の読み込みを検知できる状態
　画像の読み込みが終わったらonloadで呼ばれるので、
　そこで画像の表示をするということです
*/
// HTML の ID属性に canvas が設定されているタグを取得
const canvas = document.getElementById('canvas');
// 2D 描画用のオブジェクト(コンテキスト：context を呼び出し
const ctx = canvas.getContext('2d');
// 敵キャラクター3人を配列で準備した
const imageNames = ['bird', 'cactus', 'dino'];

// どこでも使えるグローバルな game オブジェクト
const game = {
    counter: 0, // counter：ゲーム開始から何フレーム目かを数えておくための数値
    backGrounds: [], // 地面が動くアニメーション
    bgm1: new Audio('bgm/fieldSong.mp3'),// BGMフィールド
    bgm2: new Audio('bgm/jump.mp3'),// BGMジャンプ
    enemys: [], // 敵キャラクター（複数形のスペルは無視）
    enemyCountdown: 0,　// 敵キャラクター出現までのカウントダウン
    image: {}, //  ゲームに使用するイメージデータを入れておくオブジェクト
    // isGameOver: true, // ゲーム中かどうかを判断する真偽値
    /* 音楽の mp3 ファイルを読み込んだので、ブラウザの仕様により、
    即座に BGM の再生出来ない。
    クリックだったりキーボード入力などの操作後でしか再生させるになる
    */
    // 最初は、画像などをローディングするということで 
    // state 変数には 'loading' を設定しています。
    state: 'loading',

    score: 0, // ゲームの特典を数える数値
    timer: null // ゲームのフレーム切り替えを管理するタイマー
};
// BGM1をループさせる
game.bgm1.loop = true;

// 画像の読み込みのテクニック複数画像読み込み
let imageLoadCounter = 0;
// 指定された配列の中身を取り出しながら、繰り返し処理を行なう構文
for (const imageName of imageNames) {
    // 画像のimgフォルダだけのパスを指定する
    const imagePath = `image/${imageName}.png`;
    // ['bird', 'cactus', 'dino']の各imageオブジェクト作成
    //  game.image.imageNameにすると変数名が展開できない 
    // オブジェクトのプロジェクトのポイント変数名を展開してキーにするため[カギカッコ]
    game.image[imageName] = new Image();
    // ['bird', 'cactus', 'dino']をsrcをimageのpathにしている
    game.image[imageName].src = imagePath;
    // 無名関数実行ですべての画像を呼び込むまで
    game.image[imageName].onload = () => {
        imageLoadCounter += 1;
        // 画像の配列の長さになるまで
        if (imageLoadCounter === imageNames.length) {
            console.log('画像のロードが完了しました。');
            // init初期化関数
            init();
        }
    }
}
// 初期化したいタイミングで初期化できる
// initを書き換えれば変更が容易になる
// ＞＞初期化処理を init という関数にまとめる

/*
init() 関数でゲームの初期画面を作成し、
スペースキーを押すことげゲームを開始するようにします。
そうすることで、ゲーム開始と同時に BGM を再生する。
*/
function init() {
    // インデントでスペース同じすると見やすい
    game.counter    = 0;
    game.enemys     = [];
    game.enemyCountdown = 0;　//  0 に初期化
    // game.isGameOver = false;
    game.score      = 0;
    game.state      = 'init';
    // 画面クリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 恐竜の表示

    /*                              X軸,Y軸
    ctx.drawImage(game.image.bird, 500, 320);
    ctx.drawImage(game.image.cactus, 300, 320);
    ctx.drawImage(game.image.dino, 100, 320);
    */
    //恐竜用のオブジェクトを後から作る
    createDino();
    drawDino();
    // 背景の描画
    createBackGround();
    drawBackGrounds();
    // 文章の表示
    ctx.fillStyle = 'black';
    ctx.font = 'bold 60px serif';
    ctx.fillText(`スペースキーを押すと`, 60, 150);
    ctx.fillText(`スタートする`, 150, 230);
    // setIntervalでticker関数を30ミリ秒ごとに実行する（1秒33回fps）
    // game.timer = setInterval(ticker, 30); 音楽を即鳴らすため
}
// init() 関数は初期化と初期画面の作成用の関数
// play() 関数を実行して BGM を再生
function start() {
    game.state = 'gaming';
    game.bgm1.play();
    game.timer = setInterval(ticker, 30);
}

/*
【ticker関数】パラパラ漫画でアニメーションをしているのがticker関数
tick＞英語圏での時計はチックタックが
tick は瞬間（プログラミングにおける時間の最小単位）という意味
それからticker関数になる
*/
function ticker() {
    // 画面すべてクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景の作成
    if (game.counter % 10 === 0) {
        createBackGround();
    }
    // 敵キャラクターの生成
    /*
    Math.floor(Math.random()*100
    整数で0から99の数値をランダムで生成する
    のが「0」のときサボテン
    鳥は0から199の数値で、0のとき＞出現確立が低い
    ＞＞ticker関数が1秒で33回実行されるので3秒に1回は出現する
    ＞＞＞無限に続くマップを作るのは大変だけどランダムなら簡易ってこと
        
    // if(Math.floor(Math.random() * 100) === 0) {
    // ゲームスコアが増えるとエンカウントする確率があがる
    if(Math.floor(Math.random() * (100 - game.score / 100)) === 0) {    
        createCactus();
    }
    // if(Math.floor(Math.random() * 200) === 0) {
    if(Math.floor(Math.random() * (200 - game.score / 100)) === 0) {
        createBird();
    }
    */
    createEnemys();　// 敵キャラクターの作成もまとめ
    // キャラクターの移動
    moveDino(); // 恐竜の移動
    moveEnemys(); // 敵キャラクターの移動
    moveBackGrounds(); // 背景の移動

    //描画
    drawBackGrounds(); // 背景の描画
    drawDino(); // 恐竜の描画
    drawEnemys(); // 敵キャラクターの描画
    drawScore(); // スコアの描画

    // あたり判定
    hitCheck();

    // フレーム数＝カウンターの更新＞1秒に33回fps
    // 大きなりすぎるとメモリ無駄、整数の最大値になるので
    // 1万を超えたら「0」に戻す書き方
    game.score += 1; // スコアに加算得点 ＋1
    game.counter = (game.counter + 1) % 10000;
    game.enemyCountdown -= 1; // 1 ずつ減らす
}

// 背景オブジェクトを作成する関数
function createBackGround() {
    game.backGrounds = [];
    for (let x = 0; x <= canvas.width; x+=200) {
        game.backGrounds.push({
            x: x,
            y: canvas.height,
            width: 200,
            moveX: -20,
        });
    }
}

// 背景移動用の関数
function moveBackGrounds() {
    for (const backGround of game.backGrounds) {
        backGround.x += backGround.moveX;
    }
}

// 背景の描画用の関数
// 背景のアニメーションは作成できますが、 他の文字も茶色になる
function drawBackGrounds(){
    ctx.fillStyle = 'sienna';
    for (const backGround of game.backGrounds) {
        ctx.fillRect(backGround.x, backGround.y - 5, backGround.width, 5);
        ctx.fillRect(backGround.x+20, backGround.y - 10, backGround.width - 40, 5);
        ctx.fillRect(backGround.x+50, backGround.y - 15, backGround.width - 100, 5);
    }
}

/*
 関数はどこに書いて実行されるのは、呼び出しされるタイミグなので大丈夫
*/

 // moveDino()恐竜が動くようなパラメータに変更した＞恐竜を移動させる
function moveDino() {
    // 初期値は「Y-41座標に」に加算するので恐竜がジャンプしている
    game.dino.y += game.dino.moveY;
    // moveYが加算し続けると地面を貫通することになる
    // 恐竜のY座標がcanvasの外,地面のいる状態＞＞中心座標で地面から画像の半分だけ上
    if (game.dino.y >= canvas.height - game.dino.height / 2) {
        // なので1番下にきたら、Y地面で止まるし
        game.dino.y = canvas.height - game.dino.height / 2;
        // 移動速度は0するので地面に居続けるように見えるってこと
        game.dino.moveY = 0;
    } else {
        // ジャンプ頂点から＋3ごと加算して着地して重力ジャンプを表現
        game.dino.moveY += 3;
    }
}

// 各敵キャラクターを速度分だけ横に移動させる
function moveEnemys() {
    // 配列の敵から敵を1匹づつ取り出す＞＞「of」
    for (const enemy of game.enemys) {
        // enemyオブジェクトをX座標に移動速度分だけ移動させる
        enemy.x += enemy.moveX;
    }
    /* 画面の外に出たキャラクターを配列から削除
       mapとfilterは大事（コメ）
       filterで配列の条件にあったものを残す処理
       ＞敵がX座標から横幅がみ出してなければOKってこと、
       画面内にいる敵だけ残す
       ちなみに、-マイナスenemyするのは、0だと敵の中心の幅が残ってしまう
    */
    game.enemys = game.enemys.filter(enemy => enemy.x > -enemy.width);
}
/*
game.enemyCountdown のカウントダウンが 0　敵キャラクターを作成した。
そして、カウントダウンを 60 に戻します。
スコアによってゲームの難易度が変わるように、 
100点事にカウントダウンが 1 ずつ少なくなるようにしていますが、 
ある一定値（30）よりは少なくならないようにしてみています。
敵キャラクターの作成ですが、ランダムな値（乱数）を使って 3 パターン用意

1 つ目（case 0 の時）は、サボテンが 1 つ出現する。
2 つ目（case 1 の時）は、サボテンが 2 つ出現する。
3 つ目（case 2 の時）は、鳥が 1 つ出現する。
*/
function createEnemys() {
    if (game.enemyCountdown === 0) {
        game.enemyCountdown = 60 - Math.floor(game.score / 100);
        if(game.enemyCountdown <= 30) game.enemyCountdown = 30;
        switch(Math.floor(Math.random() * 3)) {
            case 0:
                createCactus(canvas.width + game.image.cactus.width / 2);
                break;
            case 1:
                createCactus(canvas.width + game.image.cactus.width / 2);
                createCactus(canvas.width + game.image.cactus.width * 3 / 2);
                break;
            case 2:
                createBird();
                break;
        }
    }
}

// スコア表示
function drawScore() {
    ctx.fillStyle = 'black';　// フォントの色設定
    ctx.font = '24px serif';　// 24ピクセルのフォント設定
    // ctx.fillText(文章, x, y); は文章を表示させる
    ctx.fillText(`点数: ${game.score}`, 0, 30);
}

// 各敵キャラクターを速度分だけ横に移動
// 敵キャラクターは配列にpushというかたちにした、敵がいるだけ配列に加算
// 追加するか再描画するかの違い（コメ）
// function createCactus() {
    // サボテンを作る際に、出現する x座標 を指定できるように createCactus() 関数
   function createCactus(createX) { //
    game.enemys.push({
        // X：画面端っこ、キャンバス横幅 + サボテン横幅 / 2 
        // x: canvas.width + game.image.cactus.width / 2,
        // 地面についている
        x: createX, // x座標 を引数に取る
        y: canvas.height - game.image.cactus.height / 2,
        width: game.image.cactus.width,
        height: game.image.cactus.height,
        // 移動速度左に10の速さで動く
        moveX: -10,
        image: game.image.cactus
    });
}

function createBird() {
    // 鳥は地面の150以上の高さでランダムの高さで飛ぶ
    const birdY = Math.random() * (300 - game.image.bird.height) + 150;
    game.enemys.push({
        x: canvas.width + game.image.bird.width / 2,
        y: birdY,
        width: game.image.bird.width,
        height: game.image.bird.height,
        moveX: -15,
        image: game.image.bird
    });
}

/*
drawDinoはパラメータを基に描画しているだけ
この2つをticker関数内で両方一気に実行して、組み合わせで動くようになってる
移動してんじゃなくて場所を変えて描画しなおしている
*/
function drawDino() {
    // 考え方としては、中心でなく左上にしたいため
    // 画像x座標-横幅/2、画像Y座標-高さ/2
    ctx.drawImage(game.image.dino, game.dino.x - game.dino.width / 2, game.dino.y - game.dino.height / 2);
}

// 各敵キャラクターを描画する
function drawEnemys() {
    // 同じく配列でofで敵を取り出す
    for (const enemy of game.enemys) {
        ctx.drawImage(enemy.image, enemy.x - enemy.width / 2, enemy.y - enemy.height / 2);
    }
}

// 恐竜の初期値＞＞場所・速度・大きさ。画像、
function createDino() {
    game.dino = {
        // オブジェクトで、左のx(プロパティ名)：右が値
        // x：恐竜の位置をX座標で、画像の中心、表示位置は左端。
        x: game.image.dino.width / 2,
        // y：恐竜の位置をY座標で、画像の中心、表示位置は一番下。
        y: canvas.height - game.image.dino.height / 2,
        // moveY：恐竜のY軸の移動速度の数値
        moveY: 0,
        // width：恐竜の横幅
        width: game.image.dino.width,
        // height：恐竜の画像の縦幅
        height: game.image.dino.height,
        // image：恐竜の画像のイメージオブジェクト
        image: game.image.dino
    }
}

// あたり判定を行う
function hitCheck() {
    for (const enemy of game.enemys) {
        if (
            /* 絶対値で「abs」＝absolute 負の値でも正の値にしてくれる
               X座標の恐竜画像の半分　と サボテン・鳥の座標画像の半分以内なら当たり判定 
            Math.abs(game.dino.x - enemy.x) < game.dino.width / 2 + enemy.width / 2 &&
               かつ ＆＆ 引き算で恐竜と敵の距離を求めてから、Y座業の・・・当たり判定
            Math.abs(game.dino.y - enemy.y) < game.dino.height / 2 + enemy.height / 2
            */
            
            // 当たり判定をヌルくする、プログラム的な当りでなく、イラスト的な当り判定
            Math.abs(game.dino.x - enemy.x) < game.dino.width * 0.6 / 2 + enemy.width * 0.7 / 2 &&
            Math.abs(game.dino.y - enemy.y) < game.dino.height * 0.5 / 2 + enemy.height * 0.7 / 2
            ) {
            // ゲーム中かどうかを判断する真偽値＞終了
            // game.isGameOver = true;
            // hitCheck() 関数にて BGM を止める処理の追加と、 
            // isGameOver ではなく state 変数を使う
            game.state = 'gameover';
            // BGM を止めるには pause() 関数
            game.bgm1.pause();
            // Canvasに文字を書く方法、太字、100ピクセル、書体
            ctx.fillStyle = 'red';　// フォント設定
            ctx.font = 'bold 100px serif';
            ctx.fillText(`おしまい`, 150, 200);
            // game.timerにtickerオブジェクトがはっているをclearIntervalで1秒33回fpsが止まる
            // clearInterval でゲームのタイマー（ticker）が止まる
            clearInterval(game.timer);
        }
    }　
}

/* 何かキー入力があったときに関数を実行する
　 function(e)はキーあったらイベント(e)をする関数
   無名関数でもfunction(e)どちらでもかまわない
   キー入力の箇所のプログラムも見直します。
　 ゲーム初期画面の時はゲームを開始するようにし、
　 ジャンプするときにはジャンプ用の BGM を再生するようにします。
   また、isGameOver ではなく state 変数を使う
*/ 
document.onkeydown = function(e) {
    // キー入力の箇所のプログラム修正
        if(e.key === ' ' && game.state === 'init') {
        start();
    }
    // イベントの'スペース'キーが押された状態でかつ、&&
    // 移動速度のmoveが「0」のとき
    if(e.key === ' ' && game.dino.moveY === 0) {
        // 移動速度を-41にする＞ジャンプ力の大きさ（初期値）
        game.dino.moveY = -41;
        game.bgm2.play();
        }
        // Game Over でゲームが終了した後に、 
        // Enterキーを押すことで ゲームをもう一度遊べる機能
        // isGameOver === true＞ゲームオーバーのとき
        // if(e.key === 'Enter' && game.isGameOver === true) {
        if(e.key === 'Enter' && game.state === 'gameover') {
            init();
        }
}