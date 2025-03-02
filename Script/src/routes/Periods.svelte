<script>
    import { getContext } from "svelte";
    import { fade, fly, slide } from "svelte/transition";
    import { persisted } from 'svelte-persisted-store'

    export let started;
    export let settings;
    export let defaultKeywords;

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

            period.term = card.parentElement.parentElement.previousElementSibling.children[3].innerText;
            period.number = card.parentElement.parentElement.previousElementSibling.children[4].innerText;

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
                }

                if(child.className.includes("footer") && 'innerText' in child.children[1]) {

                    period.missing = parseInt(child.children[1].innerText);
                }
            }

            const url = new URL(location.href.substring(0, location.href.lastIndexOf("/") + 1) + "GradebookDetails.aspx");
            url.searchParams.set("class", period.name);
            url.searchParams.set("term", period.term);
            url.searchParams.set("period", period.number);

            period.url = url.toString();

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
    }
    

    let grid;
    let periods = new Array();

    let settingsOpen = false;
    
    //{settings.mode == 'dark' ? "" : $settings.mode == 'light' ? "" : ""}
</script>

<div class="hidden" id="hook">{JSON.stringify({ periods: classes })}</div>

<div class="p-8 {$settings.mode == 'dark' ? "bg-zinc-900 text-white" : $settings.mode == 'light' ? "bg-zinc-100 text-black" : "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white"}  h-full w-full relative">
    <div class="mb-4 flex items-start justify-between">
        <h1 class="text-3xl">Gradebook</h1>
        <button on:click|preventDefault={() => { settingsOpen = true;  }} class="px-4 py-3 transition-all rounded-md {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}">
            <div class="inline-block translate-y-2 -mt-2 scale-75 mr-1 {$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg>
            </div>
            Settings
        </button>
    </div>

    {#if settingsOpen}
        <button transition:fade={{ duration: 100 }} on:click|preventDefault|stopPropagation={() => { settingsOpen = false; }} aria-label="Close Settings" class="{$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-25" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-25" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-25 dark:bg-opacity-25 "}  w-full h-full absolute z-[3] left-0 top-0">

        </button>

        <div transition:fade={{ duration: 100 }} class="absolute z-[5] p-6 {$settings.mode == 'dark' ? "bg-zinc-900" : $settings.mode == 'light' ? "bg-zinc-100" : "bg-zinc-100 dark:bg-zinc-900"} rounded-3xl max-w-[calc(100%-2rem)] w-[36rem] min-h-[24rem] max-h-[calc(100%-6rem)] left-1/2 top-10 -translate-x-1/2 overflow-auto">
            <p class="text-2xl font-bold mb-4">Settings</p>

            <div class="flex items-center justify-between relative">
                <p class="text-lg">Appearance</p>

                <select bind:value={$settings.mode} name="mode" id="mode" class="disabled:cursor-not-allowed {$settings.mode == 'dark' ? "text-white bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "text-black bg-zinc-900 bg-opacity-10" : "text-black dark:text-white bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"} rounded-md text-lg px-3 pr-8 py-1.5  bg-none w-28">
                    <option value="default">System</option>
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                </select>     
                
                <div class="{$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"} absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-360 280-560h400L480-360Z"/></svg>
                </div>
            </div>

            <div class="flex items-center justify-between relative mt-2">
                <p class="text-lg">Mark Zeros as Missing</p>

                <select bind:value={$settings.zeros} name="zeros" id="zeros" class="disabled:cursor-not-allowed {$settings.mode == 'dark' ? "text-white bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "text-black bg-zinc-900 bg-opacity-10" : "text-black dark:text-white bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"} rounded-md text-lg px-3 pr-8 py-1.5  bg-none w-28">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                </select>     
                
                <div class="{$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"} absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-360 280-560h400L480-360Z"/></svg>
                </div>
            </div>

            <div class="flex items-center justify-between relative mt-2">
                <p class="text-lg">Developer Mode</p>

                <select bind:value={$settings.developer} name="developer" id="developer" class="disabled:cursor-not-allowed {$settings.mode == 'dark' ? "text-white bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "text-black bg-zinc-900 bg-opacity-10" : "text-black dark:text-white bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"} rounded-md text-lg px-3 pr-8 py-1.5  bg-none w-28">
                    <option value="off">Off</option>
                    <option value="on">On</option>
                </select>     
                
                <div class="{$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"} absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-360 280-560h400L480-360Z"/></svg>
                </div>
            </div>

            <div class="relative mt-3">
                <p class="text-lg mb-2">Keywords for Final Calculation</p>
                <p class="mb-4 opacity-75">If one of these keywords are found in the category name, it will show the final calculation box. Seperate keywords by comma.</p>

                <textarea bind:value={$settings.keywords} class="disabled:cursor-not-allowed w-full min-h-[8rem] rounded-lg p-3 {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 bg-opacity-10 dark:bg-zinc-100 dark:bg-opacity-10"}"></textarea>
                
                {#if $settings.edited}
                    <button on:click|preventDefault={() => { $settings.keywords = defaultKeywords.keywords; $settings.edited = false; }} class="absolute top-0.5 opacity-75 right-0 flex items-center">
                        Reset
                        <div class="scale-75 inline-block {$settings.mode === "dark" ? "fill-white" : $settings.mode === "light" ? "fill-black" : "fill-black dark:fill-white"} -mb-0.5 -my-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
                        </div>
                    </button>
                {/if}
            </div>

            <p class="mt-2 text-right text-sm opacity-75">Version 0.5.1</p>
        
            <button aria-label="Close Settings" on:click|preventDefault={() => { settingsOpen = false }} class="p-1 transition-all rounded-full {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"} absolute top-6 right-6">
                <div class="{$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"}">
                    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                </div>
            </button>
        </div>
    {/if}

    {#each sets as set}
        {@const classes = set.classes}

        <p class="mb-4 text-xl font-bold">{set.label}:</p>

        <!-- Cannot use .grid since it will collide with another grid with class .grid aeries uses for dashboard. -->
        <div bind:this={grid} style="display: grid;" class="grid-cols-1 mb-6 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
            {#each classes as period, i}
                <a bind:this={periods[i]} href={period.url} class="{$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"} rounded-lg p-6 w-full flex gap-2 text-left">
                    <div class="w-full">
                        <p class="text-xl mb-2">{period.name}</p>
                        <p class="opacity-75 mb-1">{period.teacher}</p>
                        <p class="opacity-75">Missing: {period.missing}</p>
                    </div>
                    <div class="flex flex-col justify-around min-h-full">
                        <div class="flex flex-col items-center w-12 {
                        $settings.mode == 'dark' ? (period.grade >= 90 ? "text-green-400" : period.grade >= 80 ? "text-yellow-400" : period.grade >= 70 ? "text-orange-400" : period.grade > 0 ? "text-red-400" : "ext-white") : 
                        $settings.mode == 'light' ? (period.grade >= 90 ? "text-green-700" : period.grade >= 80 ? "text-yellow-700" : period.grade >= 70 ? "text-orange-700" : period.grade > 0 ? "text-red-700" : "text-black") : 
                        (period.grade >= 90 ? "text-green-700 dark:text-green-400" : period.grade >= 80 ? "text-yellow-700 dark:text-yellow-400" : period.grade >= 70 ? "text-orange-700 dark:text-orange-400" : period.grade > 0 ? "text-red-700 dark:text-red-400" : "text-black dark:text-white")}">
                            <p class="text-3xl font-extrabold whitespace-nowrap">{period.letter}</p>
                            <p class="text-lg font-bold">{period.grade}</p>
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    {/each}

    <div class="flex justify-between">
        <p class="text-sm opacity-75">Please report any issues <a href="https://docs.google.com/forms/d/e/1FAIpQLScMri2JCO1lXSXup-gbzKg-5OaOeiDh8e_R09Zh0EU8z7J8qg/viewform" class="underline">here</a>.</p>
        <p class="text-sm opacity-75">Aeries Grades+</p>
    </div>
</div>