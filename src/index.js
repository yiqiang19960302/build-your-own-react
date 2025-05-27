function createElement(type, props, ...children){
    return {
        type,
        props: {
            ...props,
            children: children.map(child=>typeof child==='object'? child:createTextElement(child)),
        }
    }
}

function createTextElement(text){
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text,
            children: []
        }
    }
}

function createDom(fiber){
    const dom = fiber.type === 'TEXT_ELEMENT'
        ? document.createTextNode("")
        : document.createElement(fiber.type)

    const isProperty = key=>key!=='children'

    Object.keys(fiber.props).filter(isProperty).forEach(
        name=>{
            dom[name] = fiber.props[name]
        }
    )

    return dom
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

function commitRoot(){
    // add node to the dom
    commitWork(wipRoot.child);
    currentRoot = wipRoot;
    wipRoot = null
}


function commitWork(fiber){
    if(!fiber){
        return null;
    }

    const domParent = fiber.parent.dom;
    domParent.appendChild(fiber.dom);
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}


function render(element, container){
    // todo set next unit of work
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    }
    nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
let wipRoot = null
let currentRoot = null;

function workLoop(deadline){
    let shouldYield = false;

    while(nextUnitOfWork && !shouldYield){
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        )
        shouldYield = deadline.timeRemaining()<1;
    }

    if(!nextUnitOfWork && wipRoot){
        // commit root
        commitRoot()
    }

    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber){
    if(!fiber.dom){
        fiber.dom = createDom(fiber)
    }

    // if(fiber.parent){
    //     fiber.parent.dom.appendChild(fiber.dom)
    // }

    //create new fiber
    const elements = fiber.props.children;
    let index = 0
    let prevSibling = null;

    while(index<elements.length){
        const element = elements[index];
        const newFiber ={
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: null
        }

        if(index===0){
            fiber.child = newFiber
        }else{
            prevSibling.sibling = newFiber
        }
        prevSibling = newFiber;
        index++
    }

    // return next unit of work
    if(fiber.child){
        return fiber.child
    }

    let nextFiber = fiber
    while(nextFiber){
        if(nextFiber.sibling){
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
}

const Didact = {
    createElement,
    render
}


// const element = createElement(
//     'div',
//     {id: 'foo'},
//     Didact.createElement('a', null, 'bar'),
//     Didact.createElement('b')
// )

/** @jsx Didact.createElement */
/** @jsx Didact.createElement */
const element = (
  <div style="background: salmon">
    <h1>Hello World</h1>
    <h2 style="text-align:right">from Didact</h2>
  </div>
);

const container = document.getElementById('root');
Didact.render(element, container)