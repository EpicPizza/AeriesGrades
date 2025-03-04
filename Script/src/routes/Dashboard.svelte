<script>
    import { getContext } from "svelte";
    import { fade, fly, slide } from "svelte/transition";
    import { persisted } from 'svelte-persisted-store'
    import { getPeriods, scrapPeriods } from "./periods";

    export let started;
    export let settings;

    $: {
        if($started) {
            start();
        }
    }

    let sets = [];

    let loading = true;

    async function start() {
        const fetched = await getPeriods();

        console.log(fetched);

        sets = fetched.length == 0 ? [] : [ fetched[0] ];

        loading = false;

        await new Promise(resolve => setTimeout(resolve, 200));

        window.dispatchEvent(new Event('resize'));
    }
    

    let grid;
    let periods = new Array();
    
    //{settings.mode == 'dark' ? "" : $settings.mode == 'light' ? "" : ""}
</script>

<div class="p-8 {$settings.mode == 'dark' ? "bg-zinc-900 text-white" : $settings.mode == 'light' ? "bg-zinc-100 text-black" : "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white"}  h-full w-full relative rounded-lg">

    <a class="px-4 py-3 mb-6 w-fit block rounded-md {$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"}" href={location.href.substring(0, location.href.lastIndexOf("/") + 1) + "GradebookSummary.aspx"}>
        View All Grades
    </a>

    {#if loading}
        <div class="w-full mt-8 mb-2 p-4 flex items-center justify-around">
            <p class="text-xl font-bold">Loading...</p>
        </div>
    {/if}

    {#each sets as set}
        {@const classes = set.classes}

        <p class="mb-4 text-xl font-bold">{set.label}:</p>

        <!-- Cannot use .grid since it will collide with another grid with class .grid aeries uses for dashboard. -->
        <div bind:this={grid} style="display: grid;" class="grid-cols-1 mb-6 sm:grid-cols-2 md:grid-cols-3 gap-2 w-full">
            {#each classes as period, i}
                <a bind:this={periods[i]} href={period.url} on:click={() => { localStorage.setItem("navigating", "true"); }} class="{$settings.mode == 'dark' ? "bg-zinc-100 bg-opacity-10" : $settings.mode == 'light' ? "bg-zinc-900 bg-opacity-10" : "bg-zinc-900 dark:bg-zinc-100 bg-opacity-10 dark:bg-opacity-10"} rounded-lg p-4 w-full flex gap-2 text-left">
                    <div class="w-full">
                        <p class="text-lg mb-2">{period.name}</p>
                        <p class="opacity-75 mb-1 text-sm">{period.teacher}</p>
                        <p class="opacity-75 text-sm">Missing: {period.missing}</p>
                    </div>
                    <div class="flex flex-col justify-around min-h-full">
                        <div class="flex flex-col items-center w-12 {
                        $settings.mode == 'dark' ? (period.grade >= 90 ? "text-green-400" : period.grade >= 80 ? "text-yellow-400" : period.grade >= 70 ? "text-orange-400" : period.grade > 0 ? "text-red-400" : "ext-white") : 
                        $settings.mode == 'light' ? (period.grade >= 90 ? "text-green-700" : period.grade >= 80 ? "text-yellow-700" : period.grade >= 70 ? "text-orange-700" : period.grade > 0 ? "text-red-700" : "text-black") : 
                        (period.grade >= 90 ? "text-green-700 dark:text-green-400" : period.grade >= 80 ? "text-yellow-700 dark:text-yellow-400" : period.grade >= 70 ? "text-orange-700 dark:text-orange-400" : period.grade > 0 ? "text-red-700 dark:text-red-400" : "text-black dark:text-white")}">
                            <p class="text-2xl font-extrabold whitespace-nowrap">{period.letter}</p>
                            <p class="text-base font-bold">{period.grade}</p>
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    {/each}

    <div class="flex justify-between pt-3">
        <p class="text-sm opacity-75">Please report any issues <a href="https://docs.google.com/forms/d/e/1FAIpQLScMri2JCO1lXSXup-gbzKg-5OaOeiDh8e_R09Zh0EU8z7J8qg/viewform" class="underline">here</a>.</p>
        <p class="text-sm opacity-75">Aeries Grades+</p>
    </div>
</div>