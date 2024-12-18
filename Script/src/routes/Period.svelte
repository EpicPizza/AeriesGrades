<script>
    import { getContext } from "svelte";
    import dnt from 'date-and-time';
    import { slide } from "svelte/transition";
    import LineChart from './Graph/LineChart.svelte';
    import de from "date-and-time/locale/de";
    import { fade } from "svelte/transition";

    const gradeHistory = [];

    export let started;
    export let settings;

    $: {
        if($started) {
            start();
        }
    }

    let edit = false;

    let categories = [];

    let period = {
        name: "",
        teacher: "",
        email: "",
        slot: "",
        letter: "",
        grade: 0,
        edit: 0,
    }

    let loading = true;

    let finalGrade = "90";

    $: zeros = $settings.zeros == "yes";

    async function start() {
        const url = new URL(location.href);

        if(localStorage.getItem("navigating") != "true" && url.searchParams.get("class") == null && url.searchParams.get("slot") == null){
            document.location.href = location.href.substring(0, location.href.lastIndexOf("/") + 1) + "GradebookSummary.aspx";
            return;
        } else if(url.searchParams.get("class") != null && url.searchParams.get("slot") != null) {
            const select = document.getElementById("ctl00_MainContent_subGBS_dlGN");

            let first = false;

            for(let i = 0; i < select.options.length; i++) {
                const option = select.options[i];

                if(option.text.includes(url.searchParams.get("class")) && option.text.includes(url.searchParams.get("slot"))) {

                    if(i == 0) {
                        first = true;
                    } else {
                        select.value = option.value;
                    }
                }
            }

            if(!first) {
                const before = document.querySelectorAll(".Card").length == 0 ? 0 : document.querySelectorAll(".Card")[0].innerHTML;

                select.dispatchEvent(new Event('change'));

                const result = await new Promise((resolve) => {
                    let cycles = 0;

                    const interval = setInterval(() => {
                        const cards = document.querySelectorAll(".Card");

                        //console.log(cards, cards.length);

                        //console.log(cards[0].innerText, before);

                        if((cards.length > 0 && before == 0) || (cards.length > 0 && cards[0].innerHTML != before) || (cards.length == 0 && before != 0)) {
                            resolve(true);
                            clearInterval(interval);
                        }

                        cycles++;

                        if(cycles > 50) {
                            resolve(false);
                            clearInterval(interval);
                        }
                    }, 100);
                });
            }
        } else if(localStorage.getItem("navigating") == "true") {
            localStorage.setItem("navigating", "false");
        }

        //ungodly scrapping
        period.name = document.querySelector('#ctl00_MainContent_subGBS_dlGN > [selected="selected"]').innerText;
        period.name = period.name.substring(period.name.indexOf("-") + 2);
        period.slot = period.name.substring(period.name.indexOf("-") + 2);
        period.name = period.name.substring(0, period.name.indexOf("-"));
        period.teacher = document.querySelector('#ctl00_MainContent_subGBS_lblTeacherName').innerText;
        period.teacher = period.teacher.toLowerCase();
        period.teacher = period.teacher.replace(period.teacher.charAt(0), period.teacher.charAt(0).toUpperCase());
        const segment = period.teacher.substring(period.teacher.indexOf(", "), period.teacher.indexOf(", ") + 3);
        period.teacher = period.teacher.replace(segment, segment.toUpperCase());
        period.email = document.querySelector('#ctl00_MainContent_subGBS_EMailTeacher').innerText;

        url.searchParams.append("class", period.name);
        url.searchParams.append("slot", period.slot.replaceAll("  ", " "));
        history.replaceState({}, null, url.toString());

        document.title = period.name;

        const assignments = [];

        document.querySelectorAll(".Card").forEach((card, i) => {
            const assignment = {};

            for(let j = 0; j < card.children.length; j++) {
                try {

                const child = card.children[j];

                if(child == undefined) return;

                if(child.className.includes("TextHeading") && 'innerText' in child) {
                    const title = child.innerText;

                    assignment.id = title.substring(0, title.indexOf("-") - 1);
                    assignment.name = title.substring(title.indexOf("-") + 2);
                }

                if(child.className.includes("TextSubSectionCategory") && 'innerText' in child) {
                    assignment.category = child.innerText.trim();
                }

                if(child.className.includes("InlineData") && 'innerText' in child) {
                    const section = child.innerText.replaceAll("\t", "").replaceAll("\n", "");

                    if(section.includes("Completed")) {
                        assignment.completed = section.substring(section.indexOf(":") + 2);
                    } else if(section.includes("Due")) {
                        assignment.due = section.substring(section.indexOf(":") + 2);
                    } 
                }

                if(child.className.includes("TextSubSection") && 'innerText' in child && 'innerText' in card) {
                    assignment.graded = card.innerText.includes("True");
                }

                if(child.className.includes("FullWidth") && 'innerText' in child && child.innerText.includes("Assigned")) {
                    const section = child.innerText.replaceAll("\t", "").replaceAll("\n", "");

                    assignment.assigned = section.substring(section.indexOf(":") + 2, section.indexOf("Due")).trim();
                }

                if(child.className.includes("FullWidth") && 'innerText' in child && child.children[0].title == "Long Description") {
                    assignment.description = child.innerText;
                }

                if(child.className.includes("RightSide") && 'innerText' in child) {
                    const scores = child.innerText.replaceAll("\t", "").replaceAll("\n\n", "\n").replaceAll("\n\n", "\n").replaceAll("\n\n", "\n").replaceAll("\n\n", "\n").replaceAll("\n\n", "\n").split("\n").filter((i) => i != '');

                    const missing = child.innerHTML.includes("background-color:#FF000");

                    if(scores.length < 7 || (scores[1].trim() == "" && !missing) || scores[1].trim() == "NA") {
                        assignment.weight = 1;
                        assignment.actual = { score: 0, total: 0 };
                        assignment.edit = { score: null, total: 0 };
                        assignment.missing = false;

                        assignment.percent = -1;
                    } else if(scores[1].trim() == "Missing" || scores[1].trim() == "") {
                        assignment.weight = 1;
                        assignment.missing = true;
                        assignment.actual = { score: parseFloat(scores[5].trim()), total: 0 };
                        assignment.edit = { score: 0, total: 0 };

                        assignment.percent = 0;
                    } else {
                        assignment.weight = 1;
                        assignment.missing = false;
                        assignment.actual = { score: parseFloat(scores[5].trim()), total: 0 };
                        assignment.edit = { score: parseFloat(scores[5].trim()), total: 0 };

                        assignment.percent = parseFloat(scores[8].substring(0, scores[8].length - 1));
                    }

                    if(scores.length > 7) {
                        assignment.weight = parseFloat(scores[3].trim()) / parseFloat(scores[7].trim());
                        if(isNaN(assignment.weight)) assignment.weight = 1;
                        assignment.actual.total = parseFloat(scores[7].trim());
                        assignment.edit.total = parseFloat(scores[7].trim());
                    }
                }

                } catch(e) {
                    console.log(e);
                }
            }

            assignment.open = false;

            assignment.fake = false;

            assignments.push(assignment);
        });

        for(let i = 0; i < assignments.length; i++) {
            const assignment = assignments[i];

            assignments[i].due = typeof assignment.due == 'string' && assignment.due != "" ? dnt.parse(assignment.due, "MM/DD/YYYY") : "n/a";
            assignments[i].completed = typeof assignment.completed == 'string' && assignment.completed != "" ? dnt.parse(assignment.completed, "MM/DD/YYYY") : "n/a";
            assignments[i].assigned = typeof assignment.assigned == 'string' && assignment.assigned != "" ? dnt.parse(assignment.assigned, "MM/DD/YYYY") : "n/a";
        }

        const sorting = new Map();

        assignments.forEach(assignment => {
            const category = sorting.get(assignment.category);

            if(category == undefined) {
                const newCategory = new Array();

                newCategory.push(assignment);

                sorting.set(assignment.category, newCategory);
            } else {
                category.push(assignment);
            }
        });

        if(document.querySelector("#ctl00_MainContent_subGBS_assignmentsView").children.length < 3) {
            loading = false;
            return;
        };

        const table = document.querySelector("#ctl00_MainContent_subGBS_assignmentsView").children[3].children[0].children;

        for(let i = 0; i < table.length; i++) {
            const row = table[i]; 

            if(!row.id.includes("MainContent_subGBS_DataSummary")) continue;

            if(row.children[0].innerText.trim() == "Total") {
                period.letter = row.children[5].innerText.trim();
                period.grade = parseFloat(row.children[4].innerText.trim().substring(0, row.children[4].innerText.length - 1));
                period.edit = parseFloat(row.children[4].innerText.trim().substring(0, row.children[4].innerText.length - 1));;
            } else {
                const category = {
                    name: row.children[0].innerText.trim(),
                    weight: parseFloat(row.children[1].innerText.trim().substring(0, row.children[1].innerText.trim().length - 1)),
                    points: parseFloat(row.children[2].innerText.trim()),
                    total: parseFloat(row.children[3].innerText.trim()),
                    percent: parseFloat(row.children[4].innerText.trim().substring(0, row.children[4].innerText.trim().length - 1)),
                    letter: row.children[5].innerText.trim(),
                    assignments: sorting.get(row.children[0].innerText.trim()) ?? new Array(),
                    fake: false,
                };

                category.edit = {
                    points: category.points,
                    total: category.total,
                    weight: category.weight,
                    percent: category.percent,
                }

                categories.push(category);
            }
        }

        const allAssignments = new Array();

        categories.forEach(category => {
            category.assignments.forEach(assignment => {
                allAssignments.push({ ... assignment, category: category.name });
            });
        });
        
        allAssignments.sort((a, b) => {
            if (a.due === "n/a") return 1;
            if (b.due === "n/a") return -1;
            return new Date(a.due) - new Date(b.due);
        });

        const addingAssignments = new Array();

        for(let i = 0; i < allAssignments.length; i++) {
            const assignment = allAssignments[i];

            addingAssignments.push(assignment);

            const grade = calculateGrade(addingAssignments, categories);

            if(grade != -1) {
                gradeHistory.push({
                    grade: grade,
                    timestamp: assignment.due.valueOf(),
                });
            }
        }

        for(let i = 0; i < gradeHistory.length; i++) {
            if(isNaN(gradeHistory[i].grade)) {
                gradeHistory.splice(i, 1);
                i--;
            } else if(i != gradeHistory.length - 1 && gradeHistory[i + 1].timestamp == gradeHistory[i].timestamp) {
                gradeHistory.splice(i, 1);
                i--;
            }
        }

        categories = categories;
        loading = false;
        check = 1;
    }

    function calculateGrade(assignments, categories) {
        let percent = 0;
        let totalPercent = 0;

        categories.forEach((category, i) => {
            let points = 0;
            let total = 0;

            let categoryAssignments = assignments.filter(assignment => assignment.category == category.name);

            categoryAssignments.forEach(assignment => {
                if((assignment.edit.score || assignment.edit.score === 0) && assignment.edit.total) {
                    points += parseFloat(assignment.edit.score) * assignment.weight;
                    total += parseFloat(assignment.edit.total) * assignment.weight;
                } else if(assignment.edit.score && assignment.edit.total === 0) {
                    points += parseFloat(assignment.edit.score) * assignment.weight;
                }
            });

            const weight = parseFloat(category.edit.weight);

            if(total != 0) {
                percent += (points / total) * (weight / 100);
                totalPercent += (weight / 100);
            }
        })
        
        if(totalPercent == 0) return -1;

        return (percent / totalPercent) * 100;
    }

    let width = 0;

    let error = false;
    let check = 0;

    $: {
        let percent = 0;
        let totalPercent = 0;

        categories.forEach((category, i) => {
            let points = 0;
            let total = 0;

            category.assignments.forEach(assignment => {
                //type coerce strikes again
                if((assignment.edit.score || assignment.edit.score === 0) && assignment.edit.total) {
                    points += parseFloat(assignment.edit.score) * assignment.weight;
                    total += parseFloat(assignment.edit.total) * assignment.weight;
                } else if(assignment.edit.score && assignment.edit.total === 0) {
                    points += parseFloat(assignment.edit.score) * assignment.weight;
                }
            });

            categories[i].edit.points = points;
            categories[i].edit.total = total;
            categories[i].edit.percent = points / total * 100;

            const weight = parseFloat(category.edit.weight);

            if(total != 0) {
                percent += (points / total) * (weight / 100);
                totalPercent += (weight / 100);
            }
        })

        period.edit = (percent / totalPercent) * 100;

        if(check == 1) {
            error = Math.floor(period.edit * 100) / 100 != period.grade;

            check = 2;
        }
    }

    let expandError = false;
    let disabled = false;

    $: {
        const main = document.querySelector("#AeriesFullPageContent");
        const extension = document.getElementById("aeriesgrades+main");

        main.className = main.className.replace("absolute z-[-1] max-h-[10px] hidden", "");

        if(!disabled) {
            main.className += " absolute z-[-1] max-h-[10px] hidden";
            extension.className = "w-full h-full";
        } else {
            extension.className = "fixed top-0 left-0 w-[14rem]";
            document.querySelector(".FullWidthAutoHeight > .CatHeader").className += " text-black";
            document.querySelector(".CatHeaderActions > .ddlTableCard").className += " text-black";
        }
    }

    function calculateFinal(categories, name, finalGrade, edit) {
        if(isNaN(parseFloat(finalGrade))) {
            return "(Invalid)"
        }

        let percent = 0;
        let totalPercent = 0;
        let neededPercent = 0;
        let neededPoints = 0;
        let neededWeight = 0;

        categories.forEach((category, i) => {
            let points = 0;
            let total = 0;

            category.assignments.forEach(assignment => {
                //type coerce strikes again

                if(edit || 'final' in assignment) {
                    if((assignment.edit.score || assignment.edit.score === 0) && assignment.edit.total) {
                        points += parseFloat(assignment.edit.score) * assignment.weight;
                        total += parseFloat(assignment.edit.total) * assignment.weight;
                    } else if(assignment.edit.score && assignment.edit.total === 0) {
                        points += parseFloat(assignment.edit.score) * assignment.weight;
                    } else if(assignment.edit.total && category.name == name) {
                        total += parseFloat(assignment.edit.total) * assignment.weight;
                    }
                } else if(assignment.fake != true) {
                    if((assignment.actual.score || assignment.actual.score === 0) && assignment.actual.total && assignment.percent != -1) {
                        points += parseFloat(assignment.actual.score) * assignment.weight;
                        total += parseFloat(assignment.actual.total) * assignment.weight;
                    } else if(assignment.actual.score && assignment.actual.total === 0) {
                        points += parseFloat(assignment.actual.score) * assignment.weight;
                    } else if(assignment.actual.total && category.name == name) {
                        total += parseFloat(assignment.actual.total) * assignment.weight;
                    }
                }
            });

            const weight = edit ? parseFloat(category.edit.weight) : parseFloat(category.weight);

            if(category.name == name) {
                totalPercent += (weight / 100);
                neededPoints = total;
                neededWeight = (weight / 100);
            } else if(total != 0) {
                percent += (points / total) * (weight / 100);
                totalPercent += (weight / 100);
            } else if(category.name != name) {
                percent += (weight / 100);
                totalPercent += (weight / 100);
            }
        });

        neededPercent = (((parseFloat(finalGrade) / 100) * totalPercent) - percent) / neededWeight;

        if(neededPoints == 0) {
            return Math.ceil(neededPercent * 100) + "%";
        } else if(neededPercent <= 0) {
            return "0%";
        } else {
            let requiredPoints = Math.ceil(neededPoints * neededPercent);

            return Math.ceil(neededPercent * 100) + "% (" + requiredPoints + "/" + neededPoints + ")";
        }        
    }

    function isFinalCategory(name) {
        const keywords = $settings.keywords.split(", "); 
        
        for(let i = 0; i < keywords.length; i++) {
            let keyword = keywords[i].trim();

            if(name.toLowerCase().includes(keyword.toLowerCase())) {
                return true;
            }
        }

        return false;
    }

    let height = 0;

    let graphOpen = false;
</script>

{#if disabled}
    <div class="p-4 {$settings.mode == 'dark' ? "bg-zinc-900 text-white" : $settings.mode == 'light' ? "bg-zinc-100 text-black" : "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white"} rounded-br-2xl">
        <button on:click|preventDefault={() => { disabled = !disabled; }} class="px-4 py-2 {$settings.mode == "dark" ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"} rounded-md">
            Show Aeries Grades+
        </button>
    </div>
{:else}
    <div bind:clientWidth={width} class="p-8 {$settings.mode == 'dark' ? "bg-zinc-900 text-white" : $settings.mode == 'light' ? "bg-zinc-100 text-black" : "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white"} h-full w-full relative">
        {#if graphOpen}
            <button transition:fade={{ duration: 100 }} on:click|preventDefault|stopPropagation={() => { graphOpen = false; }} aria-label="Close Settings" class="{$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-25" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-25" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-25 dark:bg-opacity-25 "}  w-full h-full absolute z-[8] left-0 top-0">

            </button>

            <div transition:fade={{ duration: 100 }} class="fixed z-[9] p-6 {$settings.mode == 'dark' ? "bg-zinc-900" : $settings.mode == 'light' ? "bg-zinc-100" : "bg-zinc-100 dark:bg-zinc-900"} rounded-3xl max-w-[calc(100%-2rem)] w-[36rem] min-h-[24rem] max-h-[calc(100%-6rem)] top-[6.5rem] translate-x-1/2 overflow-auto" style="right: {width / 2}px;">
                <p class="text-2xl font-bold mb-4">Graph</p>

                {#if gradeHistory.length > 0}
                    <div class="w-[calc(100%+4rem)] -mx-6 overflow-hidden">
                        {#if !loading}
                            <LineChart mode={$settings.mode} stats={gradeHistory} />
                        {/if}
                    </div>
                {:else}
                    <p class="text-center my-[8rem] font-bold text-lg  {$settings.mode == 'dark' ? "text-red-400 " : $settings.mode == 'light' ? "text-red-700": "text-red-700 dark:text-red-400 "}">No assignments.</p>
                {/if}

                <p class="mt-6 text-sm opacity-75 italic">
                    This graph shows your grade history over time. It is calculated based off when each assignment was due. 
                </p>

                <button aria-label="Close Settings" on:click|preventDefault={() => { graphOpen = false }} class="p-1 transition-all rounded-full {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"} absolute top-6 right-6">
                    <div class="{$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                        <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                    </div>
                </button>
            </div>
        {/if}

        <div class="flex items-center justify-between">
            <a class="px-4 py-3 rounded-md {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}" href={location.href.substring(0, location.href.lastIndexOf("/") + 1) + "GradebookSummary.aspx"}>
                <div class="inline-block -mt-2 translate-y-2 scale-90 mr-1 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/></svg>
                </div>
                All Grades
            </a>
            <div class="flex gap-2">
                {#if $settings.developer == "on"}
                    <button on:click|preventDefault={() => { disabled = !disabled; }} class="px-4 py-3 transition-all rounded-md  {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}">
                        Hide
                        <div class="inline-block ml-1.5 translate-y-0.5 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                            <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px"><path d="m177-120-57-57 184-183H200v-80h240v240h-80v-104L177-120Zm343-400v-240h80v104l183-184 57 57-184 183h104v80H520Z"/></svg>
                        </div>
                    </button>
                {/if}
                <button on:click|preventDefault={() => { graphOpen = !graphOpen; }} class="px-4 py-3 transition-all rounded-md  {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}">
                    Graph
                    <div class="inline-block ml-1.5 translate-y-0.5 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                        <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px"><path d="m105-399-65-47 200-320 120 140 160-260 120 180 135-214 65 47-198 314-119-179-152 247-121-141-145 233Zm475 159q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29ZM784-80 676-188q-21 14-45.5 21t-50.5 7q-75 0-127.5-52.5T400-340q0-75 52.5-127.5T580-520q75 0 127.5 52.5T760-340q0 26-7 50.5T732-244l108 108-56 56Z"/></svg>
                    </div>
                </button>
                <button on:click|preventDefault={() => { edit = !edit; }} class="px-4 py-3 transition-all rounded-md  {$settings.mode == 'dark' ? (edit ? "text-black bg-zinc-100" : "bg-opacity-10 bg-zinc-100")  : $settings.mode == 'light' ? (edit ? "text-white bg-zinc-900" : "bg-opacity-10 bg-zinc-900") : (edit ? "text-white dark:text-black bg-zinc-900 dark:bg-zinc-100" : "bg-opacity-10 dark:bg-opacity-10 bg-zinc-900 dark:bg-zinc-100")}">
                    Edit
                    <div class="inline-block ml-1.5 translate-y-0.5 {$settings.mode == 'dark' ? (edit ? "fill-black" : "fill-white") : $settings.mode == 'light' ? (edit ? "fill-white" : "fill-black") : (edit ? "fill-white dark:fill-black" : "fill-black dark:fill-white")}">
                        <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                    </div>
                </button>
            </div>
        </div>

        {#if error}
            <div class="mt-6 w-full bg-red-500 bg-opacity-30 px-5 py-4 rounded-md flex items-start">
                <div class="scale-75 mr-3 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                    <svg xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 -960 960 960" width="36px"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
                </div>
                <div class="mr-2">
                    <p class="font-bold text-lg mb-1">Oops! An error was detected on this page.</p>
                    {#if expandError}
                        <div transition:slide|local>
                            <p class="mb-2.5">Scores on some assignments are not being interpreted correctly, causing scores to be shown incorrectly. While overall grades may still be correct, there might be a different grade once scores are recalculated on the edit page.</p>
                            <div class="flex gap-1.5 flex-wrap">
                                <button on:click|preventDefault={() => { disabled = !disabled; }} class="px-4 py-2 {$settings.mode == 'dark' ? "text-white bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "text-black bg-zinc-900 bg-opacity-10" : "text-black dark:text-white bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"} rounded-md">
                                    Hide Aeries Grades+
                                </button>
                                <a href="https://docs.google.com/forms/d/e/1FAIpQLScMri2JCO1lXSXup-gbzKg-5OaOeiDh8e_R09Zh0EU8z7J8qg/viewform" class="px-4 py-2 {$settings.mode == 'dark' ? "text-white bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "text-black bg-zinc-900 bg-opacity-10" : "text-black dark:text-white bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"} rounded-md">
                                    Report Issue
                                </a>
                            </div>
                        </div>
                    {:else}
                        <p transition:slide>Some scores on assignments may not reflect their actual scores.</p>
                    {/if}
                </div>
                <button aria-label="More Details" on:click|preventDefault={() => { expandError = !expandError; }} class="p-2 rounded-full {$settings.mode == 'dark' ? "text-white bg-zinc-100 bg-opacity-10 fill-white" : $settings.mode == 'light' ? "text-black bg-zinc-900 bg-opacity-10 fill-black" : "text-black dark:text-white bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10 fill-black dark:fill-white"} ml-auto">
                    {#if expandError}
                        <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px"><path d="m296-80-56-56 240-240 240 240-56 56-184-184L296-80Zm184-504L240-824l56-56 184 184 184-184 56 56-240 240Z"/></svg>
                    {:else}
                        <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px"><path d="M480-80 240-320l57-57 183 183 183-183 57 57L480-80ZM298-584l-58-56 240-240 240 240-58 56-182-182-182 182Z"/></svg>
                    {/if}
                </button>
            </div>
        {/if}

        {#if loading}
            <div class="w-full mt-8 mb-2 p-4 flex items-center justify-around">
                <p class="text-xl font-bold">Loading...</p>
            </div>
        {:else}
            <div bind:clientHeight={height} class="absolute {$settings.mode == 'dark' ? "bg-zinc-900" : $settings.mode == 'light' ? "bg-zinc-100" : "bg-zinc-100 dark:bg-zinc-900"} z-[7] w-[calc(100%-4rem)]" style="margin-bottom: calc({height}px - 4rem)">
                <div class="flex items-center justify-between mb-2 mt-8">
                    <h1 class="text-3xl">{period.name}</h1>
                    {#if edit}
                        <div class="flex items-center">
                            {#if Math.floor(period.edit * 100) / 100 != period.grade}
                                <div class="scale-[.65] {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                                </div>
                            {/if}
                            <p class="text-2xl font-bold {
                            $settings.mode == 'dark' ? (period.edit >= 90 ? "text-green-400" : period.edit >= 80 ? "text-yellow-400" : period.edit >= 70 ? "text-orange-400" : period.edit > 0 ? "text-red-400" : "ext-white") : 
                            $settings.mode == 'light' ? (period.edit >= 90 ? "text-green-700" : period.edit >= 80 ? "text-yellow-700" : period.edit >= 70 ? "text-orange-500" : period.edit > 0 ? "text-red-700" : "text-black") : 
                            (period.edit >= 90 ? "text-green-700 dark:text-green-400" : period.edit >= 80 ? "text-yellow-700 dark:text-yellow-400" : period.edit >= 70 ? "text-orange-500 dark:text-orange-400" : period.edit > 0 ? "text-red-700 dark:text-red-400" : "text-black dark:text-white")}">{Math.floor(period.edit * 100) / 100}%</p>
                        </div>
                    {:else}
                        <p class="text-2xl font-bold {
                        $settings.mode == 'dark' ? (period.grade >= 90 ? "text-green-400" : period.grade >= 80 ? "text-yellow-400" : period.grade >= 70 ? "text-orange-400" : period.grade > 0 ? "text-red-400" : "ext-white") : 
                        $settings.mode == 'light' ? (period.grade >= 90 ? "text-green-700" : period.grade >= 80 ? "text-yellow-700" : period.grade >= 70 ? "text-orange-500" : period.grade > 0 ? "text-red-700" : "text-black") : 
                        (period.grade >= 90 ? "text-green-700 dark:text-green-400" : period.grade >= 80 ? "text-yellow-700 dark:text-yellow-400" : period.grade >= 70 ? "text-orange-500 dark:text-orange-400" : period.grade > 0 ? "text-red-700 dark:text-red-400" : "text-black dark:text-white")}">{period.letter} ({period.grade}%)</p>
                    {/if}   
                </div>

                <div class="flex flex-wrap items-center mb-4">
                    <p>{period.slot}</p>
                    <div class="h-1.5 w-1.5 {$settings.mode == 'dark' ? "bg-zinc-100" : $settings.mode == 'light' ? "bg-zinc-900" : "bg-zinc-900 dark:bg-zinc-100"} rounded-full mx-2"></div>
                    <p>{period.teacher}</p>
                    <div class="h-1.5 w-1.5 {$settings.mode == 'dark' ? "bg-zinc-100" : $settings.mode == 'light' ? "bg-zinc-900" : "bg-zinc-900 dark:bg-zinc-100"} rounded-full mx-2"></div>
                    <p>{period.email}</p>
                </div>
            </div>

            <div class="w-full" style="height: calc({height}px - 3.25rem)">

            </div>

            <div class="sticky w-full h-[3.25rem] z-[6] top-0 pt-4 {$settings.mode == 'dark' ? "bg-zinc-900" : $settings.mode == 'light' ? "bg-zinc-100" : "bg-zinc-100 dark:bg-zinc-900"}">
                <div class="flex items-center justify-between h-full">
                    <h1 class="text-2xl">{period.name}</h1>
                    <div class="flex items-center gap-2">
                        {#if $settings.developer == "on"}
                            <button on:click|preventDefault={() => { disabled = !disabled; }} class="px-3.5 py-1 transition-all rounded-md  {$settings.mode == 'dark' ? "bg-opacity-10 bg-zinc-100"  : $settings.mode == 'light' ? "bg-opacity-10 bg-zinc-900" : "bg-opacity-10 dark:bg-opacity-10 bg-zinc-900 dark:bg-zinc-100"}">
                                <span class="hidden sm:inline mr-1">Hide</span>
                                <div class="inline-block translate-y-0.5 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px"><path d="m177-120-57-57 184-183H200v-80h240v240h-80v-104L177-120Zm343-400v-240h80v104l183-184 57 57-184 183h104v80H520Z"/></svg>
                                </div>
                            </button>
                        {/if}
                        <button on:click|preventDefault={() => { graphOpen = !graphOpen; }} class="px-3.5 py-1 transition-all rounded-md  {$settings.mode == 'dark' ? "bg-opacity-10 bg-zinc-100"  : $settings.mode == 'light' ? "bg-opacity-10 bg-zinc-900" : "bg-opacity-10 dark:bg-opacity-10 bg-zinc-900 dark:bg-zinc-100"}">
                            <span class="hidden sm:inline mr-1">Graph</span>
                            <div class="inline-block translate-y-0.5 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                                <svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px"><path d="m105-399-65-47 200-320 120 140 160-260 120 180 135-214 65 47-198 314-119-179-152 247-121-141-145 233Zm475 159q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29ZM784-80 676-188q-21 14-45.5 21t-50.5 7q-75 0-127.5-52.5T400-340q0-75 52.5-127.5T580-520q75 0 127.5 52.5T760-340q0 26-7 50.5T732-244l108 108-56 56Z"/></svg>
                            </div>
                        </button>
                        <button on:click|preventDefault={() => { edit = !edit; }} class="px-3.5 py-1 transition-all rounded-md  {$settings.mode == 'dark' ? (edit ? "text-black bg-zinc-100" : "bg-opacity-10 bg-zinc-100")  : $settings.mode == 'light' ? (edit ? "text-white bg-zinc-900" : "bg-opacity-10 bg-zinc-900") : (edit ? "text-white dark:text-black bg-zinc-900 dark:bg-zinc-100" : "bg-opacity-10 dark:bg-opacity-10 bg-zinc-900 dark:bg-zinc-100")}">
                            <span class="hidden sm:inline mr-1">Edit</span>
                            <div class="inline-block translate-y-0.5 {$settings.mode == 'dark' ? (edit ? "fill-black" : "fill-white") : $settings.mode == 'light' ? (edit ? "fill-white" : "fill-black") : (edit ? "fill-white dark:fill-black" : "fill-black dark:fill-white")}">
                                <svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                            </div>
                        </button>
                        <div class="sm:min-w-[10rem] flex flex-row-reverse">
                            {#if edit}
                                <div class="flex items-center">
                                    {#if Math.floor(period.edit * 100) / 100 != period.grade}
                                        <div class="scale-[.65] {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                                        </div>
                                    {/if}
                                    <p class="text-xl font-bold {
                                    $settings.mode == 'dark' ? (period.edit >= 90 ? "text-green-400" : period.edit >= 80 ? "text-yellow-400" : period.edit >= 70 ? "text-orange-400" : period.edit > 0 ? "text-red-400" : "ext-white") : 
                                    $settings.mode == 'light' ? (period.edit >= 90 ? "text-green-700" : period.edit >= 80 ? "text-yellow-700" : period.edit >= 70 ? "text-orange-500" : period.edit > 0 ? "text-red-700" : "text-black") : 
                                    (period.edit >= 90 ? "text-green-700 dark:text-green-400" : period.edit >= 80 ? "text-yellow-700 dark:text-yellow-400" : period.edit >= 70 ? "text-orange-500 dark:text-orange-400" : period.edit > 0 ? "text-red-700 dark:text-red-400" : "text-black dark:text-white")}">{Math.floor(period.edit * 100) / 100}%</p>
                                </div>
                            {:else}
                                <p class="text-xl font-bold {
                                $settings.mode == 'dark' ? (period.grade >= 90 ? "text-green-400" : period.grade >= 80 ? "text-yellow-400" : period.grade >= 70 ? "text-orange-400" : period.grade > 0 ? "text-red-400" : "ext-white") : 
                                $settings.mode == 'light' ? (period.grade >= 90 ? "text-green-700" : period.grade >= 80 ? "text-yellow-700" : period.grade >= 70 ? "text-orange-500" : period.grade > 0 ? "text-red-700" : "text-black") : 
                                (period.grade >= 90 ? "text-green-700 dark:text-green-400" : period.grade >= 80 ? "text-yellow-700 dark:text-yellow-400" : period.grade >= 70 ? "text-orange-500 dark:text-orange-400" : period.grade > 0 ? "text-red-700 dark:text-red-400" : "text-black dark:text-white")}">{period.letter} ({period.grade}%)</p>
                            {/if}  
                        </div>
                    </div> 
                </div>
            </div>

            <!-- Cannot use .grid since it will collide with another grid with class .grid aeries uses for dashboard. -->
            {#each categories as category, j}
                {#if category.fake == false || edit}
                    {@const final = isFinalCategory(category.name)}
                    <div class="border-b z-[5] sticky top-[3.25rem] px-4 {$settings.mode == 'dark' ? "bg-zinc-900 border-gray-700" : $settings.mode == 'light' ? "bg-zinc-100 border-gray-300" : "bg-zinc-100 dark:bg-zinc-900 border-gray-300 dark:border-gray-700"} p-5 pt-4">
                        <div class="mb-3 flex -ml-4 -mr-4 items-center justify-between h-8">
                            {#if edit}
                                <div class="flex items-center">
                                    <h1 class="text-xl font-extrabold tracking-wide">
                                        {#if category.fake}
                                            <input bind:value={category.name} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} placeholder="Untitled" class="w-48 px-2 rounded-md py-1 -my-1 mr-1 text-left {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}">(
                                        {:else}
                                            {category.name} (
                                        {/if}
                                        <input bind:value={category.edit.weight} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-16 px-2 rounded-md py-1 -my-1 text-center {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}">
                                    %)</h1>
                                    {#if category.fake}
                                        <button aria-label="Delete" on:click|preventDefault|stopPropagation={() => { categories.splice(j, 1); categories = categories; }} class="scale-75 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"} -my-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                                        </button>
                                    {:else if category.weight != category.edit.weight}
                                        <button aria-label="Reset" on:click|preventDefault|stopPropagation={() => { category.edit.weight = category.weight; }} class="scale-75 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"} -my-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
                                        </button>
                                    {/if}
                                </div>
                            {:else}
                                <h1 class="text-xl font-extrabold tracking-wide">{category.name} ({category.weight}%)</h1>
                            {/if}
                            <div class="text-right">
                                {#if isNaN(category.edit.percent) || (category.assignments.filter(assignment => assignment.fake == true).length == category.assignments.length && !edit)}
                                    <p class="text-lg font-bold">No Grade</p>
                                {:else if category.edit.total == 0}
                                    <p class="text-lg font-bold">Invalid</p>
                                {:else}
                                    {#if edit}
                                        <div class="flex items-center">
                                            {#if Math.round(category.edit.points * 100) / 100 != category.points || Math.round(category.edit.total) != category.total}
                                                <div class="scale-[.65] {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                                                </div>
                                            {/if}
                                            <p class="text-lg font-bold {
                                            $settings.mode == 'dark' ? (category.edit.percent >= 90 ? "text-green-400" : category.edit.percent >= 80 ? "text-yellow-400" : category.edit.percent >= 70 ? "text-orange-400" : category.edit.percent > 0 ? "text-red-400" : "ext-white") : 
                                            $settings.mode == 'light' ? (category.edit.percent >= 90 ? "text-green-700" : category.edit.percent >= 80 ? "text-yellow-700" : category.edit.percent >= 70 ? "text-orange-500" : category.edit.percent > 0 ? "text-red-700" : "text-black") : 
                                            (category.edit.percent >= 90 ? "text-green-700 dark:text-green-400" : category.edit.percent >= 80 ? "text-yellow-700 dark:text-yellow-400" : category.edit.percent >= 70 ? "text-orange-500 dark:text-orange-400" : category.edit.percent > 0 ? "text-red-700 dark:text-red-400" : "text-black dark:text-white")}">
                                                {Math.floor(category.edit.percent * 100) / 100}% ({Math.floor(category.edit.points * 100) / 100}/{Math.floor(category.edit.total * 100) / 100})
                                            </p>
                                        </div>
                                    {:else}     
                                        <p class="text-lg font-bold {
                                        $settings.mode == 'dark' ? (category.percent >= 90 ? "text-green-400" : category.percent >= 80 ? "text-yellow-400" : category.percent >= 70 ? "text-orange-400" : category.percent > 0 ? "text-red-400" : "ext-white") : 
                                        $settings.mode == 'light' ? (category.percent >= 90 ? "text-green-700" : category.percent >= 80 ? "text-yellow-700" : category.percent >= 70 ? "text-orange-500" : category.percent > 0 ? "text-red-700" : "text-black") : 
                                        (category.percent >= 90 ? "text-green-700 dark:text-green-400" : category.percent >= 80 ? "text-yellow-700 dark:text-yellow-400" : category.percent >= 70 ? "text-orange-500 dark:text-orange-400" : category.percent > 0 ? "text-red-700 dark:text-red-400" : "text-black dark:text-white")}">
                                            {category.percent}% ({category.points}/{category.total})
                                        </p>
                                    {/if}
                                {/if}
                            </div>
                        </div>
                        <div class="opacity-75 flex items-center -mb-2.5">
                            {#if width > 1000}
                                <p class="w-[40%]">Name</p>
                                <p class="w-[15%]">Due</p>
                                <p class="w-[15%]">Completed</p>
                                <p class="w-[10%]">Percent</p>
                                <p class="w-[20%]">
                                    Score
                                </p>
                            {:else if width > 800}
                                <p class="w-1/3">Name</p>
                                <p class="w-1/5">Due</p>
                                <p class="w-1/6">Percent</p>
                                <p class="w-1/6">
                                    Score
                                </p>
                            {:else if width > 640}
                                <p class="w-1/2">Name</p>
                                <p class="w-1/6">Perecent</p>
                                <p class="w-2/6">
                                    Score
                                </p>
                            {:else}
                                <p class="w-[62%]">Name</p>
                                <p class="w-[38%]">
                                    Score
                                </p>
                            {/if}
                        </div>
                    </div>

                    {#if final}
                        {@const resultActual = calculateFinal(categories, category.name, finalGrade, false)}
                        {@const resultEdited = calculateFinal(categories, category.name, finalGrade, true)}
                        <div class="w-full text-left mt-2 rounded-md px-5 py-4 bg-blue-400 bg-opacity-30 flex items-start">
                            <div class="{$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"} mr-3 mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-80q-33 0-56.5-23.5T200-160v-400q0-33 23.5-56.5T280-640h400q33 0 56.5 23.5T760-560v400q0 33-23.5 56.5T680-80H280Zm160-60h80v-60h-80v60Zm0-100h80q0-23 15.5-46t34.5-47q19-25 34.5-51t15.5-56q0-58-41-99t-99-41q-58 0-99 41t-41 99q0 30 15.5 56t34.5 51q19 24 34.5 47t15.5 46ZM240-700q0-25 17.5-42.5T300-760h360q25 0 42.5 17.5T720-700H240Zm40-120q0-25 17.5-42.5T340-880h280q25 0 42.5 17.5T680-820H280Z"/></svg>
                            </div>
                            <div class="mr-2">
                                <div class="text-lg font-bold mb-1">To get a 
                                    
                                    <div class="relative inline-block">
                                        <input bind:value={finalGrade} name="final" id="final" class="{$settings.mode == 'dark' ? "text-white bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "text-black bg-zinc-900 bg-opacity-10" : "text-black dark:text-white bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"} rounded-md text-lg px-3 py-0.5 -my-1 -mr-1  bg-none max-w-[4rem] text-center"/>
                                    </div>
                                    
                                    , you need to get at least 

                                    {#if resultActual != resultEdited && edit}
                                        <div class="inline-block translate-y-0.5 -mr-0.5 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                                            <svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                                        </div>
                                    {/if}
                                    
                                    {edit ? resultEdited : resultActual} in this category.</div>
                                <p class="">Assuming all other cateogories stay at the same grade. Categories with no grade will default at 100% for this calculation.</p>
                            </div>
                        </div>
                    {/if}
                    
                    <div class="mb-8 relative">
                        {#each category.assignments as assignment, i}
                            {#if assignment.fake == false}
                                <button on:click|preventDefault|stopPropagation={() => { assignment.open = !assignment.open; }} class="w-full px-4 text-left mt-2 {(assignment.missing || (zeros && assignment.actual.score == 0 && assignment.percent != - 1)) && (!edit || (assignment.edit.score == 0)) ? "bg-red-500 dark:bg-red-500 bg-opacity-20 dark:bg-opacity-20" : $settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"} rounded-md p-3">
                                    <div class="flex items-center">
                                        {#if width > 1000}
                                            <p class="w-[40%] pr-4">{assignment.name}{(assignment.missing || (zeros && assignment.actual.score == 0 && assignment.percent != - 1)) && (!edit || (assignment.edit.score == 0)) ? (assignment.missing ? " - Missing" : " - Zero") : ""}</p>
                                            <p class="w-[15%]">{assignment.due == "n/a" ? "" : dnt.format(assignment.due, "MM/DD/YYYY")}</p>
                                            <p class="w-[15%]">{assignment.completed == "n/a" ? "" : dnt.format(assignment.completed, "MM/DD/YYYY")}</p>
                                            <p class="w-[10%]">
                                                {#if edit}
                                                    {!(assignment.edit.score || assignment.edit.score === 0) || !assignment.edit.total ? "" : (assignment.edit.score / assignment.edit.total * 100).toFixed(2) + "%"}
                                                {:else}
                                                    {assignment.percent == -1 || assignment.actual.total == 0 ? "" : assignment.percent + "%"}
                                                {/if}
                                            </p>
                                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                                            <div on:click|stopPropagation|preventDefault class="w-[20%] {edit ? "p-1.5 -my-1.5" : ""}">
                                                {#if edit}
                                                    <div class="flex items-center">
                                                        <div class="w-fit h-full rounded-md {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}">
                                                            <input bind:value={assignment.edit.score} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-right mx-[0.22rem] bg-zinc-100 bg-opacity-0">/
                                                            <input bind:value={assignment.edit.total} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-left mr-[0.22rem] bg-zinc-100 bg-opacity-0">
                                                        </div>
                                                        {#if assignment.weight != 1 && assignment.actual.total != 0}
                                                            <span class="text-sm opacity-80 ml-1.5">
                                                                x{Math.round(assignment.weight * 100) / 100}   
                                                            </span>
                                                        {/if}
                                                        {#if ((assignment.edit.score != assignment.actual.score && assignment.percent != -1) || (assignment.edit.score > 0 && assignment.percent == -1)) || assignment.edit.total != assignment.actual.total }
                                                            <!-- svelte-ignore node_invalid_placement_ssr -->
                                                            <button aria-label="Reset" on:click={() => {
                                                                if(assignment.percent != -1) {
                                                                    assignment.edit.score = assignment.actual.score; 
                                                                    assignment.edit.total = assignment.actual.total;
                                                                } else {
                                                                    assignment.edit.score = "";
                                                                    assignment.edit.total = assignment.actual.total;
                                                                }
                                                            }} class="scale-75 mr-2 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"} -my-0.5">
                                                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
                                                            </button>
                                                        {/if}
                                                    </div>
                                                {:else}
                                                    {#if assignment.percent == -1 && assignment.actual.total == 0}
                                                        - / -
                                                    {:else}
                                                        {assignment.percent == -1 ? "-" : assignment.actual.score}/{assignment.actual.total}
                                                        {#if assignment.weight != 1}
                                                            <span class="text-sm opacity-80 ml-0.5">
                                                                x{Math.round(assignment.weight * 100) / 100}   
                                                            </span>
                                                        {/if}
                                                    {/if}
                                                {/if}
                                            </div>
                                        {:else if width > 800}
                                            <p class="w-1/3 pr-4">{assignment.name}{(assignment.missing || (zeros && assignment.actual.score == 0 && assignment.percent != - 1)) && (!edit || (assignment.edit.score == 0)) ? (assignment.missing ? " - Missing" : " - Zero") : ""}</p>
                                            
                                            <p class="w-1/5">{assignment.due == "n/a" ? "" : dnt.format(assignment.due, "MM/DD/YYYY")}</p>
                                            <p class="w-1/6">
                                                {#if edit}
                                                    {!(assignment.edit.score || assignment.edit.score === 0) || !assignment.edit.total ? "" : (assignment.edit.score / assignment.edit.total * 100).toFixed(2) + "%"}
                                                {:else}
                                                    {assignment.percent == -1 || assignment.actual.total == 0 ? "" : assignment.percent + "%"}
                                                {/if}
                                            </p>
                                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                                            <div on:click|stopPropagation|preventDefault class="w-[25%] {edit ? "p-1.5 -my-1.5" : ""}">
                                                {#if edit}
                                                    <div class="flex items-center">
                                                        <div class="w-fit h-full rounded-md {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}">
                                                            <input bind:value={assignment.edit.score} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-right mx-[0.22rem] bg-zinc-100 bg-opacity-0">/
                                                            <input bind:value={assignment.edit.total} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-left mr-[0.22rem] bg-zinc-100 bg-opacity-0">
                                                        </div>
                                                        {#if assignment.weight != 1 && assignment.actual.total != 0}
                                                            <span class="text-sm opacity-80 ml-1.5">
                                                                x{Math.round(assignment.weight * 100) / 100}   
                                                            </span>
                                                        {/if}
                                                        {#if ((assignment.edit.score != assignment.actual.score && assignment.percent != -1) || (assignment.edit.score > 0 && assignment.percent == -1)) || assignment.edit.total != assignment.actual.total }
                                                            <!-- svelte-ignore node_invalid_placement_ssr -->
                                                            <button aria-label="Reset" on:click={() => {
                                                                if(assignment.percent != -1) {
                                                                    assignment.edit.score = assignment.actual.score; 
                                                                    assignment.edit.total = assignment.actual.total;
                                                                } else {
                                                                    assignment.edit.score = "";
                                                                    assignment.edit.total = assignment.actual.total;
                                                                }
                                                            }} class="scale-75 mr-2 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"} -my-0.5">
                                                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
                                                            </button>
                                                        {/if}
                                                    </div>
                                                {:else}
                                                    {#if assignment.percent == -1 && assignment.actual.total == 0}
                                                        - / -
                                                    {:else}
                                                        {assignment.percent == -1 ? "-" : assignment.actual.score}/{assignment.actual.total}
                                                        {#if assignment.weight != 1 && assignment.actual.total != 0}
                                                            <span class="text-sm opacity-80 ml-0.5">
                                                                x{Math.round(assignment.weight * 100) / 100}   
                                                            </span>
                                                        {/if}
                                                    {/if}
                                                {/if}
                                            </div>
                                        {:else if width > 640}
                                            <p class="w-1/2 pr-4">{assignment.name}{(assignment.missing || (zeros && assignment.actual.score == 0 && assignment.percent != - 1)) && (!edit || (assignment.edit.score == 0)) ? (assignment.missing ? " - Missing" : " - Zero") : ""}</p>
                                            <p class="w-1/6">
                                                {#if edit}
                                                    {!(assignment.edit.score || assignment.edit.score === 0) || !assignment.edit.total ? "" : (assignment.edit.score / assignment.edit.total * 100).toFixed(2) + "%"}
                                                {:else}
                                                    {assignment.percent == -1 || assignment.actual.total == 0 ? "" : assignment.percent + "%"}
                                                {/if}
                                            </p>
                                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                                            <div on:click|stopPropagation|preventDefault class="w-2/6 {edit ? "p-1.5 -my-1.5" : ""}">
                                                {#if edit}
                                                    <div class="flex items-center">
                                                        <div class="w-fit h-full rounded-md {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}">
                                                            <input bind:value={assignment.edit.score} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-right mx-[0.22rem] bg-zinc-100 bg-opacity-0">/
                                                            <input bind:value={assignment.edit.total} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-left mr-[0.22rem] bg-zinc-100 bg-opacity-0">
                                                        </div>
                                                        {#if assignment.weight != 1 && assignment.actual.total != 0}
                                                            <span class="text-sm opacity-80 ml-1.5">
                                                                x{Math.round(assignment.weight * 100) / 100}   
                                                            </span>
                                                        {/if}
                                                        {#if ((assignment.edit.score != assignment.actual.score && assignment.percent != -1) || (assignment.edit.score > 0 && assignment.percent == -1)) || assignment.edit.total != assignment.actual.total }
                                                            <!-- svelte-ignore node_invalid_placement_ssr -->
                                                            <button aria-label="Reset" on:click={() => {
                                                                if(assignment.percent != -1) {
                                                                    assignment.edit.score = assignment.actual.score; 
                                                                    assignment.edit.total = assignment.actual.total;
                                                                } else {
                                                                    assignment.edit.score = "";
                                                                    assignment.edit.total = assignment.actual.total;
                                                                }
                                                            }} class="scale-75 mr-2 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"} -my-0.5">
                                                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
                                                            </button>
                                                        {/if}
                                                    </div>
                                                {:else}
                                                    {#if assignment.percent == -1 && assignment.actual.total == 0}
                                                        - / -
                                                    {:else}
                                                        {assignment.percent == -1 ? "-" : assignment.actual.score}/{assignment.actual.total}
                                                        {#if assignment.weight != 1 && assignment.actual.total != 0}
                                                            <span class="text-sm opacity-80 ml-0.5">
                                                                x{Math.round(assignment.weight * 100) / 100}   
                                                            </span>
                                                        {/if}
                                                    {/if}
                                                {/if}
                                            </div>
                                        {:else}
                                            <p class="w-[62%] pr-4">{assignment.name}{(assignment.missing || (zeros && assignment.actual.score == 0 && assignment.percent != - 1)) && (!edit || (assignment.edit.score == 0)) ? (assignment.missing ? " - Missing" : " - Zero") : ""}</p>
                                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                                            <div on:click|stopPropagation|preventDefault class="w-[38%] {edit ? "p-1.5 -my-1.5" : ""}">
                                                {#if edit}
                                                    <div class="flex items-center">
                                                        <div class="w-fit h-full rounded-md {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}">
                                                            <input bind:value={assignment.edit.score} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-right mx-[0.22rem] bg-zinc-100 bg-opacity-0">/
                                                            <input bind:value={assignment.edit.total} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-left mr-[0.22rem] bg-zinc-100 bg-opacity-0">
                                                        </div>
                                                        {#if assignment.weight != 1}
                                                            <span class="text-sm opacity-80 ml-1.5">
                                                                x{Math.round(assignment.weight * 100) / 100}   
                                                            </span>
                                                        {/if}
                                                        {#if ((assignment.edit.score != assignment.actual.score && assignment.percent != -1) || (assignment.edit.score > 0 && assignment.percent == -1)) || assignment.edit.total != assignment.actual.total }
                                                            <!-- svelte-ignore node_invalid_placement_ssr -->
                                                            <button aria-label="Reset" on:click={() => {
                                                                if(assignment.percent != -1) {
                                                                    assignment.edit.score = assignment.actual.score; 
                                                                    assignment.edit.total = assignment.actual.total;
                                                                } else {
                                                                    assignment.edit.score = "";
                                                                    assignment.edit.total = assignment.actual.total;
                                                                }
                                                            }} class="scale-75 mr-2 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"} -my-0.5">
                                                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
                                                            </button>
                                                        {/if}
                                                    </div>
                                                {:else}
                                                    {#if assignment.percent == -1 && assignment.actual.total == 0}
                                                        - / -
                                                    {:else}
                                                        {assignment.percent == -1 ? "-" : assignment.actual.score}/{assignment.actual.total}
                                                        {#if assignment.weight != 1}
                                                            <span class="text-sm opacity-80 ml-0.5">
                                                                x{Math.round(assignment.weight * 100) / 100}   
                                                            </span>
                                                        {/if}
                                                    {/if}
                                                {/if}
                                            </div>
                                        {/if}
                                    </div>
                                    {#if assignment.open}
                                        <div transition:slide>
                                            <div class="w-full h-2"></div>
                                            <hr class="{$settings.mode == 'dark' ? "border-gray-700" : $settings.mode == 'light' ? "border-gray-300" : "border-gray-300 dark:border-gray-700"}">
                                            <div class="flex flex-wrap items-center mt-2">
                                                {#if assignment.assigned != "n/a"}
                                                    <p>Assigned {dnt.format(assignment.assigned, "MM/DD/YYYY")}</p>
                                                    {#if width <= 1000} 
                                                        <div class="h-1.5 w-1.5 {$settings.mode == 'dark' ? "bg-zinc-100" : $settings.mode == 'light' ? "bg-zinc-900" : "bg-zinc-900 dark:bg-zinc-100"} rounded-full mx-2"></div>
                                                    {/if}
                                                {/if}
                                                {#if assignment.due != "n/a" && width < 1000}
                                                    <p>Due {dnt.format(assignment.due, "MM/DD/YYYY")}</p>
                                                    {#if width <= 800} 
                                                        <div class="h-1.5 w-1.5 {$settings.mode == 'dark' ? "bg-zinc-100" : $settings.mode == 'light' ? "bg-zinc-900" : "bg-zinc-900 dark:bg-zinc-100"} rounded-full mx-2"></div>
                                                    {/if}
                                                {/if}
                                                {#if assignment.completed != "n/a" && width <= 800}
                                                    <p>Completed {dnt.format(assignment.completed, "MM/DD/YYYY")}</p>
                                                    {#if width <= 640} 
                                                        <div class="h-1.5 w-1.5 {$settings.mode == 'dark' ? "bg-zinc-100" : $settings.mode == 'light' ? "bg-zinc-900" : "bg-zinc-900 dark:bg-zinc-100"} rounded-full mx-2"></div>
                                                    {/if}
                                                {/if}
                                                {#if assignment.percent != -1 && width <= 640}
                                                    <p>Scored {assignment.percent + "%"}</p>
                                                {/if}
                                            </div>
                                            {#if assignment.description.trim() != ""}
                                                <p class="pt-2">
                                                    {assignment.description}
                                                </p>
                                            {/if}
                                        </div>
                                    {/if}
                                </button>
                            {:else if edit || 'final' in assignment}
                                <div class="w-full px-4 text-left mt-2 flex rounded-md p-3 {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}">
                                    {#if width > 1000}
                                        <p class="w-[40%]">
                                            <input bind:value={assignment.name} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} placeholder="Untitled" class="w-full bg-zinc-100 bg-opacity-0">
                                        </p>
                                        <div class="w-[15%]"></div>
                                        <div class="w-[15%]"></div>
                                        <p class="w-[10%]">
                                            {!assignment.edit.score || (assignment.edit.total == "0" || assignment.edit.total == 0) ? "" : (assignment.edit.score / assignment.edit.total * 100).toFixed(2) + "%"}
                                        </p>
                                        <div class="w-[20%] pl-2 flex items-center justify-between">
                                            <div class="w-fit h-full flex rounded-md {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}">
                                                <input bind:value={assignment.edit.score} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-right mx-[0.22rem] bg-zinc-100 bg-opacity-0">/
                                                <input bind:value={assignment.edit.total} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-left mx-[0.22rem] bg-zinc-100 bg-opacity-0">
                                            </div>
                                            <button aria-label="Delete" on:click|preventDefault|stopPropagation={() => { category.assignments.splice(i, 1); categories = categories; }} class="scale-75 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"} -my-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                                            </button>
                                        </div>
                                    {:else if width > 800}
                                        <p class="w-1/3">
                                            <input bind:value={assignment.name} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} placeholder="Untitled" class="w-full bg-zinc-100 bg-opacity-0">
                                        </p>
                                        <div class="w-1/5"></div>
                                        <p class="w-1/6">
                                            {!assignment.edit.score || (assignment.edit.total == "0" || assignment.edit.total == 0) ? "" : (assignment.edit.score / assignment.edit.total * 100).toFixed(2) + "%"}
                                        </p>
                                        <div class="w-[30%] pl-2 flex items-center justify-between">
                                            <div class="w-fit h-full flex rounded-md {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}">
                                                <input bind:value={assignment.edit.score} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-right mx-[0.22rem] bg-zinc-100 bg-opacity-0">/
                                                <input bind:value={assignment.edit.total} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-left mx-[0.22rem] bg-zinc-100 bg-opacity-0">
                                            </div>
                                            <button aria-label="Delete" on:click|preventDefault|stopPropagation={() => { category.assignments.splice(i, 1); categories = categories; }} class="scale-75 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"} -my-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                                            </button>
                                        </div>
                                    {:else if width > 640}
                                        <p class="w-1/2">
                                            <input bind:value={assignment.name} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} placeholder="Untitled" class="w-full bg-zinc-100 bg-opacity-0">
                                        </p>
                                        <p class="w-1/6">
                                            {!assignment.edit.score || (assignment.edit.total == "0" || assignment.edit.total == 0) ? "" : (assignment.edit.score / assignment.edit.total * 100).toFixed(2) + "%"}
                                        </p>
                                        <div class="w-1/3 pl-2 flex items-center justify-between">
                                            <div class="w-fit h-full flex rounded-md {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}">
                                                <input bind:value={assignment.edit.score} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-right mx-[0.22rem] bg-zinc-100 bg-opacity-0">/
                                                <input bind:value={assignment.edit.total} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-left mx-[0.22rem] bg-zinc-100 bg-opacity-0">
                                            </div>
                                            <button aria-label="Delete" on:click|preventDefault|stopPropagation={() => { category.assignments.splice(i, 1); categories = categories; }} class="scale-75 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"} -my-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                                            </button>
                                        </div>
                                    {:else}
                                        <p class="w-[62%]">
                                            <input bind:value={assignment.name} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} placeholder="Untitled" class="w-full bg-zinc-100 bg-opacity-0">
                                        </p>
                                        <div class="w-[38%] pl-2 flex items-center justify-between">
                                            <div class="w-fit h-full flex rounded-md {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}">
                                                <input bind:value={assignment.edit.score} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-right mx-[0.22rem] bg-zinc-100 bg-opacity-0">/
                                                <input bind:value={assignment.edit.total} on:keydown={(event) => { if(event.keyCode == 13) { event.preventDefault(); } }} class="w-10 text-left mx-[0.22rem] bg-zinc-100 bg-opacity-0">
                                            </div>
                                            <button aria-label="Delete" on:click|preventDefault|stopPropagation={() => { category.assignments.splice(i, 1); categories = categories; }} class="scale-75 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"} -my-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                                            </button>
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        {:else}
                            {#if !edit}
                                {#if final}
                                    <div class="bg-blue-400 bg-opacity-15 overflow-visible rounded-md px-5 py-3 pt-4 mt-2">
                                        <p class="text-sm font-bold uppercase mb-1.5">Recommended</p>
                                        
                                        <p class="mb-1">Test how many points you need to get an A by creating a fake final:</p>

                                        <div class="w-full h-[42.5px]"></div>

                                        <div class="{$settings.mode == 'dark' ? "bg-zinc-900" : $settings.mode == 'light' ? "bg-zinc-100" : "bg-zinc-100 dark:bg-zinc-900"} w-full absolute left-0 z-[1] bottom-0 rounded-md">
                                            <button on:click|preventDefault|stopPropagation={() => { category.assignments.push({ edit: { score: "", total: 100 }, weight: 1, percent: -1, name: "Final", fake: true, final: true }); categories = categories; }} class="w-full px-4 text-left flex gap-1 {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-20" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-20" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-20 dark:bg-opacity-20"} p-3 rounded-md">
                                                <div class="scale-[.85] {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
                                                </div>
                                                Add Final
                                            </button>
                                        </div>
                                    </div>
                                {:else}
                                    <p class="mt-4 text-lg font-bold {$settings.mode == 'dark' ? "text-red-400 " : $settings.mode == 'light' ? "text-red-700": "text-red-700 dark:text-red-400 "}">No Assignments</p>
                                {/if}
                            {/if}
                        {/each}
                        {#if edit}
                            <button on:click|preventDefault|stopPropagation={() => { category.assignments.push({ edit: { score: 0, total: 0 }, weight: 1, percent: -1, name: "", fake: true }); categories = categories; }} class="w-full px-4 text-left mt-2 flex gap-1 {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"} p-3 rounded-md">
                                <div class="scale-[.85] {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
                                </div>
                                Add
                            </button>
                        {/if}
                    </div>
                {/if}
            {/each}

            {#if edit}
                <button on:click|preventDefault|stopPropagation={() => { categories.push({ name: "", edit: { weight: 0, points: 0, total: 0, percent: 0}, assignments: [], fake: true  }); categories = categories; }} class="w-full px-4 text-left mt-12 flex gap-1 {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"} p-3 rounded-md">
                    <div class="scale-[.85] {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
                    </div>
                    Add Category
                </button>
            {/if}
        {/if}

        <div class="flex justify-between">
            <p class="mt-6 text-sm opacity-75">Please report any issues <a href="https://docs.google.com/forms/d/e/1FAIpQLScMri2JCO1lXSXup-gbzKg-5OaOeiDh8e_R09Zh0EU8z7J8qg/viewform" class="underline">here</a>.</p>
            <p class="mt-6 text-sm opacity-75">Aeries Grades+</p>
        </div>
    </div>
{/if}