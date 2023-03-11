
function dropdown_menu() {
    document.getElementById("menu").classList.toggle("show-menu");

}





let header_button = document.getElementById("add-trade-button");

header_button.addEventListener("click",function(e){
    let add_trade_menu = document.getElementById("add-trade-menu");
    add_trade_menu.classList.remove("close-add-trade-menu");
    console.log('hellow this is working');
    document.getElementById("main").classList.add("background-blur");
    document.getElementById("taskbar").classList.add("background-blur");
    add_trade_menu.classList.add("remove-blur");
})



let close_button = document.getElementById("close-button");

close_button.addEventListener("click",function(e){
    let add_trade_menu = document.getElementById("add-trade-menu");
    add_trade_menu.classList.add("close-add-trade-menu");
    document.getElementById("main").classList.remove("background-blur");
    document.getElementById("taskbar").classList.remove("background-blur");
    add_trade_menu.classList.remove("remove-blur");
    console.log('this is working');
    
    
});


    // Select the button

let dark_mode_button = document.getElementById("dark-mode-button");
// Select the stylesheet <link>
const theme = document.querySelector("#theme-link");

// Listen for a click on the button
dark_mode_button.addEventListener("click", function() {
  // If the current URL contains "ligh-theme.css"
  if (theme.getAttribute("href") == "#") {
    // ... then switch it to "dark-theme.css"
    theme.href = "../css/dark-theme.css";
  // Otherwise...
  } else {
    // ... switch it to "light-theme.css"
    theme.href = "#";
  }
});
            







// this is slide window


const openBtns = document.querySelectorAll('.open-window-btn');
const closeBtn = document.querySelector('.close-window-btn');
const windowEl = document.querySelector('.window');

const body = document.querySelector('body');
const taskbar = document.querySelector('.taskbar');

// Open window on button click
openBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    windowEl.classList.add('show-window');
    
    body.style.position = 'fixed';
    taskbar.style.filter= 'blur(1px)';
    taskbar.style.pointerEvents = 'none';
    
    
  });
});

// Close window on button click
closeBtn.addEventListener('click', () => {
  windowEl.classList.remove('show-window');
  body.style.position = 'absolute';
  taskbar.style.filter= 'blur(0px)';
  taskbar.style.pointerEvents = 'visible';
});

// Close window on outside click
document.addEventListener('click', (event) => {
  if (!event.target.closest('.window') && !event.target.classList.contains('open-window-btn')) {
    windowEl.classList.remove('show-window');
    body.style.position = 'absolute';
    taskbar.style.filter= 'blur(0px)';
    taskbar.style.pointerEvents = 'visible';
  }
});








