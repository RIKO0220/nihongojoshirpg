// convert.js（最終完成版）

const fs = require("fs");

// ===== 設定 =====
const INPUT_FILE = "data.csv";
const OUTPUT_FILE = "questions.json";

// ===== CSV読み込み =====
const raw = fs.readFileSync(INPUT_FILE, "utf-8");

// 改行で分割
const lines = raw.trim().split(/\r?\n/);

// ヘッダ
const headers = lines[0].split(",");

// データ
const rows = lines.slice(1);

const result = [];

// ===== 変換処理 =====
rows.forEach((line, index) => {
    const cols = line.split(",");

    let q = {};
    headers.forEach((h, i) => {
        q[h.trim()] = (cols[i] || "").trim();
    });

    // ===== 文（助詞を除く）=====
    const textParts = [];
    if(q["名詞1"]) textParts.push(q["名詞1"]);
    if(q["名詞2"]) textParts.push(q["名詞2"]);
    if(q["名詞3"]) textParts.push(q["名詞3"]);
    if(q["動詞"]) textParts.push(q["動詞"]);

    // ===== 解答＆解説 =====
    const answers = [];
    const explain_child = [];

    ["助詞1","助詞2","助詞3"].forEach(key => {
        if(q[key]){
            // 複数解答（へ|に）
            const parts = q[key].split("|").map(s => s.trim());

            // answers
            answers.push(parts);

            // explain（穴ごと）
            let explainSet = {};
            parts.forEach(p => {
                explainSet[p] = q["子ども用解説"] || "";
            });

            explain_child.push(explainSet);
        }
    });

    // ===== 結果 =====
    result.push({
        id: Number(q["番号"]) || index + 1,
        textParts,
        answers,
        explain_child,
        explain_adult: q["大人用解説"] || ""
    });
});

// ===== JSON化 =====
let json = JSON.stringify(result, null, 2);

// ===== answers を1行化 =====
json = json.replace(
    /\[\s+"(.*?)"\s+\]/g,
    '["$1"]'
);

// ===== explain_child を1行化 =====
json = json.replace(
    /\{\s+"(.*?)":\s+"(.*?)"\s+\}/g,
    '{ "$1": "$2" }'
);

// ===== 保存 =====
fs.writeFileSync(OUTPUT_FILE, json, "utf-8");

console.log("変換完了！ questions.json を確認してください");