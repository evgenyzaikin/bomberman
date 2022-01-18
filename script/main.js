"use strict";


let game;

//базовое препятствие
class Barrier {
  constructor(x, y, isFragile, name) {
    this.x = x;
    this.y = y;
    this.isFragile = isFragile; //true, если разрушаем
    this.name = name;
  }
}

// бомба
class Bomb extends Barrier {
  constructor(x, y) {
    super(x, y, true, "Bomb");
    this.timer = 4; // время до взрыва
    this.blastList = []; // список взрывающихся ячеек
  }
  // возвращает ячейку если координаты корректны
  getCell(x, y) {
    if (x >= 0 && x < game.field[0].lenght && y >= 0 && y < game.field.length) {
      return game.field[x][y];
    }
    return null;
  }
  // проставляет в ячейки флаг взрыва, добавляет такие ячейки в blastList
  boom() {
    let cell = null;
    // +x
    for (let i = 0; i <= 2; i++) {
      cell = this.getCell(x + i, y);

      if (cell) {
        if (cell.barrier) {
          if (cell.barrier.isFragile == true) {
            cell.isBlast = true;
            this.blastList.add(cell);
            break;
          } else {
            break;
          }
        }

        cell.isBlast = true;
        this.blastList.add(cell);
      }
    }

    // -x
    for (let i = 0; i <= 2; i++) {
      cell = this.getCell(x - i, y);

      if (cell) {
        if (cell.barrier) {
          if (cell.barrier.isFragile == true) {
            cell.isBlast = true;
            this.blastList.add(cell);
            break;
          } else {
            break;
          }
        }

        cell.isBlast = true;
        this.blastList.add(cell);
      }
    }

    // +y
    for (let i = 0; i <= 2; i++) {
      cell = this.getCell(x, y + i);

      if (cell) {
        if (cell.barrier) {
          if (cell.barrier.isFragile == true) {
            cell.isBlast = true;
            this.blastList.add(cell);
            break;
          } else {
            break;
          }
        }

        cell.isBlast = true;
        this.blastList.add(cell);
      }
    }

    // -y
    for (let i = 0; i <= 2; i++) {
      cell = this.getCell(x, y - i);

      if (cell) {
        if (cell.barrier) {
          if (cell.barrier.isFragile == true) {
            cell.isBlast = true;
            this.blastList.add(cell);
            break;
          } else {
            break;
          }
        }

        cell.isBlast = true;
        this.blastList.add(cell);
      }
    }
  }
  // убирает флаги взрыва, очищает массив с "взорванными" ячейками
  clearBoom() {
    let cell = null;
    while (this.blastList.length > 0) {
      cell = this.blastList.pop();
      cell.isBlast = false;
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
    if (x >= 0 && x < game.field[0].lenght && y >= 0 && y < game.field.length) {
      return Boolean(game.field[x][y].barrier);
    }
    return false;
  }
  // переход на ячейку
  goToCell(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Mushroom extends Entity {
  constructor(x, y) {
    super(x, y, "Mushroom");
  }
}

class Hero extends Entity {
  constructor(x, y) {
    super(x, y, "Hero");
  }
  setBomb() {
    game.bombList.push(new Bomb(this.x, this.y));
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
}

class Game {
  constructor() {
    this.field = [];
    this.bombList = [];
    this.wallList = [];
    this.boxList = [];
    this.hero = new Hero(0, 0);
    this.mushList = [];
    this.initField(11, 9);
  }
  // инициализация игрового поля
  initField(width, height) {
    for (let i = 0; i < height; i++) {
      let row = [];
      for (let j = 0; j < width; j++) {
        row.push(new Cell(j, i));
      }
      this.field.push(row);
    }
  }
  // заполнение игрового поля
  fillField(numOfMushrooms, numOfBoxes) {
    // заполнение верхней строчки стенами
    for (let i = 0; i < game.field[0].lenght; i++) {
      let barr = new Barrier(i, 0, false, "Wall");
      game.field[i][0].barrier = barr;
      this.wallList.push(barr);
    }

    //заполнение нижней строчки стенами
    for (let i = 0; i < game.field[0].lenght; i++) {
      let barr = new Barrier(i, game.field[0].lenght - 1, false, "Wall");
      game.field[i][game.field[0].lenght - 1].barrier = barr;
      this.wallList.push(barr);
    }

    // заполнение левой колонны стенами
    for (let i = 0; i < game.field.lenght; i++) {
      let barr = new Barrier(0, i, false, "Wall");
      game.field[0][i].barrier = barr;
      this.wallList.push(barr);
    }

    // заполнение правой колонны стенами
    for (let i = 0; i < game.field.lenght; i++) {
      let barr = new Barrier(game.field.lenght - 1, i, false, "Wall");
      game.field[game.field.lenght - 1][i].barrier = barr;
      this.wallList.push(barr);
    }

    // заполнение игрового поля стенами
    for (let i = 2; i < game.field[0].lenght - 1; i++) {
      for (let j = 2; j < game.field.lenght - 1; i++) {
        if (i % 2 == 0 && j % 2 == 0) {
          let barr = new Barrier(i, j, false, "Wall");
          game.field[i][j].barrier = barr;
          this.wallList.push(barr);
        }
      }
    }

    // установка героя
    this.hero.x = 1;
    this.hero.y = 1;

    // установка ящиков
    for (let i = 2; i < game.field[0].lenght - 1; i += 2) {
      for (let j = 2; j < game.field.lenght - 1; i += 2) {
        this.setBoxes(i, j, 2);
      }
    }

    // установка грибов
    switch (numOfMushrooms) {
      case 4:
        this.setMushroom(5, 5);
      case 3:
        this.setMushroom(1, 7);
      case 2:
        this.setMushroom(9, 1);
      case 1:
        this.setMushroom(9, 7);
    }
  }
  // установка указанного количества ящиков(Box) в зоне 3*3
  setBoxes(x, y, numOfBoxes) {
    let dx = 0;
    let dy = 0;
    let i = numOfBoxes;
    let maxTryOfSet = numOfBoxes + 3;
    while (i) {
      dx = Math.floor(Math.random() * 3 - 1);
      dy = Math.floor(Math.random() * 3 - 1);
      if (game.field[x + dx][y + dy].barrier === null) {
        let box = new Barrier(x + dx, y + dy, true, "Box");
        game.field[x + dx][y + dy].barrier = box;
        game.boxList.push(box);
        i--;
      }
      maxTryOfSet--;
      if (maxTryOfSet == 0) {
        break;
      }
    }
  }
  // добавление гриба
  setMushroom(x, y) {
    let mushroom = new Mushroom(x, y);
    this.mushList.push(mushroom);
  }
}

game = new Game();
game.fillField(2,22);
