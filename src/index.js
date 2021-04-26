export function bind(rootElement, state) {
  const stateToElementBindings = {}

  rootElement.querySelectorAll("[data-bind]").forEach(el => {
    el.dataset.bind?.split(/[ ;]+/).forEach(binding => {
      let parts = binding.split(":")
      let element = el, stateSelector, fieldSelector;
      if (parts.length === 1) {
        stateSelector = parts[0]
      } else {
        fieldSelector = parts[0]
        stateSelector = parts[1]
      }
      if (getDeep(state, stateSelector) !== undefined) {
        if (stateToElementBindings[stateSelector] === undefined) {
          stateToElementBindings[stateSelector] = []
        }
        stateToElementBindings[stateSelector].push({
          element: element,
          field: fieldSelector
        })
      }
    })
  })

  const proxy = proxyRecursively(stateToElementBindings, state)

  Object.entries(stateToElementBindings).forEach(([stateBinding, els]) => {
    els.forEach(({element, field}) => {
      let resolvedProxy = getDeep(proxy, stateBinding)
      if (field === undefined) {
        if (typeof resolvedProxy === 'object') {
          Object.entries(resolvedProxy).forEach(([key, value]) => {
            let resolvedValue = value;
            if (typeof value === 'function') {
              resolvedValue = function(...args) { value.bind(resolvedProxy)(...args) }
            }
            element[key] = resolvedValue
          })
        } else if (typeof resolvedProxy === 'function') {
          const parentProxy = getDeep(proxy, stateBinding.substring(0, stateBinding.lastIndexOf("."))) ?? proxy
          const childProxy = resolvedProxy
          resolvedProxy = function(...args) { childProxy.bind(parentProxy)(...args) }
          resolvedProxy(element)
        }
      } else {
        if (typeof resolvedProxy === 'function') {
          let parentProxy = getDeep(proxy, stateBinding.substring(0, stateBinding.lastIndexOf("."))) ?? proxy
          const childProxy = resolvedProxy
          resolvedProxy = function(...args) { childProxy.bind(parentProxy)(...args) }
        }
        setDeep(element, field, resolvedProxy)
      }
    })
  })
}

function proxyRecursively(stateToElementBindings, obj, root = "") {
  let proxy = {}
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      proxy[key] = proxyRecursively(stateToElementBindings, value, root + key + ".")
    } else {
      proxy[key] = value
    }
  })
  return new Proxy(obj, {
    get(target, prop) {
      if (proxy.hasOwnProperty(prop)) {
        return proxy[prop]
      }
      return Reflect.get(...arguments)
    },
    set(target, prop, value) {
      proxy[prop] = value;
      let bindings = stateToElementBindings[root + prop]
      if (bindings !== undefined) {
        bindings.forEach(({element, field}) => {
          if (field !== undefined) {
            setDeep(element, field, value)
          }
        })
      }
      return true;
    }
  });
}

function getDeep(o, p) {
  p = p.replace(/\[(\w+)]/g, '.$1');
  p = p.replace(/^\./, '');
  let a = p.split('.');
  for (let i = 0, n = a.length; i < n; ++i) {
    let k = a[i];
    if (k in o) {
      o = o[k];
    } else {
      return;
    }
  }
  return o;
}

const setDeep = (o, p, v) => {
  const [head, ...rest] = p.split('.');

  !rest.length
    ? o[head] = v
    : setDeep(o[head], rest.join('.'), v);
}
