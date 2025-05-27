function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  const isProperty = (key) => key !== "children";

  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  return dom;
}

// function render(element, container){

//     const dom = element.type === 'TEXT_ELEMENT'
//         ? document.createTextNode("")
//         : document.createElement(element.type)

//     const isProperty = key=>key!=='children'

//     Object.keys(element.props).filter(isProperty).forEach(
//         name=>{
//             dom[name] = element.props[name]
//         }
//     )

//     element.props.children.forEach(child=>
//         render(child, dom)
//     )

//     container.appendChild(dom)
// }

const isEvent = key=> key.startsWith('on');
const isProperty = (key) =>key!== 'children'&& !isEvent(key);
const isNew = (prev, next)=>(key)=>prev[key]!==next[key]
const isGone = (prev, next)=>(key)=>!(key in next)

function updateDom(dom, prevProps, nextProps){
    // remove old or changed event listeners
    Object.keys(prevProps)
    .filter(isEvent)
    .filter(key=>!(key in nextProps)||isNew(prevProps,nextProps)(key))
    .forEach(name=>{
        const eventType = name.toLowerCase().substring(2)
        dom.removeEventListener(eventType, prevProps[name]);
    })

    // remove old properties
    Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name=>{
        dom[name] = '';
    })

    // set new or changed properties
    Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name=>{
        dom[name] = nextProps[name]
    })

    // add new event listeners
    Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name=>{
        const eventType = name.toLowerCase().substring(2);
        dom.addEventListener(eventType, nextProps[name]);
    })

}

function commitRoot() {
  // add node to the dom
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return null;
  }
  const domParent = fiber.parent.dom;

  if(fiber.effectTag === 'PLACEMENT' && fiber.dom!==null){
    domParent.appendChild(fiber.dom)
  }else if(fiber.effectTag === 'UPDATE' && fiber.dom!==null){
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
  }else if(fiber.effectTag === 'DELETION'){
    domParent.removeChild(fiber.dom)
    return
  }

//   domParent.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function render(element, container) {
  // todo set next unit of work
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
    // reset deletions
  deletions = [];
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = null;


function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    // commit root
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  //create new fiber
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

  // return next unit of work
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;

  let prevSibling = null;

  while (index < elements.length|| oldFiber!==null) {
    const element = elements[index];
    let newFiber = null;

    // compar oldFiber with element
    const sameType = oldFiber && element && oldFiber.type === oldFiber.type;

    if(sameType){
        //update the node
        newFiber = {
            type: oldFiber.type,
            props: element.props,
            dom: oldFiber.dom,
            parent: wipFiber,
            alternate: oldFiber,
            effectTag: 'UPDATE'
        }
    }

    if(element && !sameType){
        // add new node
        newFiber = {
            type: element.type,
            props: element.props,
            dom: null,
            parent:wipFiber,
            alternate: null,
            effectTag: 'PLACEMENT'
        }
    }

    if(oldFiber && !sameType){
        // delete old fiber node
        oldFiber.effectTag  = 'DELETION';
        deletions.push(oldFiber);
    }


    if(oldFiber){
        oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}

const Didact = {
  createElement,
  render,
};

// const element = createElement(
//     'div',
//     {id: 'foo'},
//     Didact.createElement('a', null, 'bar'),
//     Didact.createElement('b')
// )

/** @jsx Didact.createElement */
const element = (
  <div style="background: salmon">
    <h1>Hello World</h1>
    <h2 style="text-align:right">from Didact</h2>
  </div>
);

const container = document.getElementById("root");
Didact.render(element, container);
