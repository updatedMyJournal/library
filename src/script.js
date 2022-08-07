'use strict';

let addButton = document.querySelector('.add');

class BookStorage extends Map {
  saveBook(bookObj) {
    this.set(bookObj.index, bookObj);
    this.#saveToLocalStorage();
  }

  deleteBook(bookObj) {
    this.delete(bookObj.index);
    this.#saveToLocalStorage();
  }

  #saveToLocalStorage() {
    localStorage.setItem('bookStorage', JSON.stringify(this));
  }

  toJSON() {
    return {
      class: "BookStorage",
      value: [...this]
    }
  }
}

class Book {
  constructor({author, title, pages, read, index} = {}) {
    this.author = author;
    this.title = title;
    this.pages = pages;
    this.read = read;
    this.index = index;
  }

  toJSON() {
    return {
      class: "Book",
      value: {...this}
    }
  }
}

let bookStorage = getFromLocalStorage() ?? new BookStorage();

function displayBookCards() {
  for (let book of bookStorage.values()) {
    createBookCard(book);
  }
}

function createBookCard({author, title, pages, read, index}) {
  addButton.insertAdjacentHTML('beforebegin', 
    `<div class="card" data-index=${index}>
      <div class="author">${author}</div>
      <div class="title">${title}</div>
      <div class="pages">${pages} page(s)</div>
      <button class="read${read ? " positive-read" : ""}">Read</button>
      <div class="buttons-wrapper">
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      </div>
     </div>`
  );
}

function getFromLocalStorage() {
  let str = localStorage.getItem('bookStorage');

  if (!str) return;

  let reviver = (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (value.class == 'BookStorage') {
        return new BookStorage(value.value);
      } else if (value.class == 'Book') {
        return new Book(value.value);
      }
    }  

      return value;
  }

  let obj = JSON.parse(str, reviver);

  return obj;
}

function getBookObjFromBookStorage(elem) {
  let card = getCard(elem)
  let index = Number(card.dataset.index);

  return bookStorage.get(index);
}
