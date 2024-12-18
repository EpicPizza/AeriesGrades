<script>
    import * as d3 from "d3";

    export let yScale;
    export let innerWidth;
    export let hoveredPoint;
    export let label;
    export let mode;

    const formatTick = d3.format(".2s");

    const numberOfTicks = (pixelsAvailable, pixelsPerTick = 60) =>
        Math.floor(Math.abs(pixelsAvailable) / pixelsPerTick);

    $: [yMin, yMax] = yScale.range();

    $: ticks = yScale.ticks(numberOfTicks(yMax - yMin));
</script>

<g>
    {#each ticks as tick}
        <g transform={`translate(0 ${yScale(tick)})`}>
            <line
                x1={0}
                x2={innerWidth}
                class="{mode == 'dark' ? 'stroke-zinc-700' : mode == 'light' ? 'stroke-zinc-400' : 'stroke-zinc-400 dark:stroke-zinc-700'}"
                stroke-opacity="0.5"
            />
            <text
                dx={-10}
                dy="0.34em"
                text-anchor="end"
                class={mode == 'dark' ? (hoveredPoint ? 'fill-zinc-600' : 'fill-zinc-300') : mode == 'light' ? (hoveredPoint ? 'fill-zinc-400' : 'fill-zinc-800') : (hoveredPoint ? 'fill-zinc-400 dark:fill-zinc-600' : 'fill-zinc-800 dark:fill-zinc-300')}
            >
                {formatTick(tick)}
            </text>
        </g>
    {/each}
    <text dx={-10} y={-35} dy="0.8em" text-anchor="end" class="{mode == 'dark' ? 'fill-zinc-300' : mode == 'light' ? 'fill-zinc-800' : 'fill-zinc-800 dark:fill-zinc-300'}">
        {label}
    </text>
</g>
