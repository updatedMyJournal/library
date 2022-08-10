'use strict';

let grid = document.querySelector('.grid');
let form = document.querySelector('form');
let addButton = document.querySelector('.add');
let cancelButton = form.querySelector('.cancel');
let submitButton = form.querySelector('.submit');
let overlay = document.querySelector('.overlay');
let currentCard;

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

// a test book
if (!localStorage.getItem('testMarker')) {
  let testBook = new Book(
    {
      author: 'Lewis Carroll',
      title: 'Alice\'s Adventures in Wonderland', 
      pages: '70', read: false, 
      index: 1
    }
  );

  localStorage.setItem('testMarker', 'true');
  bookStorage.saveBook(testBook);
}

displayBookCards();

grid.onclick = (e) => {
  if (e.target.closest('.add')) {
    submitButton.textContent = 'Add';
    submitButton.className = 'submit';
    
    showForm();
  } else if (e.target.closest('.edit')) {
    submitButton.textContent = 'Edit';
    submitButton.className = 'edit';
    currentCard = getCard(e.target);

    let bookObj = getBookObjFromBookStorage(e.target);

    form.author.value = bookObj.author;
    form.title.value = bookObj.title;
    form.pages.value = bookObj.pages;
    form.read.checked = bookObj.read;

    e.target.blur();
    showForm();
  } else if (e.target.closest('.delete')) {
    let bookObj = getBookObjFromBookStorage(e.target);
    let card = getCard(e.target);

    bookStorage.deleteBook(bookObj);
    card.remove();
  } else if (e.target.closest('.read')) {
    toggleReadButton(e.target);
    e.target.blur();
  }

  return;
};

overlay.onpointerdown = (e) => {
  if (e.target.closest('form')) return;

  hideAndResetForm();
};

form.onsubmit = (e) => {
  e.preventDefault();
  
  if (e.submitter.classList.contains('submit')) {
    if (doesBookAlreadyExist()) {
      showError();
      return;
    }

    onBookAdd();
  } else if (e.submitter.classList.contains('edit')) {
    if (doesBookAlreadyExist(true)) {
      showError();
      return;
    }

    onBookEdit(currentCard);
  }

  hideAndResetForm();
};

form.onkeydown = (e) => {
  let targetInputField = e.target.closest('input');

  if (!targetInputField) return;
  
   if (e.code == 'Enter') {
    e.preventDefault();
    form.requestSubmit(submitButton);
  }
}

form.addEventListener('keydown', handleKeyNavigationInForm);

cancelButton.onclick = hideAndResetForm;

function showForm() {
  overlay.classList.remove('hidden');
  form.removeAttribute('novalidate');

  // for hoverout on add button when form is visible
  addButton.style.pointerEvents = "none"; 
  addButton.blur();

  document.onkeydown = (e) => {
    if (e.code == 'Escape') hideAndResetForm();
  }
}

function showError() {
  form.classList.add('error');
  form.title.oninput = () => {
    form.classList.remove('error');
    form.title.oninput = null;
  };
}

function hideAndResetForm() {
  form.setAttribute('novalidate', '');
  overlay.classList.add('hidden');

  resetForm();
}

function resetForm() {
  form.author.value = null;
  form.title.value = null;
  form.classList.remove('error');
  form.pages.value = null;
  form.read.checked = false;

  document.onkeydown = null;
  submitButton.onclick = null;
  currentCard == null;
  addButton.style.pointerEvents = ""; 
}

function onBookAdd() {
  let index = calculateIndex();

  let newBook = new Book(
    { 
      author: form.author.value.trim(),
      title: form.title.value.trim(),
      pages: form.pages.value,
      read: form.read.checked,
      index
    }
  );

  createBookCard(newBook);
  bookStorage.saveBook(newBook);
}

function onBookEdit(elem) {
  let bookObj = getBookObjFromBookStorage(elem);
  let authorT = form.author.value.trim();
  let titleT = form.title.value.trim();

  bookObj.author = authorT;
  bookObj.title = titleT;
  bookObj.pages = form.pages.value;
  bookObj.read = form.read.checked;

  refreshBookCard(elem);
  bookStorage.saveBook(bookObj);
}

function refreshBookCard(elem) {
  let bookObj = getBookObjFromBookStorage(elem);
  let card = getCard(elem);
  let cardAuthor = card.querySelector('.author');
  let cardTitle = card.querySelector('.title');
  let cardPages = card.querySelector('.pages');
  let cardRead = card.querySelector('.read');

  cardAuthor.textContent = bookObj.author;
  cardTitle.textContent = bookObj.title;
  cardPages.textContent = `${bookObj.pages} page(s)`;
  cardRead.textContent = getReadButtonText(bookObj.read);

  if (tooManySymbols(cardAuthor.textContent)) {
    cardAuthor.title = cardAuthor.textContent;
  } else {
    cardAuthor.removeAttribute('title');
  }

  if (tooManySymbols(cardTitle.textContent)) {
    cardTitle.title = cardTitle.textContent;
  } else {
    cardTitle.removeAttribute('title');
  }

  if (bookObj.read) {
    cardRead.classList.add('positive-read');
  } else {
    cardRead.classList.remove('positive-read');
  }
}

function toggleReadButton(elem) {
  let bookObj = getBookObjFromBookStorage(elem);

  bookObj.read = !bookObj.read;
  elem.classList.toggle('positive-read');
  elem.textContent = getReadButtonText(bookObj.read);
  bookStorage.saveBook(bookObj);
}

function getReadButtonText(readBookBefore) {
  return readBookBefore ? 'Read' : 'Haven\'t read';
}

function displayBookCards() {
  for (let book of bookStorage.values()) {
    createBookCard(book);
  }
}

function createBookCard({author, title, pages, read, index}) {
  addButton.insertAdjacentHTML('beforebegin', 
    `<div class="card" data-index=${index}>
      <div class="author" ${tooManySymbols(author) ? `title=${author}`: ''}>${author}</div>
      <div class="title" ${tooManySymbols(title) ? `title=${title}`: ''}>${title}</div>
      <div class="pages">${pages} page(s)</div>
      <button class="read${read ? " positive-read" : ""}">${getReadButtonText(read)}</button>
      <div class="buttons-wrapper">
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      </div>
     </div>`
  );
}

function tooManySymbols(str) {
  return str.length > 57;
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

function doesBookAlreadyExist(edit = false) {
  let newTitle = form.title.value.toLowerCase();
  let bookObjBeingEdited;

  if (edit) bookObjBeingEdited = getBookObjFromBookStorage(currentCard);
    
  for (let bookObj of bookStorage.values()) {
    let alreadyStoredTitle = bookObj.title.toLowerCase();

    if (edit && bookObj === bookObjBeingEdited) continue;

    if (newTitle === alreadyStoredTitle) return true;
  }

  return false;
}

function getBookObjFromBookStorage(elem) {
  let card = getCard(elem)
  let index = Number(card.dataset.index);

  return bookStorage.get(index);
}

function getCard(elem) {
  return elem.closest('.card');
}

function calculateIndex() {
  let newIndex = 0;

  if (bookStorage.size > 0) {
    let lastIndex = [...bookStorage.keys()].at(-1);

    newIndex = lastIndex + 1;
  }

  return newIndex;
}

function handleKeyNavigationInForm(e) {
  let keyPressed = e.code;
  let firstFormElem = form.author;
  let lastFormElem = submitButton;

  if (
    keyPressed == 'Tab'
    && !e.shiftKey
    && e.target == lastFormElem
    && document.activeElement == lastFormElem
  ) {
    firstFormElem.focus();
    e.preventDefault();
  } else if (
    keyPressed == 'Tab'
    && e.shiftKey
    && e.target == firstFormElem
    && document.activeElement == firstFormElem
  ) {
    lastFormElem.focus();
    e.preventDefault();
  }
}
