<script>
    import { getContext } from "svelte";

    export let started;

    $: {
        if($started) {
            start();
        }
    }

    let classes = [];
    let sets = [];

    function start() {
        const current = document.querySelector(".AeriesFullPageParentNavSubLinkMenu > .CurrentPage").innerText;

        document.querySelectorAll(".CardWithPeriod").forEach((card, i) => {
            const period = {};

            for(let j = 0; j < card.childNodes.length; j++) {
                if(card.childNodes[j].nodeType == 3 && card.childNodes[j].nodeValue.replaceAll("\n", "").replaceAll("\t", "").trim() != "") {
                    period.teacher = card.childNodes[j].nodeValue.replaceAll("\n", "").replaceAll("\t", "").trim();

                    period.teacher = period.teacher.toLowerCase();
                    period.teacher = period.teacher.replace("*", "");

                    period.teacher = period.teacher.replace(period.teacher.charAt(0), period.teacher.charAt(0).toUpperCase());

                    const segment = period.teacher.substring(period.teacher.indexOf(", "), period.teacher.indexOf(", ") + 3);

                    period.teacher = period.teacher.replace(segment, segment.toUpperCase());
                }
            }

            for(let j = 0; j < card.children.length; j++) {
                const child = card.children[j];

                if(child == undefined) return;

                if(child.className.includes("Period") && 'innerText' in child) {
                    period.number = child.innerText;
                }

                if(child.className.includes("RightSide") && 'innerText' in child.children[1]) {
                    let info = child.children[1].innerText.replaceAll("\t", "").replaceAll("\n\n", "\n").replaceAll("\n\n", "\n").replaceAll("\n\n", "\n").replaceAll("\n\n", "\n").split("\n");

                    info = info.filter((i) => i != "");

                    if(info.length < 2) {
                        period.letter = "N/A";
                        period.grade = 0;
                    } else {
                        period.letter = info[0];
                        period.grade = parseFloat(info[1].substring(1, info[1].length - 1));
                    }
                }

                if(child.className.includes("TextHeading") && 'innerText' in child) {
                    period.name = child.innerText;

                    child.id = "grabbing-eeeeeeeee-" + i;

                    period.grabber = "grabbing-eeeeeeeee-" + i;
                }

                

                if(child.className.includes("footer") && 'innerText' in child.children[1]) {

                    period.missing = parseInt(child.children[1].innerText);
                }
            }

            classes.push(period);

        });

        let last = 0;
        let next = "Current Terms";

        document.querySelectorAll(".SubHeaderRow").forEach((row) => {
            if(!row.id.includes("MainContent") || row.id.includes("01")) return;

            let index = parseInt(row.id.substring(row.id.indexOf("ails_ctl") + 8, row.id.indexOf("_tr"))) - 1;

            sets.push({
                label: next,
                classes: classes.slice(last, index),
            });

            last = index;
            next = row.innerText.trim();
        });

        sets.push({
            label: next,
            classes: classes.slice(last, classes.length),
        });

        console.log(sets);
    }
    

    let grid;
    let periods = new Array();
</script>

<div class="p-8 bg-white dark:bg-black text-black dark:text-white h-full w-full">
    <h1 class="mb-6 text-3xl">Gradebook</h1>

    {#each sets as set}
        {@const classes = set.classes}

        <p class="mb-4 text-xl font-bold">{set.label}:</p>

        <!-- Cannot use .grid since it will collide with another grid with class .grid aeries uses for dashboard. -->
        <div bind:this={grid} style="display: grid;" class="grid-cols-1 mb-6 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
            {#each classes as period, i}
                <button bind:this={periods[i]} on:click|preventDefault|stopPropagation={() => { localStorage.setItem('navigating', true); document.getElementById(period.grabber).click(); }} class="bg-black bg-opacity-10 dark:bg-white dark:bg-opacity-10 rounded-lg p-6 w-full flex gap-2 text-left">
                    <div class="w-full">
                        <p class="text-xl mb-2">{period.name}</p>
                        <p class="opacity-75 mb-1">{period.teacher}</p>
                        <p class="opacity-75">Missing: {period.missing}</p>
                    </div>
                    <div class="flex flex-col justify-around min-h-full">
                        <div class="flex flex-col items-center w-12 {period.grade >= 90 ? "text-green-700 dark:text-green-400" : period.grade >= 80 ? "text-yellow-700 dark:text-yellow-400" : period.grade >= 70 ? "text-orange-500 dark:text-orange-400" : period.grade > 0 ? "text-red-700 dark:text-red-400" : "text-black dark:text-white" }">
                            <p class="text-3xl font-extrabold">{period.letter}</p>
                            <p class="text-lg font-bold">{period.grade}</p>
                        </div>
                    </div>
                </button>
            {/each}
        </div>
    {/each}

    <div class="flex justify-between">
        <p class="text-sm opacity-75">Please report any issues <a href="https://docs.google.com/forms/d/e/1FAIpQLScMri2JCO1lXSXup-gbzKg-5OaOeiDh8e_R09Zh0EU8z7J8qg/viewform" class="underline">here</a>.</p>
        <p class="text-sm opacity-75">Aeries Grades+</p>
    </div>
</div>