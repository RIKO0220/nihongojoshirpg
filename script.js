// =========================
// 問題
// =========================

let questions = [];
let currentQuestion = null;
let draggingEl = null;
let answered = false;

// =========================
// 実験ログ・解答時間計測用（※追加）
// =========================
let questionStartTime = null;
let wrongQuestionsList = [];

// =========================
// ユーザー
// =========================

let playerName =
    localStorage.getItem("currentPlayer");

if(!playerName){
    playerName =
        prompt("ユーザー名を入力してください") || "ゲスト";

    localStorage.setItem(
        "currentPlayer",
        playerName
    );
}

// =========================
// URL
// =========================

const params =
    new URLSearchParams(location.search);

let playerElement =
    params.get("element") || "火";

const mode =
    params.get("mode") || "normal";

// =========================
// 復習
// =========================

let reviewQuestions = [];

// =========================
// プレイヤー
// =========================

let combo = 0;
let solveCount = 0;
let enemyCount = 0;
let ownedCharacters = [];
let partyCharacters = [];

let level = 1;
let exp = 0;
let expToNext = 100;

let maxHp = 150;
let playerHp = 150;
let attackPower = 25;

let specialGauge = 0;
let specialUnlocked = false;

// =========================
// 敵
// =========================

let currentEnemy = null;

// =========================
// 通常敵
// =========================

const normalEnemies = [

{
    name:"ファイアスライム",
    element:"火",
    hp:80,
    image:"images/enemy_fireslime.png"
},

{
    name:"ウォータースライム",
    element:"水",
    hp:80,
    image:"images/enemy_waterslime.png"
},

{
    name:"アースゴーレム",
    element:"地",
    hp:100,
    image:"images/enemy_earthgolem.png"
},

{
    name:"ウィンドバード",
    element:"風",
    hp:100,
    image:"images/enemy_windbird.png"
},

{
    name:"サンダービースト",
    element:"雷",
    hp:120,
    image:"images/enemy_thunderbeast.png"
},

{
    name:"ホーリーエンジェル",
    element:"光",
    hp:150,
    image:"images/enemy_holyangel.png"
},

{
    name:"シャドウリーパー",
    element:"闇",
    hp:150,
    image:"images/enemy_shadowreaper.png"
}

];

// =========================
// ボス
// =========================

const bosses = [

{
    name:"炎王ドラゴン",
    element:"火",
    hp:300,
    image:"images/enemy_firedragon.png"
},

{
    name:"海神リヴァイア",
    element:"水",
    hp:400,
    image:"images/enemy_waterlevia.png"
},

{
    name:"大地巨人ガイア",
    element:"地",
    hp:500,
    image:"images/enemy_earthgaia.png"
},

{
    name:"暴風神トルネード",
    element:"風",
    hp:650,
    image:"images/enemy_windtornade.png"
},

{
    name:"雷神ゼウス",
    element:"雷",
    hp:800,
    image:"images/enemy_thunderzeus.png"
},

{
    name:"聖天使ルミナ",
    element:"光",
    hp:1000,
    image:"images/enemy_angellumina.png"
},

{
    name:"冥王ネクロス",
    element:"闇",
    hp:1200,
    image:"images/enemy_nekroz.png"
}

];

// =========================
// 属性相性
// =========================

const elementTable = {
    火:{
        strong:["風","地"],
        weak:["水"]
    },
    水:{
        strong:["火"],
        weak:["雷","地"]
    },
    地:{
        strong:["水","雷"],
        weak:["火","風"]
    },
    風:{
        strong:["地","雷"],
        weak:["火"]
    },
    雷:{
        strong:["水","風"],
        weak:["地"]
    },
    光:{
        strong:["闇"],
        weak:["闇"]
    },
    闇:{
        strong:["光"],
        weak:["光"]
    }
};



// =========================
// 共通
// =========================

function cloneObject(obj){
    return JSON.parse(
        JSON.stringify(obj)
    );
}

// =========================
// パーティ属性ボーナス
// =========================

function getPartyBonus(){

    const party =
        [playerElement, ...partyCharacters];

    let attackBonus = 0;
    let hpBonus = 0;

    if(
        party.includes("火") &&
        party.includes("風")
    ){
        attackBonus += 0.10;
    }

    if(
        party.includes("水") &&
        party.includes("地")
    ){
        hpBonus += 0.10;
    }

    if(
        party.includes("雷") &&
        party.includes("風")
    ){
        attackBonus += 0.10;
    }

    if(
        party.includes("光") &&
        party.includes("闇")
    ){
        attackBonus += 0.20;
    }

    return {
        attackBonus,
        hpBonus
    };
}

// =========================
// ステータス再計算
// =========================

function recalculatePartyStatus(){

    const partySize =
        partyCharacters.length + 1;

    maxHp =
        150 +
        (partySize - 1) * 40 +
        (level - 1) * 15;

    attackPower =
        25 +
        (partySize - 1) * 5 +
        (level - 1) * 3;

    const bonus =
        getPartyBonus();

    maxHp =
        Math.floor(
            maxHp *
            (1 + bonus.hpBonus)
        );

    attackPower =
        Math.floor(
            attackPower *
            (1 + bonus.attackBonus)
        );

    if(playerHp > maxHp){
        playerHp = maxHp;
    }
}

// =========================
// 属性倍率
// =========================

function getElementMultiplier(
    attacker,
    defender
){

    const data =
        elementTable[attacker];

    if(!data){
        return 1.0;
    }

    if(data.strong.includes(defender)){
        return 1.5;
    }

    if(data.weak.includes(defender)){
        return 0.5;
    }

    return 1.0;
}

// =========================
// 敵生成（5体ごとにボス出現）
// =========================

function createEnemy(){

    if(
        enemyCount > 0 &&
        enemyCount % 5 === 0
    ){
        const bossIndex =
            Math.floor(enemyCount / 5) - 1;

        currentEnemy =
            cloneObject(
                bosses[
                    bossIndex % bosses.length
                ]
            );
        currentEnemy.isBoss = true;
    }
    else{
        currentEnemy =
            cloneObject(
                normalEnemies[
                    Math.floor(
                        Math.random() *
                        normalEnemies.length
                    )
                ]
            );
        currentEnemy.isBoss = false;
    }

    updateEnemy();
}

// =========================
// 敵表示（ボス出現表示対応）
// =========================

function updateEnemy(){

    if(!currentEnemy){
        return;
    }

    const enemyImage = document.getElementById("enemyImage");
    const enemyInfo = document.getElementById("enemyInfo");

    enemyImage.src = currentEnemy.image;

    // ロード直後など isBoss フラグがない場合も名前や撃破数から判定できるようにする
    const isBoss = currentEnemy.isBoss || bosses.some(b => b.name === currentEnemy.name);

    let bossBadge = "";
    if (isBoss) {
        bossBadge =
            "<div style='background:#d32f2f; color:#fff; font-weight:bold; font-size:14px; padding:2px 8px; border-radius:8px; margin-bottom:4px; text-align:center;'>" +
            "⚠️ <ruby>ボス出現<rt>ぼすしゅつげん</rt></ruby>！" +
            "</div>";
        enemyInfo.style.borderColor = "#ff5252";
        enemyInfo.style.boxShadow = "0 0 14px rgba(255, 82, 82, 0.85)";
    } else {
        enemyInfo.style.borderColor = "rgba(255, 255, 255, 0.7)";
        enemyInfo.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.25)";
    }

    enemyInfo.innerHTML =
        bossBadge +
        addFurigana(currentEnemy.name) + "<br>" +
        addFurigana("属性") + "：" + addFurigana(currentEnemy.element) + "<br>" +
        "HP：" + currentEnemy.hp;
}

// ========================================
// 必殺技ボタンの有効・無効を切り替える
// ========================================

function updateSpecialButton() {

    const button = document.getElementById("specialBtn");

    if (!button) return;

    const canUseSpecial =
        specialUnlocked && specialGauge >= 100;

    button.disabled = !canUseSpecial;
}

// =========================
// プレイヤー表示
// =========================

function updatePlayer(){

    let playerImage =
    "images/player_fire.png";

switch(playerElement){

    case "火":
        playerImage =
            "images/player_fire.png";
        break;

    case "水":
        playerImage =
            "images/player_water.png";
        break;

    case "地":
        playerImage =
            "images/player_earth.png";
        break;

    case "風":
        playerImage =
            "images/player_wind.png";
        break;

    case "雷":
        playerImage =
            "images/player_thunder.png";
        break;

    case "光":
        playerImage =
            "images/player_light.png";
        break;

    case "闇":
        playerImage =
            "images/player_dark.png";
        break;

}

document
.getElementById("playerImage")
.src =
playerImage;

    let friendText =
    partyCharacters.length === 0
    ? "なし"
    : partyCharacters.join("・");

    document
.getElementById("playerInfo")
.innerHTML =
    addFurigana("名前") +
    "：" + escapeHtml(playerName) + "<br>" +

    addFurigana("属性") +
    "：" + addFurigana(playerElement) + "<br>" +

    "Lv：" + level + "<br>" +

    addFurigana("攻撃力") +
    "：" + attackPower + "<br>" +

    "コンボ：" + combo + "<br>" +

    addFurigana("撃破数") +
    "：" + enemyCount + "<br>";


document
.getElementById("solveCount")
.innerHTML =
    addFurigana("解いた問題数") +
    "：" + solveCount;

// =========================
// 仲間画像表示
// =========================

const friendsList =
    document.getElementById("friendsList");

if(friendsList){

    // 一度全部消す
    friendsList.innerHTML = "";

    // 同じキャラが重複しないようにする
    const uniqueCharacters =
    [...new Set(partyCharacters)];

    uniqueCharacters.forEach(character => {

        let image = "";

        switch(character){

            case "火":
                image =
                    "images/player_fire.png";
                break;

            case "水":
                image =
                    "images/player_water.png";
                break;

            case "地":
                image =
                    "images/player_earth.png";
                break;

            case "風":
                image =
                    "images/player_wind.png";
                break;

            case "雷":
                image =
                    "images/player_thunder.png";
                break;

            case "光":
                image =
                    "images/player_light.png";
                break;

            case "闇":
                image =
                    "images/player_dark.png";
                break;

        }

        // 画像が設定されている場合だけ表示
        if(image){

            const img =
                document.createElement("img");

            img.src = image;

            img.className =
                "friendImage";

            img.alt =
                character + "属性の仲間";

            friendsList.appendChild(img);

        }

    });

}

    // =========================
    // メーター更新
    // =========================

    document.getElementById("hpText").textContent =
    playerHp + " / " + maxHp;

    document.getElementById("expText").textContent =
    exp + " / " + expToNext;

    document.getElementById("specialText").textContent =
    specialGauge + " / 100";

    document.getElementById("hpBar").style.width =
    (playerHp / maxHp * 100) + "%";

    document.getElementById("expBar").style.width =
    (exp / expToNext * 100) + "%";

    document.getElementById("specialBar").style.width =
    specialGauge + "%";

    updateSpecialButton();
}

// =========================
// セーブ（正常版）
// =========================

async function saveGame() {
    const currentPlayerName = localStorage.getItem("currentPlayer");
    if (!currentPlayerName) return;

    const saveKey = "save_" + currentPlayerName;
    
    const saveData = {
        playerName: currentPlayerName,
        playerElement: playerElement,
        level: level,
        exp: exp,
        expToNext: expToNext,
        playerHp: playerHp,
        maxHp: maxHp,
        attackPower: attackPower,
        enemyCount: enemyCount,
        solveCount: solveCount,
        combo: combo,
        ownedCharacters: ownedCharacters || [],
        partyCharacters: partyCharacters || [],
        specialGauge: specialGauge,
        specialUnlocked: specialUnlocked,
        currentEnemy: currentEnemy,
        wrongQuestions: wrongQuestionsList || [],
        updatedAt: new Date().toISOString()
    };

    // 1. ローカルに保存
    localStorage.setItem(saveKey, JSON.stringify(saveData));

    // 2. クラウド（Firebase）に保存
    if (window.saveDataToCloud) {
        await window.saveDataToCloud(currentPlayerName, saveData);
    }
}


// =========================
// 初期所持キャラクター読み込み
// =========================

function loadInitialCharacters(){

    const key =
        "initialCharacters_" + playerName;


    const saved =
        localStorage.getItem(key);


    if(saved){

        try{

            ownedCharacters =
                JSON.parse(saved);

        }
        catch(error){

            ownedCharacters = [];

        }

    }
    else{

        ownedCharacters = [];

    }


    // 最初は所持キャラを
    // そのままパーティにする

    // =========================
// 初期パーティ
// =========================

// 所持していても
// 選択していない仲間は戦闘に参加させない
partyCharacters = [];

}


// =========================
// ロード（クラウド対応版）
// =========================

async function loadGame(){

    let data = null;

    // 1. まずクラウド（Firebase）から取得を試みる
    if (window.loadDataFromCloud) {
        data = await window.loadDataFromCloud(playerName);
    }

    // 2. クラウドになければローカルストレージを確認
    if (!data) {
        const rawData = localStorage.getItem("save_" + playerName);
        if (rawData) {
            try {
                data = JSON.parse(rawData);
            } catch(e){}
        }
    }

    // セーブデータがない
    if(!data){
        loadInitialCharacters();
        return false;
    }

    // =========================
    // データセット
    // =========================

    if(data.playerElement){
        playerElement = data.playerElement;
    }

    level = data.level ?? 1;
    exp = data.exp ?? 0;
    expToNext = data.expToNext ?? 100;
    playerHp = data.playerHp ?? 150;
    maxHp = data.maxHp ?? 150;
    attackPower = data.attackPower ?? 25;
    enemyCount = data.enemyCount ?? 0;
    solveCount = data.solveCount ?? 0;
    combo = data.combo ?? 0;

    ownedCharacters = data.ownedCharacters ?? [];

    partyCharacters = Array.isArray(data.partyCharacters)
        ? data.partyCharacters
        : [];

    specialGauge = data.specialGauge ?? 0;
    specialUnlocked = data.specialUnlocked ?? false;
    currentEnemy = data.currentEnemy ?? null;

    // クラウド上の間違えた問題リストをローカルと同期（※追加）
    if (Array.isArray(data.wrongQuestions)) {
        wrongQuestionsList = data.wrongQuestions;
        localStorage.setItem("wrongQuestions" + playerName, JSON.stringify(wrongQuestionsList));
    } else {
        wrongQuestionsList = JSON.parse(localStorage.getItem("wrongQuestions" + playerName) || "[]");
    }

    if(currentEnemy && currentEnemy.hp <= 0){
        currentEnemy = null;
    }

    return true;
}

// =========================
// JSON読み込み
// =========================

// =========================
// JSON読み込み・初期起動
// =========================

fetch("questions.json")
.then(res => res.json())
.then(async data => {

    questions = data.filter(q => q.id <= 2500);

    if(mode === "review"){
        const saved = localStorage.getItem("wrongQuestions" + playerName);
        if(saved){
            reviewQuestions = JSON.parse(saved);
        }
    }

    // クラウド/ローカルからデータを非同期ロード
    await loadGame();

    recalculatePartyStatus();

    if(!currentEnemy){
        createEnemy();
    } else {
        updateEnemy();
    }

    updatePlayer();

    setupStaticFurigana();

    nextQuestion();

    showTutorial();

});

// =========================
// 次の問題（復習モード対応版）
// =========================

function nextQuestion(){

    answered = false;

    document
    .getElementById("result")
    .textContent = "";

    document
    .getElementById("actionBtn")
    .innerHTML =
    addFurigana("決定");

    if(mode === "review"){

        // 復習できる問題がない場合
        if(!reviewQuestions || reviewQuestions.length === 0){

            document
            .getElementById("sentence")
            .innerHTML =
            "<div style='font-size:24px; font-weight:bold; color:#ff4d4d; text-align:center; margin:20px 0;'>" +
            addFurigana("復習できる問題がないよ！") +
            "</div>";

            document.getElementById("choices").innerHTML = "";
            document.getElementById("questionId").textContent = "";

            // 決定ボタン等を無効化または非表示にする
            const actionBtn = document.getElementById("actionBtn");
            if(actionBtn){
                actionBtn.style.display = "none";
            }

            return;
        }

        currentQuestion =
            reviewQuestions[
                Math.floor(
                    Math.random() *
                    reviewQuestions.length
                )
            ];
    }
    else{

        currentQuestion =
            questions[
                Math.floor(
                    Math.random() *
                    questions.length
                )
            ];
    }

    renderQuestion(currentQuestion);
}

// =========================
// 問題表示
// =========================

function renderQuestion(q){

    document
    .getElementById("questionId")
    .textContent =
    "No." + q.id;

    const sentence =
        document.getElementById("sentence");

    sentence.innerHTML = "";

    const blankCount =
        q.answers[0].length;

    q.textParts.forEach((part,i)=>{

        const span =
            document.createElement("span");

        span.innerHTML = 
            addFurigana(part);

        sentence.appendChild(span);

        if(i < blankCount){

            const drop =
                document.createElement("span");

            drop.className = "drop";
            drop.dataset.value = "";

            sentence.appendChild(drop);
        }

    });

    renderChoices(q.answers);
    // 問題表示完了時刻を記録（※追加）
    questionStartTime = Date.now();
}

// =========================
// 選択肢
// =========================

function renderChoices(answerPatterns){

    const choicesDiv =
        document.getElementById("choices");

    choicesDiv.innerHTML = "";

    let choices =
        answerPatterns.flat();

    choices =
        [...new Set(choices)];

    const particles = [
        "は",
        "が",
        "を",
        "に",
        "へ",
        "で",
        "と",
        "から",
        "まで"
    ];

    while(choices.length < 5){

        const p =
            particles[
                Math.floor(
                    Math.random() *
                    particles.length
                )
            ];

        if(!choices.includes(p)){
            choices.push(p);
        }
    }

    choices.sort(
        ()=>Math.random()-0.5
    );

    choices.forEach(choice=>{

        const el =
            document.createElement("div");

        el.className = "choice";
        el.textContent = choice;

        choicesDiv.appendChild(el);
    });
}

// =========================
// 必殺技
// =========================

function useSpecial(){

    if(
        !specialUnlocked ||
        specialGauge < 100
    ){

        alert(
            "必殺技ゲージが足りません"
        );

        return;
    }

    specialGauge = 0;

    playerAttackAnimation();

    enemyDamageAnimation();


    let damage =
        attackPower * 5;


    damage =
        Math.floor(
            damage *
            getElementMultiplier(
                playerElement,
                currentEnemy.element
            )
        );


    currentEnemy.hp -= damage;


    if(currentEnemy.hp < 0){
        currentEnemy.hp = 0;
    }


    alert(
        "属性必殺技発動！\n" +
        damage +
        "ダメージ！"
    );


    // =========================
    // 敵を倒した
    // =========================

    if(currentEnemy.hp <= 0){

        enemyCount++;

        exp += 30;


        // レベルアップ
        // 変更前の最大HPを保存
const oldMaxHp = maxHp;


// =========================
// レベルアップ
// =========================

while(exp >= expToNext){

    exp -= expToNext;

    level++;

    expToNext =
        Math.floor(
            expToNext * 1.3
        );

    alert(
        "レベルアップ！ Lv" +
        level
    );
}


// =========================
// 必殺技解放
// =========================

if(level >= 5){
    specialUnlocked = true;
}


// =========================
// 仲間加入判定
// =========================

checkJoinCharacters();


// =========================
// レベルアップ＋仲間分を反映
// =========================

// 新しいレベル・新しい仲間で
// 最大HPを再計算
recalculatePartyStatus();

// 最大HPがどれだけ増えたか
const hpIncrease =
    maxHp - oldMaxHp;

// 増えた最大HP分だけ現在HPも回復
if(hpIncrease > 0){

    playerHp += hpIncrease;

    if(playerHp > maxHp){
        playerHp = maxHp;
    }
}


        // ★次の敵
        createEnemy();

    }
    else{

        updateEnemy();

    }


    updatePlayer();

    saveGame();
}

// =========================
// ゲーム画面の固定文字
// ここで1回だけふりがなを付ける
// =========================

function setupStaticFurigana(){

    const targets = [

        ["h1", "助詞RPGバトル"],

        [
            "#friendsArea h2",
            "仲間"
        ],

        [
            "#specialBtn",
            "必殺技"
        ],

        [
            "#homeBtn",
            "ホームに戻る"
        ],

        [
            "#tutorialPopup h2",
            "ゲームの遊び方"
        ],

        [
            "#tutorialClose",
            "ゲームを始める"
        ],

        [
            "#explanationClose",
            "次の問題へ"
        ]

    ];


    targets.forEach(
        function(item){

            const element =
                document.querySelector(
                    item[0]
                );

            if(element){

                element.innerHTML =
                    addFurigana(
                        item[1]
                    );

            }

        }
    );


    // =========================
    // 必殺ゲージ
    // =========================

    const specialLabel =
        document.querySelector(
            "#specialText"
        )
        ?.parentElement
        ?.querySelector(
            "span:first-child"
        );

    if(specialLabel){

        specialLabel.innerHTML =
            addFurigana("必殺");

    }


    // =========================
    // チュートリアル本文
    // =========================

    const helpBtn = document.getElementById("helpBtn");
    if (helpBtn) {
        helpBtn.innerHTML = "<ruby>遊<rt>あそ</rt></ruby>び<ruby>方<rt>かた</rt></ruby>";
    }

    // =========================
    // チュートリアル本文（正しいルビ直書き版）
    // =========================

    const tutorialMessage =
        document.getElementById(
            "tutorialMessage"
        );

    if(tutorialMessage){

        tutorialMessage.innerHTML = `
            <div style="text-align: left; font-size: 17px; line-height: 1.9;">
                <p style="margin: 8px 0;">
                    <strong>【<ruby>基本<rt>きほん</rt></ruby>ルール・<ruby>目標<rt>もくひょう</rt></ruby>】</strong><br>
                    <ruby>文<rt>ぶん</rt></ruby>の<ruby>空欄<rt>くうらん</rt></ruby>に<ruby>入<rt>はい</rt></ruby>る<ruby>正<rt>ただ</rt></ruby>しい<ruby>助詞<rt>じょし</rt></ruby>をドラッグして<ruby>入<rt>い</rt></ruby>れ、「<ruby>決定<rt>けってい</rt></ruby>」を<ruby>押<rt>お</rt></ruby>そう！<br>
                    <ruby>正解<rt>せいかい</rt></ruby>すると<ruby>敵<rt>てき</rt></ruby>に<ruby>攻撃<rt>こうげき</rt></ruby>！10<ruby>体<rt>たい</rt></ruby><ruby>倒<rt>たお</rt></ruby>すごとに<ruby>強力<rt>きょうりょく</rt></ruby>なボスが<ruby>出現<rt>しゅつげん</rt></ruby>するよ。
                </p>

                <p style="margin: 8px 0;">
                    <strong>【<ruby>属性<rt>ぞくせい</rt></ruby>の<ruby>相性<rt>あいしょう</rt></ruby>】</strong><br>
                    <ruby>得意<rt>とくい</rt></ruby>な<ruby>属性<rt>ぞくせい</rt></ruby>の<ruby>敵<rt>てき</rt></ruby>にはダメージが1.5<ruby>倍<rt>ばい</rt></ruby>！<ruby>苦手<rt>にがて</rt></ruby>な<ruby>属性<rt>ぞくせい</rt></ruby>だと0.5<ruby>倍<rt>ばい</rt></ruby>になるよ。<br>
                    （<ruby>火<rt>ひ</rt></ruby>→<ruby>風<rt>かぜ</rt></ruby>・<ruby>地<rt>ち</rt></ruby> ／ <ruby>水<rt>みず</rt></ruby>→<ruby>火<rt>ひ</rt></ruby> ／ <ruby>地<rt>ち</rt></ruby>→<ruby>水<rt>みず</rt></ruby>・<ruby>雷<rt>かみなり</rt></ruby> ／ <ruby>風<rt>かぜ</rt></ruby>→<ruby>地<rt>ち</rt></ruby>・<ruby>雷<rt>かみなり</rt></ruby> ／ <ruby>雷<rt>かみなり</rt></ruby>→<ruby>水<rt>みず</rt></ruby>・<ruby>風<rt>かぜ</rt></ruby> ／ <ruby>光<rt>ひかり</rt></ruby>⇔<ruby>闇<rt>やみ</rt></ruby>）
                </p>

                <p style="margin: 8px 0;">
                    <strong>【<ruby>仲間<rt>なかま</rt></ruby>キャラクター】</strong><br>
                    <ruby>敵<rt>てき</rt></ruby>をたくさん<ruby>倒<rt>たお</rt></ruby>すと<ruby>新<rt>あたら</rt></ruby>しい<ruby>属性<rt>ぞくせい</rt></ruby>の<ruby>仲間<rt>なかま</rt></ruby>が<ruby>増<rt>ふ</rt></ruby>えるよ！ホームの「パーティ<ruby>編成<rt>へんせい</rt></ruby>」で<ruby>最大<rt>さいだい</rt></ruby>2<ruby>人<rt>にん</rt></ruby>まで<ruby>連<rt>つ</rt></ruby>れていけて、HPや<ruby>攻撃力<rt>こうげきりょく</rt></ruby>がアップするよ。
                </p>

                <p style="margin: 8px 0;">
                    <strong>【<ruby>必殺技<rt>ひっさつわざ</rt></ruby>】</strong><br>
                    レベル5<ruby>以上<rt>いじょう</rt></ruby>になり、<ruby>正解<rt>せいかい</rt></ruby>して「<ruby>必殺<rt>ひっさつ</rt></ruby>ゲージ」が100になると<ruby>使<rt>つか</rt></ruby>える<ruby>超強力<rt>ちょうきょうりょく</rt></ruby>な<ruby>攻撃<rt>こうげき</rt></ruby>だよ！
                </p>
            </div>
        `;

    }

}

// =========================
// 開始前ゲーム説明
// =========================

function showTutorial(){

    const overlay =
        document.getElementById(
            "tutorialOverlay"
        );

    const closeButton =
        document.getElementById(
            "tutorialClose"
        );

    const timer =
        document.getElementById(
            "tutorialTimer"
        );

    const characterImage =
        document.getElementById(
            "tutorialCharacterImage"
        );


    // =========================
    // キャラクター画像
    // =========================

    if(characterImage){

        switch(playerElement){

            case "火":

                characterImage.src =
                    "images/player_fire.png";

                break;

            case "水":

                characterImage.src =
                    "images/player_water.png";

                break;

            case "地":

                characterImage.src =
                    "images/player_earth.png";

                break;

            case "風":

                characterImage.src =
                    "images/player_wind.png";

                break;

            case "雷":

                characterImage.src =
                    "images/player_thunder.png";

                break;

            case "光":

                characterImage.src =
                    "images/player_light.png";

                break;

            case "闇":

                characterImage.src =
                    "images/player_dark.png";

                break;

        }

    }


    // 表示

    overlay.style.display =
        "flex";


    // 5秒間閉じられない

    closeButton.disabled =
        true;

    let remainingTime = 5;

    timer.textContent =
        "あと " +
        remainingTime +
        " 秒";


    const countdown =
        setInterval(function(){

            remainingTime--;

            if(
                remainingTime > 0
            ){

                timer.textContent =
                    "あと " +
                    remainingTime +
                    " 秒";

            }else{

                clearInterval(
                    countdown
                );

                timer.innerHTML =
    addFurigana("説明を読み終えたら始めよう！");

                closeButton.disabled =
                    false;

            }

        },1000);


    // ゲーム開始
    closeButton.onclick = function(){
        overlay.style.display = "none";
        // チュートリアルを閉じた瞬間を1問目の開始時刻にする（※追加）
        questionStartTime = Date.now();
    };
}


// =========================
// 問題解説ポップアップ
// =========================

function showExplanation(
    correct,
    answerText,
    explanationText
){

    const overlay =
        document.getElementById(
            "explanationOverlay"
        );

    const title =
        document.getElementById(
            "explanationTitle"
        );

    const text =
        document.getElementById(
            "explanationText"
        );

    const timer =
        document.getElementById(
            "explanationTimer"
        );

    const closeButton =
        document.getElementById(
            "explanationClose"
        );


    // =========================
    // タイトル
    // =========================

    if (correct) {

    title.textContent = "⭕ 正解！";
    title.className = "resultCorrect";

} else {

    title.textContent = "❌ 残念！";
    title.className = "resultWrong";

}


    // =========================
    // 内容
    // =========================

    let message = "";

    if(correct){

        message +=
            "正解です！\n\n";

    }else{

        message +=
            "残念！\n\n";

    }


    message +=
        answerText +
        "\n\n";


    message +=
        "【解説】\n" +
        explanationText;


    text.innerHTML =
    addFurigana(message)
    .replaceAll("\n", "<br>");


    // =========================
    // 表示
    // =========================

    overlay.style.display = "flex";

    const popup = document.getElementById("explanationPopup");
    if (popup) {
        popup.scrollTop = 0;
    }
    text.scrollTop = 0;


    // =========================
    // 5秒間閉じられない
    // =========================

    closeButton.disabled =
        true;

    let remainingTime = 5;

    timer.textContent =
        "あと " +
        remainingTime +
        " 秒";


    const countdown =
        setInterval(function(){

            remainingTime--;

            if(
                remainingTime > 0
            ){

                timer.textContent =
                    "あと " +
                    remainingTime +
                    " 秒";

            }else{

                clearInterval(
                    countdown
                );

                timer.innerHTML =
    addFurigana("解説を読み終えたら次へ進もう！");

                closeButton.disabled =
                    false;

            }

        },1000);


    // =========================
    // 次の問題
    // =========================

    closeButton.onclick =
        function(){

            overlay.style.display =
                "none";

            nextQuestion();

        };

}

// =========================
// ボタン
// =========================

function buttonAction(){

    if(answered){

        return;

    }else{

        checkAnswer();

    }

}

// =========================
// 判定
// =========================

function checkAnswer(){

    answered = true;

    // 解答時間を計算（ミリ秒・秒）（※追加）
    const endTime = Date.now();
    const elapsedMs = questionStartTime ? (endTime - questionStartTime) : 0;
    const elapsedSec = Number((elapsedMs / 1000).toFixed(2));

    document
    .getElementById("actionBtn")
    .textContent = "つぎへ";

    solveCount++;

    const drops =
        document.querySelectorAll(".drop");

    let userAnswer = [];

    drops.forEach(drop=>{
        userAnswer.push(
            drop.dataset.value
        );
    });

    let correct = false;

    currentQuestion.answers.forEach(pattern=>{

        const ok =
            pattern.every(
                (ans,i)=>
                ans === userAnswer[i]
            );

        if(ok){
            correct = true;
        }

    });

    let resultText = "";

    if(correct){

        playerAttackAnimation();
        enemyDamageAnimation();

        let damage = attackPower + combo * 5;
        damage = Math.floor(damage * getElementMultiplier(playerElement, currentEnemy.element));

        combo++;
        currentEnemy.hp -= damage;

        if(currentEnemy.hp < 0){
            currentEnemy.hp = 0;
        }

        resultText += "正解！\n";
        resultText += damage + " ダメージ！\n\n";

        exp += 20;
        specialGauge += 10;

        if(specialGauge > 100){
            specialGauge = 100;
        }

        // ========================================
        // 復習モード時：正解した問題をリストから削除
        // ========================================
        if(mode === "review"){
            const wrongQuestionsKey = "wrongQuestions" + playerName;
            
            // 今正解した問題を復習リストから除外
            reviewQuestions = reviewQuestions.filter(q => q.id !== currentQuestion.id);
            
            // ローカルストレージも更新
            localStorage.setItem(
                wrongQuestionsKey,
                JSON.stringify(reviewQuestions)
            );
        }

    }
    else{

        combo = 0;
        playerHp -= 15;

        if(playerHp < 0){
            playerHp = 0;
        }

        playerDamageAnimation();

        resultText += "不正解...\n";
        resultText += "15ダメージ受けた\n\n";

        // ========================================
        // 通常モード時：間違えた問題を保存
        // （※復習モードでの誤答は重複追加を防ぐため保存しない）
        // ========================================
        if(mode !== "review"){
            const wrongQuestionsKey = "wrongQuestions" + playerName;

            let savedWrong = JSON.parse(
                localStorage.getItem(wrongQuestionsKey) || "[]"
            );

            const alreadySaved = savedWrong.some(
                q => q.id === currentQuestion.id
            );

            if(!alreadySaved){
                savedWrong.push(currentQuestion);
                localStorage.setItem(
                    wrongQuestionsKey,
                    JSON.stringify(savedWrong)
                );
            }
            wrongQuestionsList = savedWrong;
        }
    }

    // 復習モードで正解した場合も wrongQuestionsList を同期（※追加）
    if(mode === "review" && correct){
        wrongQuestionsList = reviewQuestions;
    }

    // =========================
    // 1問ごとの解答ログを保存（ローカル＆クラウド）（※追加）
    // =========================
    recordAnswerLog({
        playerName: playerName,
        mode: mode,
        questionId: currentQuestion.id,
        sentence: currentQuestion.textParts.join("（ ）"),
        correctAnswers: currentQuestion.answers.map(p => p.join("・")).join(" / "),
        userAnswer: userAnswer.map(v => v || "未選択").join("・"),
        isCorrect: correct,
        responseTimeMs: elapsedMs,
        responseTimeSec: elapsedSec,
        solveNumber: solveCount,
        timestamp: new Date().toISOString()
    });


    // =========================
    // 解説ポップアップ表示
    // =========================

    let explanationText = "";

    if(
        currentQuestion.explain_child
    ){

        currentQuestion
            .explain_child
            .forEach(obj=>{

                const key =
                    Object.keys(obj)[0];

                explanationText +=
                    obj[key] + "\n";

            });

    }else{

        explanationText =
            "この問題の解説はありません。";

    }

// =========================
// 正解文・別解を作る
// =========================

// 正解パターンを全部取得
let answerPatterns =
    [...currentQuestion.answers];

// ユーザーが選んだ答えが正解なら、
// そのパターンを一番最初にする
if(correct){

    const selectedIndex =
        answerPatterns.findIndex(pattern =>
            pattern.length === userAnswer.length &&
            pattern.every(
                (ans, i) =>
                    ans === userAnswer[i]
            )
        );

    if(selectedIndex > 0){

        const selectedPattern =
            answerPatterns.splice(
                selectedIndex,
                1
            )[0];

        answerPatterns.unshift(
            selectedPattern
        );
    }
}


// =========================
// 各パターンを文章にする
// =========================

const answerSentences =
    answerPatterns.map(pattern => {

        let sentence = "";

        currentQuestion.textParts.forEach(
            (part, i) => {

                sentence += part;

                if(i < pattern.length){
                    sentence += pattern[i];
                }

            }
        );

        return sentence;
    });


// 重複を削除
const uniqueAnswerSentences =
    [...new Set(answerSentences)];

// =========================
// 自分の答えを文章にする（未回答対応）
// =========================

let userAnswerText = "";
let hasBlank = false;

currentQuestion.textParts.forEach(
    (part, i) => {

        userAnswerText += part;

        if(i < userAnswer.length){
            const val = userAnswer[i];
            if(!val || val === ""){
                userAnswerText += "（ ）";
                hasBlank = true;
            }else{
                userAnswerText += "【" + val + "】";
            }
        }

    }
);

if(hasBlank){
    userAnswerText += "（※空欄あり）";
}


// =========================
// 別解を作る
// =========================

let alternativeAnswers = [];

currentQuestion.answers.forEach(
    pattern => {

        const isUserAnswer =
            pattern.length === userAnswer.length &&
            pattern.every(
                (ans, i) =>
                    ans === userAnswer[i]
            );

        if(isUserAnswer){
            return;
        }

        let sentence = "";

        currentQuestion.textParts.forEach(
            (part, i) => {

                sentence += part;

                if(i < pattern.length){
                    sentence += "【" + pattern[i] + "】";
                }

            }
        );

        alternativeAnswers.push(sentence);

    }
);

alternativeAnswers =
    [...new Set(alternativeAnswers)];


// =========================
// ポップアップ表示用
// =========================

let correctAnswerText = "";

// 正解した場合
if(correct){

    correctAnswerText +=
        "あなたの答え：\n" +
        userAnswerText;

    if(alternativeAnswers.length > 0){

        correctAnswerText +=
            "\n\n別解：\n" +
            alternativeAnswers.join("\n");

    }

}
// 不正解の場合
else{

    let correctSentences = [];

    currentQuestion.answers.forEach(
        pattern => {

            let sentence = "";

            currentQuestion.textParts.forEach(
                (part, i) => {

                    sentence += part;

                    if(i < pattern.length){
                        sentence += "【" + pattern[i] + "】";
                    }

                }
            );

            correctSentences.push(sentence);

        }
    );

    correctSentences =
        [...new Set(correctSentences)];

    correctAnswerText +=
        "あなたの答え：\n" +
        userAnswerText +
        "\n\n正しい答え：\n" +
        correctSentences.join("\n");

}


// 重複削除
alternativeAnswers =
    [...new Set(alternativeAnswers)];


    // =========================
    // ポップアップ表示
    // =========================

    showExplanation(
        correct,
        correctAnswerText,
        explanationText
    );

    if(correct && currentEnemy.hp <= 0){

    // =========================
    // 敵撃破
    // =========================

    enemyCount++;

    exp += 30;

    // =========================
    // レベルアップ
    // =========================

    // 変更前の最大HPを保存
const oldMaxHp = maxHp;


// =========================
// レベルアップ
// =========================

while(exp >= expToNext){

    exp -= expToNext;

    level++;

    expToNext =
        Math.floor(
            expToNext * 1.3
        );

    alert(
        "レベルアップ！ Lv" +
        level
    );
}


// =========================
// 必殺技解放
// =========================

if(level >= 5){
    specialUnlocked = true;
}


// =========================
// 仲間加入判定
// =========================

checkJoinCharacters();


// =========================
// レベルアップ＋仲間分を反映
// =========================

// 新しいレベル・新しい仲間で
// 最大HPを再計算
recalculatePartyStatus();

// 最大HPがどれだけ増えたか
const hpIncrease =
    maxHp - oldMaxHp;

// 増えた最大HP分だけ現在HPも回復
if(hpIncrease > 0){

    playerHp += hpIncrease;

    if(playerHp > maxHp){
        playerHp = maxHp;
    }
}

    createEnemy();
}
else{

    // まだ敵が生きている場合
    updateEnemy();
}

updatePlayer();
saveGame();

    // ========================================
// ゲームオーバー処理
// アカウントと学習記録を残す
// ========================================

if (playerHp <= 0) {

    alert(
        "ゲームオーバー！\n" +
        "学習記録は保存されています。\n" +
        "ホーム画面から復習できます！"
    );

    // HPを最大まで回復
    playerHp = maxHp;

    // コンボをリセット
    combo = 0;

    // 必殺技ゲージをリセット
    specialGauge = 0;

    // 倒された敵をリセット
    currentEnemy = null;

    // アカウント情報を保存
    saveGame();

    // ホーム画面に戻る
    location.href = "index.html";

    return;
}
}

// =========================
// 答え・解説作成
// =========================

function createAnswerText(){

    let resultText = "";

    let answerTexts = [];

    currentQuestion.answers.forEach(pattern=>{

        let text = "";

        currentQuestion.textParts.forEach(
            (part,i)=>{

                text += part;

                if(i < pattern.length){
                    text += pattern[i];
                }

            }
        );

        answerTexts.push(text);
    });

    answerTexts =
        [...new Set(answerTexts)];

    resultText += "\n答え：\n";
    resultText += answerTexts[0] + "\n";

    if(answerTexts.length > 1){

        resultText += "\n別解：\n";

        for(
            let i=1;
            i<answerTexts.length;
            i++
        ){

            resultText +=
                answerTexts[i] + "\n";
        }
    }

    resultText += "\n解説：\n";

    if(currentQuestion.explain_child){

        currentQuestion
        .explain_child
        .forEach(obj=>{

            const key =
                Object.keys(obj)[0];

            resultText +=
                obj[key] + "\n";

        });
    }

    return resultText;
}

// =========================
// 仲間加入
// =========================

function checkJoinCharacters(){

    if (mode === "review") {
        return;
    }
    
    const firstElements = [
        "火",
        "水",
        "地"
    ];

    const otherElements =
        firstElements.filter(
            element =>
                element !== playerElement
        );

    const joinGuideText =
        "\n「ホームに戻る」を押して、仲間を設定しよう！";

    // =========================
    // 5体撃破 → 最初に選ばなかった属性①
    // =========================
    if(
        enemyCount >= 5 &&
        otherElements[0] &&
        !ownedCharacters.includes(otherElements[0])
    ){
        ownedCharacters.push(otherElements[0]);
        alert(otherElements[0] + "属性が仲間になった！" + joinGuideText);
    }

    // =========================
    // 10体撃破 → 最初に選ばなかった属性②
    // =========================
    if(
        enemyCount >= 10 &&
        otherElements[1] &&
        !ownedCharacters.includes(otherElements[1])
    ){
        ownedCharacters.push(otherElements[1]);
        alert(otherElements[1] + "属性が仲間になった！" + joinGuideText);
    }

    // =========================
    // 15体撃破 → 風
    // =========================
    if(
        enemyCount >= 15 &&
        !ownedCharacters.includes("風") &&
        playerElement !== "風"
    ){
        ownedCharacters.push("風");
        alert("風属性が仲間になった！" + joinGuideText);
    }

    // =========================
    // 30体撃破 → 雷
    // =========================
    if(
        enemyCount >= 30 &&
        !ownedCharacters.includes("雷") &&
        playerElement !== "雷"
    ){
        ownedCharacters.push("雷");
        alert("雷属性が仲間になった！" + joinGuideText);
    }

    // =========================
    // 50体撃破 → 光
    // =========================
    if(
        enemyCount >= 50 &&
        !ownedCharacters.includes("光") &&
        playerElement !== "光"
    ){
        ownedCharacters.push("光");
        alert("光属性が仲間になった！" + joinGuideText);
    }

    // =========================
    // 70体撃破 → 闇
    // =========================
    if(
        enemyCount >= 70 &&
        !ownedCharacters.includes("闇") &&
        playerElement !== "闇"
    ){
        ownedCharacters.push("闇");
        alert("闇属性が仲間になった！" + joinGuideText);
    }

    recalculatePartyStatus();
    updatePlayer();
    saveGame();
}

// =========================
// 攻撃アニメーション
// =========================

function playerAttackAnimation(){

    const player =
        document.getElementById("playerImage");

    if(!player){
        return;
    }

    player.classList.remove("playerAttack");

    // アニメーションを確実に再実行
    void player.offsetWidth;

    player.classList.add("playerAttack");

    setTimeout(function(){

        player.classList.remove("playerAttack");

    },500);

}


// =========================
// 敵の被弾アニメーション
// =========================

function enemyDamageAnimation(){

    const enemy =
        document.getElementById("enemyImage");

    if(!enemy){
        return;
    }

    enemy.classList.remove("enemyDamage");

    // アニメーションを確実に再実行
    void enemy.offsetWidth;

    enemy.classList.add("enemyDamage");

    setTimeout(function(){

        enemy.classList.remove("enemyDamage");

    },500);

}

// =========================
// 味方の被ダメージアニメーション
// =========================

function playerDamageAnimation(){

    const player =
        document.getElementById("playerImage");

    if(!player){
        return;
    }

    player.classList.remove("playerDamage");

    // アニメーションを確実に再実行
    void player.offsetWidth;

    player.classList.add("playerDamage");

    setTimeout(function(){
        player.classList.remove("playerDamage");
    },500);

}

// =========================
// ホームに戻る
// =========================

async function goHome(){

    // 現在の状態を保存が終わるまで待つ
    await saveGame();

    // ホームへ戻る
    location.href = "index.html";
}

// ========================================
// iPad・パソコン共通ドラッグ操作
// ========================================

let activeDrag = null;

function finishDrag() {

    if (!activeDrag) return;

    activeDrag.ghost.remove();

    activeDrag = null;
}

document.addEventListener("pointerdown", function(e) {

    if (e.pointerType === "mouse" && e.button !== 0) {
        return;
    }

    const choice = e.target.closest(".choice");

    if (!choice) return;

    e.preventDefault();

    // 前のドラッグが残っていたら片付ける
    finishDrag();

    const ghost = choice.cloneNode(true);

    ghost.style.position = "fixed";
    ghost.style.zIndex = "99999";
    ghost.style.pointerEvents = "none";
    ghost.style.opacity = "0.85";
    ghost.style.margin = "0";
    ghost.style.left = e.clientX + "px";
    ghost.style.top = e.clientY + "px";
    ghost.style.transform = "translate(-50%, -50%)";

    document.body.appendChild(ghost);

    activeDrag = {
        pointerId: e.pointerId,
        value: choice.textContent,
        ghost: ghost
    };

    choice.setPointerCapture(e.pointerId);

});

document.addEventListener("pointermove", function(e) {

    if (!activeDrag) return;

    if (e.pointerId !== activeDrag.pointerId) {
        return;
    }

    activeDrag.ghost.style.left = e.clientX + "px";
    activeDrag.ghost.style.top = e.clientY + "px";

});

document.addEventListener("pointerup", function(e) {

    if (!activeDrag) return;

    if (e.pointerId !== activeDrag.pointerId) {
        return;
    }

    const target = document.elementFromPoint(
        e.clientX,
        e.clientY
    );

    const drop = target?.closest(".drop");

    if (drop) {

        drop.textContent = activeDrag.value;
        drop.dataset.value = activeDrag.value;

    }

    finishDrag();

});

document.addEventListener("pointercancel", function(e) {

    if (
        activeDrag &&
        e.pointerId === activeDrag.pointerId
    ) {
        finishDrag();
    }

});

// ========================================
// 解答ログ記録＆CSVダウンロード機能
// ========================================

function recordAnswerLog(logEntry) {
    // 1. プレイヤー別のローカルストレージに追記保存
    const logKey = "answerLogs_" + logEntry.playerName;
    const logs = JSON.parse(localStorage.getItem(logKey) || "[]");
    logs.push(logEntry);
    localStorage.setItem(logKey, JSON.stringify(logs));

    // 2. クラウド（Firebase Firestore: answerLogs）に保存
    if (window.saveAnswerLogToCloud) {
        window.saveAnswerLogToCloud(logEntry);
    }
}

// 端末内の全プレイヤーの解答ログをCSVでダウンロードする関数
function downloadAllLogsCSV() {
    const allLogs = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("answerLogs_")) {
            try {
                const userLogs = JSON.parse(localStorage.getItem(key) || "[]");
                allLogs.push(...userLogs);
            } catch (e) {
                console.error("ログ読み込みエラー:", key, e);
            }
        }
    }

    if (allLogs.length === 0) {
        alert("保存されている解答ログがまだありません。");
        return;
    }

    // 日時順に並び替え
    allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const headers = [
        "ユーザー名",
        "モード",
        "解いた順番",
        "問題ID",
        "問題文",
        "正解",
        "選んだ助詞",
        "正誤(1=正解,0=不正解)",
        "解答時間(秒)",
        "解答時間(ミリ秒)",
        "日時"
    ];

    const escapeCsv = (val) => {
        const str = String(val ?? "");
        return '"' + str.replaceAll('"', '""') + '"';
    };

    const rows = allLogs.map(log => [
        escapeCsv(log.playerName),
        escapeCsv(log.mode),
        escapeCsv(log.solveNumber),
        escapeCsv(log.questionId),
        escapeCsv(log.sentence),
        escapeCsv(log.correctAnswers),
        escapeCsv(log.userAnswer),
        escapeCsv(log.isCorrect ? 1 : 0),
        escapeCsv(log.responseTimeSec),
        escapeCsv(log.responseTimeMs),
        escapeCsv(log.timestamp)
    ].join(","));

    // Excelで文字化けしないようBOM付きUTF-8で出力
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `joshi_rpg_logs_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ========================================
// バトル中にいつでも遊び方・ルールを開く
// ========================================
function openHelpModal() {
    const overlay = document.getElementById("tutorialOverlay");
    const closeButton = document.getElementById("tutorialClose");
    const timer = document.getElementById("tutorialTimer");

    if (!overlay || !closeButton) return;

    if (timer) {
        timer.innerHTML = "<ruby>確認<rt>かくにん</rt></ruby>できたら<ruby>閉<rt>と</rt></ruby>じてバトルに<ruby>戻<rt>もど</rt></ruby>ろう！";
    }

    closeButton.disabled = false;
    closeButton.innerHTML = "<ruby>閉<rt>と</rt></ruby>じる";

    overlay.style.display = "flex";

    closeButton.onclick = function() {
        overlay.style.display = "none";
        closeButton.innerHTML = "<ruby>ゲーム<rt></rt></ruby>を<ruby>始<rt>はじ</rt></ruby>める";
    };
}