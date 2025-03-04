<script>
    import { getContext } from "svelte";
    import { fade, fly, slide } from "svelte/transition";
    import { getPeriods, scrapPeriods } from "./periods";
    import Portal from "svelte-portal";

    export let period;
    export let started;
    export let settings;
    export let small = false;

    $: {
        if($started) {
            start();
        }
    }
    
    let sets = [];
    let loading = false;

    async function start() {
        sets = await getPeriods();

        loading = false;
    }

    function update() {
        if(!element) return;

        scrollY = element.getBoundingClientRect().y;
        scrollX = element.getBoundingClientRect().x;
        height = element.getBoundingClientRect().height;
    }

    let element;
    let scrollY;
    let scrollX;
    let windowHeight;
    let windowWidth;
    let height;

    let visible = false;
</script>

<svelte:window on:click={(e) => {
    if(visible && !element.contains(e.target)) {
        visible = false;
    }
}} on:resize={() => { update(); }} bind:innerHeight={windowHeight} bind:innerWidth={windowWidth} on:scroll={(e) => { update(); }} />

<button bind:this={element} on:click|preventDefault={() => { visible = !visible; }} class="h-[45.5px] px-4 pr-10 {small ? "w-full max-w-full" : "min-w-[20rem]"} relative flex justify-between items-center rounded-md border-2 {$settings.mode == 'light' ? "bg-white border-zinc-300" : $settings.mode == 'dark' ? "bg-zinc-950 border-zinc-700" : "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"}">
    {#if period.name == ""}
        <p class="italic">Loading...</p>
    {:else}
        <div>{period.name}</div>

        <p class="text-base font-bold {
            $settings.mode == 'dark' ? (period.grade >= 90 ? "text-green-400" : period.grade >= 80 ? "text-yellow-400" : period.grade >= 70 ? "text-orange-400" : period.grade > 0 ? "text-red-400" : "ext-white") : 
            $settings.mode == 'light' ? (period.grade >= 90 ? "text-green-700" : period.grade >= 80 ? "text-yellow-700" : period.grade >= 70 ? "text-orange-700" : period.grade > 0 ? "text-red-700" : "text-black") : 
            (period.grade >= 90 ? "text-green-700 dark:text-green-400" : period.grade >= 80 ? "text-yellow-700 dark:text-yellow-400" : period.grade >= 70 ? "text-orange-700 dark:text-orange-400" : period.grade > 0 ? "text-red-700 dark:text-red-400" : "text-black dark:text-white")}">{period.letter} ({period.grade}%)</p>
    {/if}

    <div class="{$settings.mode == 'dark' ? "fill-white" : $settings.mode == 'light' ? "fill-black" : "fill-black dark:fill-white"} absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <div class="{visible ? "rotate-180" : "rotate-0"}">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-360 280-560h400L480-360Z"/></svg>
        </div>
    </div>
</button>

<Portal target="body">
    {#if visible}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="border-2 rounded-md overflow-y-auto mt-2 px-4 pb-1 {small ? "w-[calc(100%-4rem)] max-w-[calc(100%-4rem)] sm:hidden block" : "min-w-[20rem] w-fit hidden sm:block"} fixed {$settings.mode == 'light' ? "bg-white border-zinc-300 text-black" : $settings.mode == 'dark' ? "bg-zinc-950 border-zinc-700 text-white" : "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 text-black dark:text-white"}" style="top: {scrollY + height}px; left: {scrollX}px; max-height: {windowHeight - (scrollY + height + 8)}px;">
            {#if loading}
                <p class="py-3 italic">
                    Loading...
                </p>
            {:else}
                {#each sets as set, i}
                    {@const classes = set.classes}

                    <p class="{i == 0 ? "mt-3" : "mt-6"} mb-1 text-sm font-bold opacity-75">{set.label}:</p>

                    {#each classes as period}
                        <a class="flex items-center justify-between h-[45.5px] w-[calc(100%+1rem)] -mx-2 px-2 rounded-md {$settings.mode == 'dark' ? 'bg-white bg-opacity-0 hover:bg-opacity-10' : $settings.mode == 'dark' ? 'bg-black bg-opacity-0 hover:bg-opacity-10' : 'bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10'}" href={period.url}>
                            <div>{period.name}</div>

                            <p class="text-base font-bold {
                                $settings.mode == 'dark' ? (period.grade >= 90 ? "text-green-400" : period.grade >= 80 ? "text-yellow-400" : period.grade >= 70 ? "text-orange-400" : period.grade > 0 ? "text-red-400" : "ext-white") : 
                                $settings.mode == 'light' ? (period.grade >= 90 ? "text-green-700" : period.grade >= 80 ? "text-yellow-700" : period.grade >= 70 ? "text-orange-700" : period.grade > 0 ? "text-red-700" : "text-black") : 
                                (period.grade >= 90 ? "text-green-700 dark:text-green-400" : period.grade >= 80 ? "text-yellow-700 dark:text-yellow-400" : period.grade >= 70 ? "text-orange-700 dark:text-orange-400" : period.grade > 0 ? "text-red-700 dark:text-red-400" : "text-black dark:text-white")}">{period.letter} ({period.grade}%)</p>
                        </a>
                    {/each}
                {/each}
            {/if}
        </div>
    {/if}
</Portal>