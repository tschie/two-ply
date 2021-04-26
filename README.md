# two-ply

![npm version](https://img.shields.io/npm/v/two-ply)

Two-ply binds your HTML to your JS state using one vanilla JS function `bind` and one data attribute `data-bind`.

## Install

**CDN:**
```html
<script src="https://cdn.jsdelivr.net/npm/two-ply@0.1.0/src/index.min.js" defer></script>
```

**NPM:**
```js
npm i two-ply
```

**Import:**
```js
import {bind} from 'two-ply'
```

## Usage

In your JS file, bind the document to your state:
```js
import {bind} from 'two-ply'

bind(document, {
  value: 0,
  increment: function() {
    this.value++
  }
})
```

In your HTML, list bindings between element fields and state fields.

```html
<button data-bind="innerText:value onclick:increment"></button>
```

Nested fields work too.

```js
bind(document, {
  counter: {
    value: 0,
    increment: function() {
      this.value++
    }
  }
})
```

```html
<button data-bind="innerText:count.value onclick:count.increment"></button>
```

Alternatively, you can bind an element to a state field function to nest scopes:

```js
bind(document, {
  counter,
  // ...other state scopes/controllers
})

function counter(el) {
  bind(el, {
    value: 0,
    increment: function() {
      this.value++;
    }
  })
}
```

```html
<section data-bind="counter">
    <h3>Counter</h3>
    <button data-bind="innerText:value onclick:increment"></button>
</section>
```

## Examples

**Dropdown**

```html
<section data-bind="dropdown">
    <h3>Dropdown</h3>
    <div style="position: relative">
        <button data-bind="innerText:label onclick:toggle"></button>
        <div data-bind="hidden:closed">
            Content
        </div>
    </div>
</section>
```

```js
function dropdown(el) {
  bind(el, toggle(false, (opened) => ({
    closed: !opened,
    label: opened ? "Close" : "Open"
  })))
}

// reusable utility
const toggle = (initState, state) => ({
  _on: initState,
  toggle: function() {
    this._on = !this._on
    Object.assign(this, state(this._on))
  },
  ...state(initState)
})
```

**Todo list**

```html
<section data-bind="todo">
    <h3>Todo</h3>
    <input
        aria-label="todo"
        type="text"
        data-bind="oninput:onInput value:value"
    />
    <button data-bind="onclick:add">
        Add
    </button>
    <ul data-bind="list">
        <template data-bind="itemTemplate">
            <li data-bind="innerHTML:item"></li>
        </template>
    </ul>
</section>
```

```js
function todo(el) {
  bind(el, {
    value: "",
    onInput: function (event) {
      // validate...
      this.value = event.target.value
    },
    add: function() {
      let value = this.value
      if (this._list != null && this._itemTemplate != null) {
        let item = this._itemTemplate.content.cloneNode(true);
        bind(item, {
          item: value
        })
        this._list.appendChild(item)
      }
      this.value = "";
    },
    _list: null,
    list: function(el) {
      this._list = el
    },
    _itemTemplate: null,
    itemTemplate: function(el) {
      this._itemTemplate = el;
    }
  })
}
```
