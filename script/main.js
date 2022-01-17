"use strict";

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

class Mushroom extends Entity{
  constructor(x,y){
    super(x,y,"Mushroom")
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
    this.fragWallList = [];
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
}

const game = new Game();
