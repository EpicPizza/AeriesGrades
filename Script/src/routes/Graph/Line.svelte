<script>
    import * as d3 from "d3";

    export let stats;
    export let xAccessorScaled;
    export let yAccessorScaled;
    export let mode;

    const interpolation = d3.curveMonotoneX;

    $: lineGenerator = d3
        .line()
        .x(xAccessorScaled)
        .y(yAccessorScaled)
        .curve(interpolation);

    $: line = lineGenerator(stats);
</script>

<path class="fill-none stroke-[3] {mode == 'dark' ? 'stroke-zinc-300' : mode == 'light' ? 'stroke-zinc-700' : 'stroke-zinc-700 dark:stroke-zinc-300'}" style="stroke-linecap: round !important;" d={line} />