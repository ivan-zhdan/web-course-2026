'use strict';

/*
  Состояние — единственный источник правды:
    tasks = [{ id: Number, text: String, completed: Boolean }, ...]

  render() каждый раз перерисовывает <ul id="task-list"> на основе tasks
  и текущего фильтра. Данные при смене фильтра не удаляются — отбрасывается
  только то, что показывается на экране (tasks.filter(...) в getVisibleTasks).
*/

var form = document.getElementById('add-form');
var input = document.getElementById('task-input');
var warning = document.getElementById('form-warning');
var list = document.getElementById('task-list');
var counter = document.getElementById('counter');
var emptyState = document.getElementById('empty-state');
var filterButtons = Array.prototype.slice.call(document.querySelectorAll('.filter-btn'));

var tasks = [];
var nextId = 1;
var currentFilter = 'all'; // 'all' | 'active' | 'completed'

function addTask(rawText) {
  var text = rawText.trim();

  if (!text) {
    warning.hidden = false;
    return;
  }

  warning.hidden = true;

  tasks.push({
    id: nextId,
    text: text,
    completed: false
  });
  nextId += 1;

  render();
}

function toggleTask(id) {
  tasks = tasks.map(function (task) {
    if (task.id !== id) return task;
    return Object.assign({}, task, { completed: !task.completed });
  });
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(function (task) {
    return task.id !== id;
  });
  render();
}

function getVisibleTasks() {
  return tasks.filter(function (task) {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });
}

function createTaskElement(task) {
  var li = document.createElement('li');
  li.className = 'task' + (task.completed ? ' completed' : '');
  li.dataset.id = String(task.id);

  var checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', 'Отметить задачу «' + task.text + '» выполненной');
  checkbox.addEventListener('change', function () {
    toggleTask(task.id);
  });

  var span = document.createElement('span');
  span.className = 'task-text';
  span.textContent = task.text;

  var deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'task-delete';
  deleteBtn.textContent = 'Удалить';
  deleteBtn.setAttribute('aria-label', 'Удалить задачу «' + task.text + '»');
  deleteBtn.addEventListener('click', function () {
    deleteTask(task.id);
  });

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(deleteBtn);

  return li;
}

function updateCounter() {
  var remaining = tasks.filter(function (task) {
    return !task.completed;
  }).length;

  var completed = tasks.filter(function (task) {
    return task.completed;
  }).length;

  counter.textContent = 'Осталось: ' + remaining + ', Выполнено: ' + completed;
}

function render() {
  var visible = getVisibleTasks();

  list.innerHTML = '';

  var elements = visible.map(createTaskElement);
  elements.forEach(function (el) {
    list.appendChild(el);
  });

  if (tasks.length === 0) {
    emptyState.textContent = 'Пока нет задач — добавьте первую.';
    emptyState.hidden = false;
  } else if (visible.length === 0) {
    emptyState.textContent = 'По этому фильтру задач нет.';
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
  }

  updateCounter();
}

form.addEventListener('submit', function (event) {
  event.preventDefault();
  addTask(input.value);
  input.value = '';
  input.focus();
});

input.addEventListener('input', function () {
  if (!warning.hidden) {
    warning.hidden = true;
  }
});

filterButtons.forEach(function (btn) {
  btn.addEventListener('click', function () {
    currentFilter = btn.dataset.filter;

    filterButtons.forEach(function (b) {
      b.classList.remove('is-active');
    });
    btn.classList.add('is-active');

    render();
  });
});

render();