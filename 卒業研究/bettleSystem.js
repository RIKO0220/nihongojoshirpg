const elementTable = {

    火:{ strong:["風","地"], weak:["水"] },

    水:{ strong:["火"], weak:["雷","地"] },

    地:{ strong:["水","雷"], weak:["風","火"] },

    風:{ strong:["地","雷"], weak:["火"] },

    雷:{ strong:["水","風"], weak:["地"] },

    光:{ strong:["闇"], weak:["闇"] },

    闇:{ strong:["光"], weak:["光"] }
};

function getElementMultiplier(attacker,defender){

    const data = elementTable[attacker];

    if(data.strong.includes(defender)){
        return 1.5;
    }

    if(data.weak.includes(defender)){
        return 0.5;
    }

    return 1.0;
}

function calculateDamage(
    attack,
    attackerElement,
    defenderElement,
    combo,
    special
){

    let damage = attack;

    damage *= getElementMultiplier(
        attackerElement,
        defenderElement
    );

    damage *= 1 + combo * 0.1;

    if(special){
        damage *= 3;
    }

    damage *= Math.random() * 0.2 + 0.9;

    return Math.floor(damage);
}