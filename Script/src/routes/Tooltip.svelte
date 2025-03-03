<script>
    import Portal from "svelte-portal";
    import { fade } from "svelte/transition";

    export let started;
    export let settings;

    $: {
        if($started) {
            start();
        }
    }

    function start() {
        update();
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
    let onTooltip = false;
</script>

<svelte:window on:resize={() => { update(); }} bind:innerHeight={windowHeight} bind:innerWidth={windowWidth} on:scroll={(e) => { update(); }} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div on:mouseenter={() => { visible = true; }} on:mouseleave={() => { visible = false; }} bind:this={element} class="w-fit">
    <slot name="element"></slot>
</div>

<Portal target="body">
    {#if visible || onTooltip}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div on:mouseenter={() => { onTooltip = true; }} on:mouseleave={() => { onTooltip = false; }} transition:fade={{ delay: 250, duration: 100 }} class="{$settings.mode == 'dark' ? "bg-zinc-950 text-white " : $settings.mode == 'light' ? "bg-white text-black " : "bg-white dark:bg-zinc-950 shadow-sm dark:shadow-2xl text-black dark:text-white"} rounded-lg w-fit fixed" style="top: {scrollY + height}px; left: {scrollX}px;">
            <slot name="tooltip"></slot>
        </div>
    {/if}
</Portal>