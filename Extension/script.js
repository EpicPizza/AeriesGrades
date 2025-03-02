//final



//--

fixSideAffects();

document.getElementById("NavSubGradebook Details").className += " hidden";

const classes = document.querySelector(".classesSection");

if(classes) {
    if (classes.classList.contains('classesSection')) {
        classes.classList.remove('classesSection');
        classes.classList.add("gradesPlusSection")
    }

    while (classes.firstChild) {
        classes.removeChild(classes.firstChild);
    }

    console.log(classes);
     
    classes.innerHTML = final;

    console.log(classes);
} else {
    const main = document.querySelector("#AeriesFullPageContent");

    const current = document.querySelector(".AeriesFullPageParentNavSubLinkMenu > .CurrentPage").innerText;

    if(main && current.includes("Gradebook")) {
        main.insertAdjacentHTML('beforebegin', final);
        main.className += " absolute z-[-1] max-h-[10px] hidden";
    
    } else {
        console.log("not found");
    }
}

//final hydration



//--

document.getElementById("#start").click();

    

function fixSideAffects() {
    document.querySelector("#AeriesAlert > img").className = "absolute scale-125 -translate-x-1/2 -translate-y-1/4 top-1/2 left-1/2"; //notification symbol
    document.querySelector("#nav-account-dropdown").className = document.querySelector("#nav-account-dropdown").className + " border border-gray-300"; //log out menu
    document.querySelector("#ctl00_lblWelcomeName").className = document.querySelector("#ctl00_lblWelcomeName").className + " opacity-75"; //top right email
    document.querySelector("#SearchResults").className = "border border-gray-300"; //search results
    document.querySelector("#AeriesFullPageSearchInput").className = document.querySelector("#AeriesFullPageSearchInput").className + " my-2 border border-gray-300 pl-3 text-lg h-11"; //search input
    document.querySelector("#AeriesTextLogo > div > img").className = "scale-105"; //aeries logo
    document.querySelectorAll(".k-widget > .k-window-titlebar").forEach((element) => {
        element.style = ""; //removes margin-bottom: negative something? idk why it was there in the first place
    }) //popup warnings
}