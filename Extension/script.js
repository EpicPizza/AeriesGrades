//final



//--

fixSideAffects();

document.getElementById("NavSubGradebook Details").className += " hidden";

const classes = document.querySelector(".classesSection");

if(classes) {
    classes.classList.add("hidden");
    
    const element = document.createElement("a");
    element.href = location.href.substring(0, location.href.lastIndexOf("/") + 1) + "GradebookSummary.aspx";
    element.innerText = "Go to Aeries Grades+";
    element.style = "display: block; padding-top: 1rem !important; padding-bottom: 1rem; padding-left: 2rem; padding-right: 2rem; background-color: black; color: white !important; text-decoration: none; border-radius: 0.5rem;"
    
    classes.insertAdjacentElement("afterend", element);
} else {
    const main = document.querySelector("#AeriesFullPageContent");

    const current = document.querySelector(".AeriesFullPageParentNavSubLinkMenu > .CurrentPage").innerText;

    if(main && current.includes("Gradebook")) {
        main.insertAdjacentHTML('beforebegin', final);
        main.className += " absolute z-[-1] max-h-[10px] hidden";
    
//final hydration



//--

    document.getElementById("#start").click();

    } else {
        console.log("not found");
    }
}

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