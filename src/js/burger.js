const burger = document.querySelector('.icon-menu');
const menuBody = document.querySelector('.menu__body');


burger.onclick = function(){
    burger.classList.toggle('_active')
    menuBody.classList.toggle('_active')
}
