"use strict";

let game;
let view;
let directionKey = null;
let isPlantBomb = false;
const NUM_OF_COLUMN = 21; // 11
const NUM_OF_ROW = 17; // 9
const NUM_OF_LEVELS = 3;
const WIDTH_PX = 30;
const HEIGHT_PX = 30;
const TICK_INTERVAL = 250;
let isPause = true; //true если игра на паузе
let isMenu = true; //true если в меню (для отключения Esc)

//базовое препятствие
class Barrier {
    constructor(x, y, isFragile, name) {
        this.x = x;
        this.y = y;
        this.isFragile = isFragile; //true, если разрушаем
        this.name = name;
    }
    destroy() {
        view.deleteByObj(this);
    }
}

// бомба
class Bomb extends Barrier {
    constructor(x, y) {
        super(x, y, true, "Bomb");
        this.timer = 7; // время до взрыва
        this.blastList = []; // список объектов blast
        this.isExploded = false; //true если бомба была взорвана
    }

    // возвращает ячейку если координаты корректны
    getCell(x, y) {
        if (x >= 0 && x < game.field[0].length && y >= 0 && y < game.field.length) {
            return game.field[x][y];
        }
        return null;
    }

    // проверяет состояние бомбы, вызывает boom
    check() {
        if (this.timer == 0) {
            this.boom();
        }
        if (this.timer == -1) {
            // удалить из списков
            // удалить объект
            this.clearBoom();
        }
    }

    // добавляет в ячейки в blastList
    boom() {
        let cell = null;
        this.isExploded = true;
        this.timer = 0;
        cell = this.getCell(this.x, this.y);
        this.setBlast(cell);
        for (let dx of[-1, 0, 1]) {
            for (let dy of[-1, 0, 1]) {
                if ((Boolean(dx) && !Boolean(dy)) || (!Boolean(dx) && Boolean(dy))) {
                    for (let i = 1; i <= 2; i++) {
                        cell = this.getCell(this.x + dx * i, this.y + dy * i);
                        if (cell) {
                            if (cell.barrier) {
                                if (cell.barrier.isFragile == true) {
                                    this.setBlast(cell);
                                    break;
                                } else {
                                    break;
                                }
                            } else {
                                this.setBlast(cell);
                            }
                        }
                    }
                }
            }
        }
    }
    setBlast(cell) {
        let blast = new Blast(cell.x, cell.y);
        this.blastList.push(blast);
        view.createLink(blast);
        game.cellExplosion(cell);
    }

    // очищает массив с "взорванными" ячейками
    clearBoom() {
        view.deleteByObj(this);
        let idx = game.bombList.indexOf(this);
        game.bombList.splice(idx, 1);
        this.getCell(this.x, this.y).barrier = null;
        let blast = null;
        while (this.blastList.length > 0) {
            blast = this.blastList.pop();
            view.deleteNodeByObj(blast);
            let idx = view.blastList.indexOf(blast);
            view.blastList.splice(idx, 1);
        }
    }
}

//базовая сущность
class Entity {
    constructor(x, y, name) {
            this.x = x;
            this.y = y;
            this.name = name;
        }
        // проверка ячейки на возможность перехода
    checkCell(x, y) {
            if (x >= 0 && x < game.field[0].length && y >= 0 && y < game.field.length) {
                return !Boolean(game.field[x][y].barrier);
            }
            return false;
        }
        // переход на ячейку
    goToCell(x, y) {
            this.x = x;
            this.y = y;
        }
        // переход на ячейку с проверкой возможности перехода
    move(dx, dy) {
        if (this.checkCell(this.x + dx, this.y + dy)) {
            this.goToCell(this.x + dx, this.y + dy);
        }
    }
}

class Mushroom extends Entity {
    constructor(x, y) {
        super(x, y, "Mushroom");
    }
    doMove() {
        let min = -1; //Math.floor(Math.random() * (max - min + 1) + min)
        let max = 1;
        let dx = 0;
        let dy = 0;
        if (Math.floor(Math.random() * (1 - 0 + 1) + 0) == 0) {
            dx = Math.floor(Math.random() * (max - min + 1) + min);
        } else {
            dy = Math.floor(Math.random() * (max - min + 1) + min);
        }
        this.move(dx, dy);

        if (this.x == game.hero.x && this.y == game.hero.y) {
            game.hero.kill();
        }
    }
    kill() {
        view.deleteByObj(this);
        let idx = game.mushList.indexOf(this);
        game.mushList.splice(idx, 1);
        game.score += 200;
        if (game.mushList.length == 0) {
            game.passLevel();
        }
    }
}

class Hero extends Entity {
    constructor(x, y) {
        super(x, y, "Hero");
    }
    setBomb() {
        if (game.field[this.x][this.y].barrier == null) {
            let bomb = new Bomb(this.x, this.y);
            game.field[this.x][this.y].barrier = bomb;
            game.bombList.push(bomb);
            view.createLink(bomb);
        }
    }
    doMove() {
        switch (directionKey) {
            case "KeyA":
                this.move(-1, 0);
                break;
            case "KeyD":
                this.move(1, 0);
                break;
            case "KeyW":
                this.move(0, -1);
                break;
            case "KeyS":
                this.move(0, 1);
                break;
            default:
                break;
        }
    }
    kill() {
        console.log("Hero kill " + Date.now());
        game.heroKill();
    }
}

// взрывная волна
class Blast extends Entity {
    constructor(x, y) {
        super(x, y, "Blast");
    }
}

// ячейка, из которых складывается игровое поле
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.barrier = null;
        this.isBlast = false;
    }
    destroyBarrier() {
        if (this.barrier && this.barrier.isFragile == true) {
            this.barrier.destroy();

            let idx = game.boxList.indexOf(this.barrier);
            if (idx >= 0) {
                game.boxList.splice(idx, 1);
            }

            this.barrier = null;

            game.score += 10;
        }
        for (const mush of game.mushList) {
            if (this.x == mush.x && this.y == mush.y) {
                mush.kill();
            }
        }
        for (const bomb of game.bombList) {
            if (this.x == bomb.x && this.y == bomb.y) {
                if (bomb.isExploded == false) bomb.boom();
            }
        }
        if (this.x == game.hero.x && this.y == game.hero.y) {
            game.hero.kill();
        }
    }
}

class Game {
    constructor() {
            this.init();
        }
        //устанавливает состояние игры в начале игры
    init() {
            this.field = [];
            this.bombList = [];
            this.wallList = [];
            this.boxList = [];
            this.hero = null;
            this.mushList = [];
            this.initField(NUM_OF_COLUMN, NUM_OF_ROW);
            this.tickPassed = 1;
            this.timeLeft = 150;
            this.heroLives = 3;
            this.score = 0;
            this.level = 1;
        }
        // устанавливает уровень
    setLevel(level) {
            this.hero = new Hero(1, 1);
            switch (level) {
                case 1:
                    this.fillField(2);
                    break;
                case 2:
                    this.fillField(3);
                    break;
                case 3:
                    this.fillField(4);
                    break;
                default:
                    break;
            }
        }
        // очищает уровень
    clearLevel() {
        this.field = [];
        this.initField(NUM_OF_COLUMN, NUM_OF_ROW);
        this.bombList = [];
        this.wallList = [];
        this.boxList = [];
        this.hero = null;
        this.mushList = [];
        this.tickPassed = 1;
        this.timeLeft = 150;
    }

    // инициализация игрового поля
    initField(width, height) {
            for (let i = 0; i < width; i++) {
                let row = [];
                for (let j = 0; j < height; j++) {
                    row.push(new Cell(i, j));
                }
                this.field.push(row);
            }
        }
        // заполнение игрового поля
    fillField(numOfMushrooms) {
        // установка стен по краям игрового поля
        this.setHorizontalWalls();
        this.setVerticalWalls();

        // заполнение игрового поля стенами
        for (let i = 2; i < NUM_OF_COLUMN - 1; i += 2) {
            for (let j = 2; j < NUM_OF_ROW - 1; j += 2) {
                this.setWall(i, j);
            }
        }

        // установка героя
        this.hero.x = 1;
        this.hero.y = 1;

        // установка ящиков
        this.setBoxes(4, 5);

        // установка ящиков
        // установка грибов
        switch (numOfMushrooms) {
            case 4:
                this.setMushroom(5, 5);
            case 3:
                this.setMushroom(1, 7);
            case 2:
                this.setMushroom(8, 2);
            case 1:
                this.setMushroom(8, 6);
        }
    }

    // Установка горизонтальных стен по краям карты
    setHorizontalWalls() {
        for (let i = 0; i < NUM_OF_COLUMN; i++) {
            this.setWall(i, 0);
            this.setWall(i, NUM_OF_ROW - 1);
        }
    }

    // Установка вертикальных стен по краям карты.
    // Угловые стены устанавливаются в методе setHorizontalWalls
    setVerticalWalls() {
        for (let i = 1; i < NUM_OF_ROW - 1; i++) {
            this.setWall(0, i);
            this.setWall(NUM_OF_COLUMN - 1, i);
        }
    }

    // установка стены по координатам
    setWall(x, y) {
        let wall = new Barrier(x, y, false, "Wall");
        this.field[x][y].barrier = wall;
        this.wallList.push(wall);
        return wall;
    }

    // установка ящиков(Box)
    setBoxes(even, odd) {
        for (let i = 1; i < NUM_OF_COLUMN - 1; i++) {
            let x = i;
            let j = x % 2 == 0 ? even : odd;

            while (j) {
                let rndY = Math.floor(Math.random() * NUM_OF_ROW);
                // условие для гарантированного свободного места для спавна героя
                if (x >= 1 && x <= 2 && rndY >= 1 && rndY <= 2) {
                    continue;
                }
                if (this.field[x][rndY].barrier === null) {
                    let box = new Barrier(x, rndY, true, "Box");
                    this.field[x][rndY].barrier = box;
                    this.boxList.push(box);
                    j--;
                }
            }
        }
    }

    // добавление гриба в зоне 3*3
    setMushroom(x, y) {
        for (let dy of[1, 0, -1]) {
            for (let dx of[1, 0, -1]) {
                if (this.field[x + dx][y + dy].barrier === null) {
                    let mushroom = new Mushroom(x + dx, y + dy);
                    this.mushList.push(mushroom);
                    return mushroom;
                }
            }
        }
    }

    bombUpdate() {
        for (const bomb of this.bombList) {
            bomb.check();
            bomb.timer -= 1;
        }
    }

    cellExplosion(cell) {
        cell.destroyBarrier();
    }

    decreaseTime() {
        if (isPause == false) {
            this.timeLeft--;
            if (this.timeLeft == 0) {
                this.heroKill();
            }
        }
    }

    heroKill() {
        this.heroLives -= 1;
        if (this.heroLives > 0) {
            // загрузка того же лвла
            showKillMenu();
        }
        if (this.heroLives == 0) {
            // конец игры
            showLostMenu();
        }
    }

    passLevel() {
        this.level += 1;
        if (this.level > NUM_OF_LEVELS) {
            showWinMenu();
        } else {
            showPassMenu();
        }
    }

    tick() {
        if (isPause == false) {
            this.tickPassed += 1;
            this.hero.doMove();
            for (const mush of this.mushList) {
                mush.doMove();
            }
            this.bombUpdate();
            view.redraw();
        }
    }
}

// описание связи между элементом(Entity или Barrier) и Node
class ObjNodeLink {
    constructor(obj, node) {
        this.obj = obj;
        this.node = node;
    }
}

// отрисовка и перерисовка
class View {
    constructor() {
        this.bombList = [];
        this.blastList = [];
        this.wallList = [];
        this.boxList = [];
        this.hero = [];
        this.mushList = [];
        this.changeList = [];
        this.fieldWrap = document.querySelector(".game-field");
        this.timeLeft = document.querySelector(".time-left");
        this.heroLives = document.querySelector(".hero-lives");
        this.score = document.querySelector(".score");
        this.level = document.querySelector(".intro .title");
        this.killMsg = document.querySelector(".kill-menu .title");
        this.passMsg = document.querySelector(".pass-menu .title");
        this.lostMsg = document.querySelector(".lost-menu .title");
        this.winMsg = document.querySelector(".win-menu .title");
    }
    init() {
            this.fieldWrap.style.height = (HEIGHT_PX * NUM_OF_ROW).toString() + "px";
            this.fieldWrap.style.width = (WIDTH_PX * NUM_OF_COLUMN).toString() + "px";
            for (const col of game.field) {
                for (const cell of col) {
                    this.createLink(cell.barrier);
                }
            }
            for (const obj of game.mushList) {
                this.createLink(obj);
            }
            this.createLink(game.hero);
        }
        // создаёт node, создаёт связь между node и элементом,
        // заносит связь в соответствующий массив
    createLink(obj) {
        if (!obj) {
            return;
        }
        let item = document.createElement("div");
        let link = new ObjNodeLink(obj, item);
        this.fieldWrap.appendChild(item);

        if (obj.name) {
            switch (obj.name) {
                case "Wall":
                    item.classList.add("wall");
                    this.wallList.push(link);
                    break;
                case "Box":
                    item.classList.add("f-wall");
                    this.boxList.push(link);
                    break;
                case "Mushroom":
                    item.classList.add("mushroom");
                    this.mushList.push(link);
                    break;
                case "Hero":
                    item.classList.add("hero");
                    this.hero = link;
                    break;
                case "Bomb":
                    item.classList.add("bomb");
                    this.bombList.push(link);
                    break;
                case "Blast":
                    item.classList.add("blast");
                    this.blastList.push(link);
                    break;
            }
        } else {
            return;
        }
        item.style.top = (HEIGHT_PX * obj.y).toString() + "px";
        item.style.left = (WIDTH_PX * obj.x).toString() + "px";
    }
    deleteByObj(obj) {
        let arr = null;
        if (!obj) {
            return;
        }
        switch (obj.name) {
            case "Box":
                arr = this.boxList;
                break;
            case "Mushroom":
                arr = this.mushList;
                break;
            case "Bomb":
                arr = this.bombList;
                break;
            case "Hero":
                this.deleteNodeByObj(obj);
                this.hero = null;
                break;
            case "Wall":
                arr = this.wallList;
                break;
                // скорее всего никогда не выполнится
            case "Blast":
                arr = this.blastList;
                break;
            default:
                break;
        }
        if (arr) {
            let link = this.getLink(obj);
            let idx = arr.indexOf(link);
            if (idx >= 0) {
                this.deleteNodeByObj(obj);
                arr.splice(idx, 1);
            }
        }
    }
    deleteNodeByObj(obj) {
            let link = this.getLink(obj);
            if (!link) {
                return;
            }
            this.fieldWrap.removeChild(link.node);
        }
        // возвращает link по obj либо null если связь не найдена
    getLink(obj) {
        if (this.hero.obj == obj) {
            return this.hero;
        }
        for (const link of this.mushList) {
            if (link.obj == obj) {
                return link;
            }
        }
        for (const link of this.bombList) {
            if (link.obj == obj) {
                return link;
            }
        }
        for (const link of this.blastList) {
            if (link.obj == obj) {
                return link;
            }
        }
        for (const link of this.wallList) {
            if (link.obj == obj) {
                return link;
            }
        }
        for (const link of this.boxList) {
            if (link.obj == obj) {
                return link;
            }
        }
        return null;
    }
    clear() {
        for (let i = 0, arr = this.boxList, n = arr.length; i < n; i++)
            this.deleteByObj(arr[0].obj);
        for (let i = 0, arr = this.mushList, n = arr.length; i < n; i++)
            this.deleteByObj(arr[0].obj);
        for (let i = 0, arr = this.bombList, n = arr.length; i < n; i++)
            this.deleteByObj(arr[0].obj);
        for (let i = 0, arr = this.wallList, n = arr.length; i < n; i++)
            this.deleteByObj(arr[0].obj);
        for (let i = 0, arr = this.blastList, n = arr.length; i < n; i++)
            this.deleteByObj(arr[0].obj);
        if (this.hero.obj) this.deleteByObj(this.hero.obj);
    }
    redraw() {
        // перерисовка строки состояния
        this.timeLeft.textContent = "Time: " + game.timeLeft;
        this.heroLives.textContent = "Жизни: " + game.heroLives;
        this.score.textContent = "Счёт: " + game.score;

        // перерисовка строк в меню
        this.level.textContent = "Уровень " + game.level;
        this.killMsg.textContent =
            "Вы погибли. У вас осталось " + game.heroLives + " жизней";
        this.passMsg.textContent = "Вы успешно прошли уровень";
        this.lostMsg.textContent =
            "Игра окончена, вы проиграли. Ваш результат: " + game.score + " очков.";
        this.winMsg.textContent =
            "Игра окончена, вы победили. Ваш результат: " + game.score + " очков.";

        // перерисовка героя
        this.hero.node.style.top = (HEIGHT_PX * this.hero.obj.y).toString() + "px";
        this.hero.node.style.left = (WIDTH_PX * this.hero.obj.x).toString() + "px";

        // перерисовка грибов
        for (const link of this.mushList) {
            link.node.style.top = (HEIGHT_PX * link.obj.y).toString() + "px";
            link.node.style.left = (WIDTH_PX * link.obj.x).toString() + "px";
        }

        // перерисовка бомб
        for (const link of this.bombList) {
            link.node.style.top = (HEIGHT_PX * link.obj.y).toString() + "px";
            link.node.style.left = (WIDTH_PX * link.obj.x).toString() + "px";
        }
    }
}

function setDirectionKey(event) {
    switch (event.code) {
        case "KeyA":
            directionKey = "KeyA";
            return;
            break;
        case "KeyD":
            directionKey = "KeyD";
            return;
            break;
        case "KeyW":
            directionKey = "KeyW";
            return;
            break;
        case "KeyS":
            directionKey = "KeyS";
            return;
            break;
        default:
            break;
    }
}

function tick() {
    game.tick();
}

function decreaseTime() {
    game.decreaseTime();
}

function setPause(event) {
    if (isMenu) {
        return;
    }
    if (event.code == "Escape") {
        if (isPause) {
            setAllNone();
            menu.gameWrap.style.display = "Block";
            isPause = false;
        } else {
            setAllNone();
            menu.gameWrap.style.display = "Block";
            menu.pauseMenu.style.display = "Block";
            isPause = true;
        }
    }
}

function resetDirectionKey(event) {
    directionKey = null;
}

function setBomb(event) {
    if (isPause == false && event.code == "Space" && event.repeat == false) {
        game.hero.setBomb();
    }
}

game = new Game();

view = new View();
//view.init();

let timerTick = setInterval(tick, TICK_INTERVAL);
let timerTimeLeft = setInterval(decreaseTime, 1000);

document.addEventListener("keydown", setDirectionKey);
document.addEventListener("keyup", resetDirectionKey);
document.addEventListener("keydown", setBomb);
document.addEventListener("keydown", setPause);

let menu = {
    mainMenu: document.querySelector(".main-menu"),
    enterName: document.querySelector(".enter-name"),
    gameWrap: document.querySelector(".game-wrapper"),
    tutorial: document.querySelector(".how-to-play"),
    pauseMenu: document.querySelector(".pause-menu"),
    intro: document.querySelector(".intro"),
    killMenu: document.querySelector(".kill-menu"),
    passMenu: document.querySelector(".pass-menu"),
    lostMenu: document.querySelector(".lost-menu"),
    winMenu: document.querySelector(".win-menu"),
};

function setAllNone() {
    for (const i in menu) {
        menu[i].style.display = "None";
    }
}

function levelLoad() {
    setAllNone();
    menu.gameWrap.style.display = "Block";
    isMenu = false;
    isPause = false;
    view.clear();
    game.clearLevel();
    game.setLevel(game.level);
    view.init();
}

function toMainAfterEndGame() {
    setAllNone();
    menu.mainMenu.style.display = "Block";
    game = new Game();
}

function levelTransition() {
    setAllNone();
    menu.intro.style.display = "Block";
    let introStrDiv = document.querySelector(".intro .title");
    introStrDiv.textContent = "Уровень " + game.level;
    setTimeout(levelLoad, 1500);
}

function showKillMenu() {
    setAllNone();
    menu.gameWrap.style.display = "Block";
    menu.killMenu.style.display = "Block";
    isMenu = true;
    isPause = true;
}

function showPassMenu() {
    setAllNone();
    menu.gameWrap.style.display = "Block";
    menu.passMenu.style.display = "Block";
    isMenu = true;
    isPause = true;
}

function showLostMenu() {
    setAllNone();
    menu.gameWrap.style.display = "Block";
    menu.lostMenu.style.display = "Block";
    isMenu = true;
    isPause = true;
}

function showWinMenu() {
    setAllNone();
    menu.gameWrap.style.display = "Block";
    menu.winMenu.style.display = "Block";
    isMenu = true;
    isPause = true;
}

let buttons = {
    newGame: document.querySelector(".new-game"),
    tutorial: document.querySelector(".tutorial"),
    fromTutorialToMain: document.querySelector(".from-tutorial-to-main"),
    pauseToGame: document.querySelector(".pause-to-game"),
    pauseToTutorial: document.querySelector(".pause-to-tutorial"),
    pauseToMain: document.querySelector(".pause-to-main"),
    loadLevel: document.querySelectorAll(".load-level"),
    toMain: document.querySelectorAll(".to-main"),
};

buttons.newGame.addEventListener("click", () => {
    game = new Game();
    levelTransition();
});

buttons.tutorial.addEventListener("click", () => {
    setAllNone();
    menu.tutorial.style.display = "Block";
});

buttons.fromTutorialToMain.addEventListener("click", () => {
    setAllNone();
    menu.mainMenu.style.display = "Block";
});

buttons.pauseToGame.addEventListener("click", () => {
    setAllNone();
    menu.gameWrap.style.display = "Block";
    isMenu = false;
    isPause = false;
});
buttons.pauseToTutorial.addEventListener("click", () => {
    setAllNone();
    menu.tutorial.style.display = "Block";
});
buttons.pauseToMain.addEventListener("click", () => {
    setAllNone();
    menu.mainMenu.style.display = "Block";
});

// кнопки, заданные через foreach
buttons.loadLevel.forEach((btn) => {
    btn.addEventListener("click", () => {
        levelTransition();
    });
});
buttons.toMain.forEach((btn) => {
    btn.addEventListener("click", () => {
        toMainAfterEndGame();
    });
});

setAllNone();
menu.mainMenu.style.display = "Block";