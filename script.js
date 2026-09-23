// =========================
// 問題
// =========================

let questions = [];
let currentQuestion = null;
let draggingEl = null;
let answered = false;

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
// 敵生成
// =========================

function createEnemy(){

    if(
        enemyCount > 0 &&
        enemyCount % 10 === 0
    ){
        const bossIndex =
            Math.floor(enemyCount / 10) - 1;

        currentEnemy =
            cloneObject(
                bosses[
                    bossIndex % bosses.length
                ]
            );
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
    }

    updateEnemy();
}

// =========================
// 敵表示
// =========================

function updateEnemy(){

    if(!currentEnemy){
        return;
    }

    document
    .getElementById("enemyImage")
    .src =
    currentEnemy.image;

    document
    .getElementById("enemyInfo")
    .innerHTML =
    `
    ${currentEnemy.name}<br>
    属性：${currentEnemy.element}<br>
    HP：${currentEnemy.hp}
    `;
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
    `
    名前：${playerName}<br>
    属性：${playerElement}<br>
    Lv：${level}<br>
    攻撃力：${attackPower}<br>
    コンボ：${combo}<br>
    撃破数：${enemyCount}<br>
    仲間：${friendText}
    `;

    document
    .getElementById("solveCount")
    .textContent =
    "解いた問題数：" + solveCount;

    // =========================
// 仲間画像表示
// =========================

const friendImages =
    document.getElementById("friendImages");

if(friendImages){

    friendImages.innerHTML = "";

    ownedCharacters.forEach(character => {

        let image = "";

        switch(character){

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

        if(image){

            const img =
                document.createElement("img");

            img.src = image;

            img.className =
                "friendCharacterImage";

            img.alt =
                character + "属性の仲間";

            friendImages.appendChild(img);

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
}

// =========================
// セーブ
// =========================

// =========================
// セーブ
// =========================

function saveGame(){

    const saveData = {

        // ユーザー名
        playerName,

        // プレイヤー情報
        playerElement,

        level,
        exp,
        expToNext,

        playerHp,
        maxHp,
        attackPower,

        enemyCount,
        solveCount,
        combo,

        // =========================
        // キャラクター情報
        // =========================

        // 今まで獲得した全キャラクター
        ownedCharacters,

        // 現在一緒に戦っているキャラクター
        partyCharacters,

        // =========================
        // 必殺技
        // =========================

        specialGauge,
        specialUnlocked,

        // =========================
        // 敵
        // =========================

        currentEnemy

    };


    localStorage.setItem(
        "save_" + playerName,
        JSON.stringify(saveData)
    );

}


// =========================
// 初期所持キャラクター読み込み
// =========================
//
// 新規ユーザー用
//
// 例：
// initialCharacters_りこ
// ↓
// ["風","光"]
//
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

    partyCharacters =
        [
            ...ownedCharacters
        ];

}


// =========================
// ロード
// =========================

function loadGame(){

    const rawData =
        localStorage.getItem(
            "save_" + playerName
        );


    // =========================
    // 保存データがない
    // =========================
    //
    // → 新規ユーザー
    //
    // =========================

    if(!rawData){

        loadInitialCharacters();

        return false;

    }


    // =========================
    // 保存データあり
    // =========================

    let data;


    try{

        data =
            JSON.parse(rawData);

    }
    catch(error){

        console.error(
            "セーブデータの読み込みに失敗しました",
            error
        );

        return false;

    }


    // =========================
    // プレイヤー情報
    // =========================

    playerElement =
        data.playerElement
        ?? "火";


    level =
        data.level
        ?? 1;


    exp =
        data.exp
        ?? 0;


    expToNext =
        data.expToNext
        ?? 100;


    playerHp =
        data.playerHp
        ?? 150;


    maxHp =
        data.maxHp
        ?? 150;


    attackPower =
        data.attackPower
        ?? 25;


    enemyCount =
        data.enemyCount
        ?? 0;


    solveCount =
        data.solveCount
        ?? 0;


    combo =
        data.combo
        ?? 0;


    // =========================
    // 所持キャラクター
    // =========================

    if(
        Array.isArray(
            data.ownedCharacters
        )
    ){

        ownedCharacters =
            [
                ...data.ownedCharacters
            ];

    }
    else{

        ownedCharacters = [];

    }


    // =========================
    // 現在のパーティ
    // =========================

    if(
        Array.isArray(
            data.partyCharacters
        )
    ){

        partyCharacters =
            [
                ...data.partyCharacters
            ];

    }
    else{

        // 古いセーブデータには
        // partyCharactersがないので、
        // 所持キャラをそのまま使用する

        partyCharacters =
            [
                ...ownedCharacters
            ];

    }


    // =========================
    // 必殺技
    // =========================

    specialGauge =
        data.specialGauge
        ?? 0;


    specialUnlocked =
        data.specialUnlocked
        ?? false;


    // =========================
    // 敵
    // =========================

    currentEnemy =
        data.currentEnemy
        ?? null;


    return true;

}

// =========================
// JSON読み込み
// =========================

fetch("questions.json")
.then(res => res.json())
.then(data=>{

    questions =
        data.filter(
            q => q.id <= 1179
        );

    if(mode === "review"){

        const saved =
            localStorage.getItem(
                "wrongQuestions"
            );

        if(saved){

            reviewQuestions =
                JSON.parse(saved);
        }
    }

    loadGame();

    recalculatePartyStatus();

    if(!currentEnemy){

        createEnemy();

    }
    else{

        updateEnemy();

    }

    updatePlayer();

    nextQuestion();

    showTutorial();

});

// =========================
// 次の問題
// =========================

function nextQuestion(){

    answered = false;

    document
    .getElementById("result")
    .textContent = "";

    document
    .getElementById("actionBtn")
    .textContent = "決定";

    if(mode === "review"){

        if(reviewQuestions.length === 0){

            document
            .getElementById("sentence")
            .innerHTML =
            "復習問題がありません";

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

        span.textContent = part;

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
// ドラッグ開始
// =========================

document.addEventListener(
"touchstart",
e=>{

    if(
        e.target.classList.contains("choice")
    ){

        draggingEl = e.target;

        draggingEl.classList.add("dragging");

        draggingEl.style.position = "fixed";
        draggingEl.style.zIndex = "9999";
    }

});

// =========================
// ドラッグ移動
// =========================

document.addEventListener(
"touchmove",
e=>{

    if(!draggingEl){
        return;
    }

    const touch =
        e.touches[0];

    draggingEl.style.left =
        (touch.clientX - 40) + "px";

    draggingEl.style.top =
        (touch.clientY - 40) + "px";

},
{passive:false}
);

// =========================
// ドラッグ終了
// =========================

document.addEventListener(
"touchend",
e=>{

    if(!draggingEl){
        return;
    }

    const touch =
        e.changedTouches[0];

    document
    .querySelectorAll(".drop")
    .forEach(drop=>{

        const rect =
            drop.getBoundingClientRect();

        if(
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
        ){

            drop.textContent =
                draggingEl.textContent;

            drop.dataset.value =
                draggingEl.textContent;
        }

    });

    draggingEl.classList.remove("dragging");

    draggingEl.style.position = "";
    draggingEl.style.left = "";
    draggingEl.style.top = "";

    draggingEl = null;

});

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

    updateEnemy();
    updatePlayer();
    saveGame();
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

                timer.textContent =
                    "説明を読み終えたら始めよう！";

                closeButton.disabled =
                    false;

            }

        },1000);


    // ゲーム開始

    closeButton.onclick =
        function(){

            overlay.style.display =
                "none";

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

    if(correct){

        title.textContent =
            "⭕ 正解！";

    }else{

        title.textContent =
            "❌ 不正解";

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
        "答え：\n" +
        answerText +
        "\n\n";


    message +=
        "【解説】\n" +
        explanationText;


    text.textContent =
        message;


    // =========================
    // 表示
    // =========================

    overlay.style.display =
        "flex";


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

                timer.textContent =
                    "解説を読み終えたら次へ進もう！";

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

        let damage =
            attackPower +
            combo * 5;

        damage =
            Math.floor(
                damage *
                getElementMultiplier(
                    playerElement,
                    currentEnemy.element
                )
            );

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

        let savedWrong =
            JSON.parse(
                localStorage.getItem(
                    "wrongQuestions"
                ) || "[]"
            );

        savedWrong.push(currentQuestion);

        localStorage.setItem(
            "wrongQuestions",
            JSON.stringify(savedWrong)
        );
    }

    resultText += createAnswerText();

    document
    .getElementById("result")
    .textContent =
    resultText;


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
    // 正解文を作る
    // =========================

    let correctAnswerText = "";

    currentQuestion.textParts.forEach((part, i) => {

        correctAnswerText += part;

        if(i < currentQuestion.answers[0].length){
            correctAnswerText +=
                currentQuestion.answers[0][i];
        }

    });


    // =========================
    // ポップアップ表示
    // =========================

    showExplanation(
        correct,
        correctAnswerText,
        explanationText
    );


    if(currentEnemy.hp <= 0){

        enemyCount++;

        exp += 30;

        while(exp >= expToNext){

            exp -= expToNext;

            level++;

            expToNext =
                Math.floor(
                    expToNext * 1.3
                );

            playerHp = maxHp;

            alert(
                "レベルアップ！ Lv" +
                level
            );
        }

        if(level >= 5){
            specialUnlocked = true;
        }

        checkJoinCharacters();

        recalculatePartyStatus();
    }

    updateEnemy();
    updatePlayer();
    saveGame();

    if(playerHp <= 0){

        alert("ゲームオーバー");

        localStorage.removeItem(
            "save_" + playerName
        );

        location.href = "index.html";
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

    if(
        enemyCount === 5 &&
        !ownedCharacters.includes("風")
    ){

        ownedCharacters.push("風");

        if(
        !partyCharacters.includes("風")
    ){

        partyCharacters.push("風");

    }

        alert("風属性が仲間になった！");
    }

    if(
        enemyCount === 15 &&
        !ownedCharacters.includes("雷")
    ){

        ownedCharacters.push("雷");

        if(
        !partyCharacters.includes("雷")
    ){

        partyCharacters.push("雷");

    }

        alert("雷属性が仲間になった！");
    }

    if(
        enemyCount === 30 &&
        !ownedCharacters.includes("光")
    ){

        ownedCharacters.push("光");

        if(
        !partyCharacters.includes("光")
    ){

        partyCharacters.push("光");

    }

        alert("光属性が仲間になった！");
    }

    if(
        enemyCount === 50 &&
        !ownedCharacters.includes("闇")
    ){

        ownedCharacters.push("闇");

        if(
        !partyCharacters.includes("闇")
    ){

        partyCharacters.push("闇");

    }

        alert("闇属性が仲間になった！");
    }
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